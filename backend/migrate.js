const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function runMigration() {
  console.log("Starting Enterprise College Database Upgrade...");

  const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "college_event_management",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

  const conn = await pool.getConnection();

  try {
    console.log("Connected to MySQL server.");

    // Helper to safely add column
    const addColumnIfNotExists = async (table, columnDef, colName) => {
      try {
        const [cols] = await conn.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [colName]);
        if (cols.length === 0) {
          await conn.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
          console.log(`Added column ${colName} to ${table}`);
        }
      } catch (err) {
        console.warn(`Note on ${table}.${colName}:`, err.message);
      }
    };

    // 1. Upgrade `users` table
    await addColumnIfNotExists("users", "department VARCHAR(100) DEFAULT 'Computer Science & Engineering'", "department");
    await addColumnIfNotExists("users", "roll_number VARCHAR(50) DEFAULT NULL", "roll_number");
    await addColumnIfNotExists("users", "phone VARCHAR(20) DEFAULT NULL", "phone");
    await addColumnIfNotExists("users", "year_of_study VARCHAR(20) DEFAULT '3rd Year'", "year_of_study");
    await addColumnIfNotExists("users", "avatar_url VARCHAR(255) DEFAULT NULL", "avatar_url");
    await addColumnIfNotExists("users", "is_active BOOLEAN DEFAULT TRUE", "is_active");

    // 2. Create `venues` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS venues (
        venue_id INT AUTO_INCREMENT PRIMARY KEY,
        venue_name VARCHAR(150) NOT NULL UNIQUE,
        building VARCHAR(100) NOT NULL,
        floor VARCHAR(50) DEFAULT 'Ground Floor',
        capacity INT NOT NULL,
        amenities TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Verified 'venues' table.");

    // 3. Create `clubs` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS clubs (
        club_id INT AUTO_INCREMENT PRIMARY KEY,
        club_name VARCHAR(150) NOT NULL UNIQUE,
        category_id INT,
        department VARCHAR(100) DEFAULT 'General',
        lead_user_id INT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Verified 'clubs' table.");

    // 4. Upgrade `events` table
    await addColumnIfNotExists("events", "end_date DATETIME DEFAULT NULL", "end_date");
    await addColumnIfNotExists("events", "venue_id INT DEFAULT NULL", "venue_id");
    await addColumnIfNotExists("events", "club_id INT DEFAULT NULL", "club_id");
    await addColumnIfNotExists("events", "status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'approved'", "status");
    await addColumnIfNotExists("events", "approval_remarks TEXT DEFAULT NULL", "approval_remarks");
    await addColumnIfNotExists("events", "banner_url VARCHAR(500) DEFAULT NULL", "banner_url");
    await addColumnIfNotExists("events", "tags VARCHAR(255) DEFAULT 'Campus,Tech'", "tags");
    await addColumnIfNotExists("events", "registration_deadline DATETIME DEFAULT NULL", "registration_deadline");
    await addColumnIfNotExists("events", "certificate_enabled BOOLEAN DEFAULT TRUE", "certificate_enabled");

    // 5. Create `event_schedules` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS event_schedules (
        schedule_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        session_title VARCHAR(200) NOT NULL,
        speaker_name VARCHAR(150) DEFAULT NULL,
        venue_details VARCHAR(150) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
      )
    `);
    console.log("Verified 'event_schedules' table.");

    // 6. Upgrade `registrations` table
    await addColumnIfNotExists("registrations", "ticket_code VARCHAR(64) DEFAULT NULL", "ticket_code");
    await addColumnIfNotExists("registrations", "attended_at DATETIME DEFAULT NULL", "attended_at");
    await addColumnIfNotExists("registrations", "checked_in_by INT DEFAULT NULL", "checked_in_by");
    await addColumnIfNotExists("registrations", "waitlist_position INT DEFAULT 0", "waitlist_position");

    // Modify registration status column enum if needed
    try {
      await conn.query(`
        ALTER TABLE registrations 
        MODIFY COLUMN status ENUM('registered', 'waitlisted', 'cancelled', 'attended') DEFAULT 'registered'
      `);
    } catch (e) {
      console.warn("Status enum modification note:", e.message);
    }

    // 7. Create `feedback_reviews` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS feedback_reviews (
        feedback_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        student_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_feedback (event_id, student_id),
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log("Verified 'feedback_reviews' table.");

    // 8. Create `certificates` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        certificate_id INT AUTO_INCREMENT PRIMARY KEY,
        registration_id INT NOT NULL UNIQUE,
        event_id INT NOT NULL,
        student_id INT NOT NULL,
        certificate_number VARCHAR(100) NOT NULL UNIQUE,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations(registration_id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log("Verified 'certificates' table.");

    // 9. Create `announcements` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        announcement_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT DEFAULT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        priority ENUM('normal', 'urgent') DEFAULT 'normal',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Verified 'announcements' table.");

    // 10. Create `audit_logs` table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Verified 'audit_logs' table.");

    // 11. Seed default venues if none exist
    const [existingVenues] = await conn.query("SELECT COUNT(*) as count FROM venues");
    if (existingVenues[0].count === 0) {
      await conn.query(`
        INSERT INTO venues (venue_name, building, floor, capacity, amenities) VALUES
        ('APJ Abdul Kalam Auditorium', 'Main Administrative Block', '1st Floor', 600, 'Central AC, 4K Projector, JBL Line-Array Audio, Stage Lighting'),
        ('Sir MV Seminar Hall', 'Engineering Wing A', 'Ground Floor', 150, 'Smart Board, High-Speed Wi-Fi, Wireless Mic System'),
        ('Ada Lovelace Computing Lab', 'Computer Science Block', '2nd Floor', 80, '80 High-End Workstations, Gigabit LAN, Overhead Projector'),
        ('Tagore Open Air Amphitheatre', 'Campus Student Square', 'Outdoor', 1200, 'Acoustic Shell, Concert Lighting, Wide Stage'),
        ('University Indoor Sports Complex', 'Athletics & Recreation Block', 'Ground Floor', 400, 'Synthetic Court, Electronic Scoreboard, Spectator Gallery'),
        ('Design & Innovation Hub', 'Mechanical Engineering Block', '3rd Floor', 75, '3D Printers, Laser Cutters, Collaborative Pods')
      `);
      console.log("Seeded default college venues.");
    }

    // 12. Seed default clubs if none exist
    const [existingClubs] = await conn.query("SELECT COUNT(*) as count FROM clubs");
    if (existingClubs[0].count === 0) {
      await conn.query(`
        INSERT INTO clubs (club_name, department, description) VALUES
        ('ACM Student Chapter', 'Computer Science & Engineering', 'Premier student computing society hosting hackathons, coding contests, and tech talks.'),
        ('IEEE Student Branch', 'Electronics & Electrical', 'Advancing technology through robotics workshops, project expos, and global summits.'),
        ('Campus Cultural Guild (Dhwani)', 'General Student Affairs', 'Vibrant community for performing arts, music, dance, dramatics, and literature.'),
        ('University Sports Council', 'Physical Education', 'Organizing inter-college tournaments, athletic leagues, and fitness bootcamps.'),
        ('GDG On Campus (Google Developer Group)', 'Information Technology', 'Student developer community exploring Android, Cloud, Web, and Generative AI.')
      `);
      console.log("Seeded default college clubs.");
    }

    // 13. Ensure all registrations have unique ticket codes
    const [regsWithoutCode] = await conn.query("SELECT registration_id FROM registrations WHERE ticket_code IS NULL OR ticket_code = ''");
    for (const reg of regsWithoutCode) {
      const code = "PASS-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      await conn.query("UPDATE registrations SET ticket_code = ? WHERE registration_id = ?", [code, reg.registration_id]);
    }
    if (regsWithoutCode.length > 0) {
      console.log(`Generated ticket codes for ${regsWithoutCode.length} existing registrations.`);
    }

    // 14. Ensure sample users have roll numbers & departments
    await conn.query(`
      UPDATE users 
      SET roll_number = CONCAT('CS22B', LPAD(user_id, 3, '0')),
          department = COALESCE(department, 'Computer Science & Engineering'),
          phone = COALESCE(phone, CONCAT('+91 98765 ', LPAD(user_id * 111, 5, '0')))
      WHERE roll_number IS NULL OR roll_number = ''
    `);
    console.log("Populated roll numbers & departments for users.");

    // 15. Ensure sample users with plain passwords get valid bcrypt hashes so login works
    const [allUsers] = await conn.query("SELECT user_id, password FROM users");
    for (const u of allUsers) {
      if (!u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) {
        const hashed = await bcrypt.hash(u.password, 10);
        await conn.query("UPDATE users SET password = ? WHERE user_id = ?", [hashed, u.user_id]);
        console.log(`Hashed legacy plaintext password for user_id ${u.user_id}`);
      }
    }

    // 16. Attach default venue_id to existing events if NULL
    await conn.query("UPDATE events SET venue_id = 1 WHERE venue_id IS NULL");
    // Ensure all existing events have status 'approved'
    await conn.query("UPDATE events SET status = 'approved' WHERE status IS NULL OR status = ''");
    console.log("Linked events to campus venues and set approved status.");

    // 17. Seed event schedules for Hackathon (event_id 1) if empty
    const [schedules] = await conn.query("SELECT COUNT(*) as count FROM event_schedules");
    if (schedules[0].count === 0) {
      await conn.query(`
        INSERT INTO event_schedules (event_id, start_time, end_time, session_title, speaker_name, venue_details, description) VALUES
        (1, '09:00 AM', '10:00 AM', 'Check-In & Breakfast', 'Organizing Team', 'Main Lobby', 'Badge distribution and team kit handover'),
        (1, '10:00 AM', '11:00 AM', 'Keynote & Problem Release', 'Dr. Radhakrishnan (HOD CSE)', 'Main Stage', 'Announcement of track themes and evaluation criteria'),
        (1, '11:00 AM', '01:30 PM', 'Hacking Sprint 1', 'Mentors from Industry', 'Lab 1 & 2', 'Initial architecture review and mentorship check-ins'),
        (1, '01:30 PM', '02:30 PM', 'Networking Lunch', 'Campus Catering', 'Cafeteria', 'Buffet lunch for all registered participants'),
        (1, '02:30 PM', '06:00 PM', 'Hacking Sprint 2 & Mid-way Demos', 'Mentors', 'Lab 1 & 2', 'Prototype validation and milestone checkpoints'),
        (1, '06:00 PM', '07:30 PM', 'Final Pitches & Award Ceremony', 'Jury Panel', 'Auditorium', 'Top 5 finalist presentations and prize distribution')
      `);
      console.log("Seeded default event schedules.");
    }

    // 18. Seed announcements if empty
    const [annCount] = await conn.query("SELECT COUNT(*) as count FROM announcements");
    if (annCount[0].count === 0) {
      await conn.query(`
        INSERT INTO announcements (title, content, priority, created_by) VALUES
        ('Campus Event Guidelines 2026', 'All student attendees are required to present their digital QR pass at the entrance. Duty leaves will be credited automatically upon check-in.', 'normal', 6),
        ('Annual Tech Fest Registrations Open', 'Registrations for the University Hackathon and Workshops are now live. Seats are limited due to lab capacities.', 'urgent', 6)
      `);
      console.log("Seeded initial announcements.");
    }

    // 19. Seed sample feedback reviews if empty
    const [fbCount] = await conn.query("SELECT COUNT(*) as count FROM feedback_reviews");
    if (fbCount[0].count === 0) {
      try {
        await conn.query(`
          INSERT IGNORE INTO feedback_reviews (event_id, student_id, rating, review_text) VALUES
          (1, 1, 5, 'Phenomenal hackathon! The mentorship and cloud credits provided made a huge difference.'),
          (1, 2, 4, 'Very well organized. Looking forward to the next edition.'),
          (4, 1, 5, 'Best hands-on web development workshop so far. Got my certificate instantly!')
        `);
        console.log("Seeded sample student feedback.");
      } catch (e) {
        console.warn("Feedback seed note:", e.message);
      }
    }

    // 20. Create or replace analytical view
    await conn.query(`
      CREATE OR REPLACE VIEW view_event_analytics AS
      SELECT 
          e.event_id,
          e.title,
          e.event_date,
          e.capacity,
          e.status,
          COALESCE(c.category_name, 'General') AS category_name,
          COALESCE(v.venue_name, e.location) AS venue_name,
          u.name AS organizer_name,
          COUNT(CASE WHEN r.status = 'registered' OR r.status = 'attended' THEN 1 END) AS total_registrations,
          COUNT(CASE WHEN r.status = 'attended' THEN 1 END) AS total_attended,
          COUNT(CASE WHEN r.status = 'waitlisted' THEN 1 END) AS total_waitlisted,
          COALESCE(AVG(f.rating), 0) AS average_rating,
          COUNT(DISTINCT f.feedback_id) AS total_reviews
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.category_id
      LEFT JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN users u ON e.organizer_id = u.user_id
      LEFT JOIN registrations r ON e.event_id = r.event_id
      LEFT JOIN feedback_reviews f ON e.event_id = f.event_id
      GROUP BY e.event_id, c.category_name, v.venue_name, e.location, u.name
    `);
    console.log("Verified 'view_event_analytics' view.");

    console.log("=========================================================");
    console.log("DATABASE MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("=========================================================");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

-- ==========================================================
-- College Event Management Platform - Enterprise Upgrade Script
-- Idempotent schema expansion for real-world college use
-- ==========================================================

USE college_event_management;

-- 1. Upgrade `users` table with student & organizer profile attributes
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Computer Science & Engineering',
  ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(20) DEFAULT '3rd Year',
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Campus Venues & Facilities table (with capacity & amenities)
CREATE TABLE IF NOT EXISTS venues (
    venue_id INT AUTO_INCREMENT PRIMARY KEY,
    venue_name VARCHAR(150) NOT NULL UNIQUE,
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(50) DEFAULT 'Ground Floor',
    capacity INT NOT NULL,
    amenities TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Student Clubs & Department Societies
CREATE TABLE IF NOT EXISTS clubs (
    club_id INT AUTO_INCREMENT PRIMARY KEY,
    club_name VARCHAR(150) NOT NULL UNIQUE,
    category_id INT,
    department VARCHAR(100) DEFAULT 'General',
    lead_user_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (lead_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 4. Upgrade `events` table with venue, lifecycle status, banner, tags, certificates
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS end_date DATETIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS venue_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS club_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approval_remarks TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tags VARCHAR(255) DEFAULT 'Campus,Tech',
  ADD COLUMN IF NOT EXISTS registration_deadline DATETIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT TRUE;

-- 5. Event Detailed Agenda / Timeline (Multi-session schedule)
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
);

-- 6. Upgrade `registrations` table with QR ticket code, waitlist, and attendance check-in
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attended_at DATETIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checked_in_by INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS waitlist_position INT DEFAULT 0;

-- Ensure status supports waitlisted and attended
ALTER TABLE registrations 
  MODIFY COLUMN status ENUM('registered', 'waitlisted', 'cancelled', 'attended') DEFAULT 'registered';

-- 7. Post-Event Feedback & Student Reviews
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
);

-- 8. Verifiable Digital Participation Certificates
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
);

-- 9. Campus & Event Announcements
CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('normal', 'urgent') DEFAULT 'normal',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. Administrative Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 11. Relational Analytical Views
CREATE OR REPLACE VIEW view_event_analytics AS
SELECT 
    e.event_id,
    e.title,
    e.event_date,
    e.capacity,
    e.status,
    c.category_name,
    v.venue_name,
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
GROUP BY e.event_id, c.category_name, v.venue_name, u.name;

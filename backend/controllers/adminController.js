const db = require("../config/db");

// Get university-wide KPI metrics and analytics
const getDashboardStats = async (req, res) => {
  try {
    const promiseDb = db.promise();

    // Event counts
    const [eventCounts] = await promiseDb.query(`
      SELECT 
        COUNT(*) AS total_events,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved_events,
        COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) AS pending_approvals,
        COUNT(CASE WHEN event_date >= NOW() AND status = 'approved' THEN 1 END) AS upcoming_events,
        COUNT(CASE WHEN event_date < NOW() THEN 1 END) AS past_events
      FROM events
    `);

    // Registration counts & turnout
    const [regCounts] = await promiseDb.query(`
      SELECT 
        COUNT(*) AS total_registrations,
        COUNT(CASE WHEN status = 'attended' THEN 1 END) AS total_attended,
        COUNT(CASE WHEN status = 'registered' THEN 1 END) AS active_registered,
        COUNT(CASE WHEN status = 'waitlisted' THEN 1 END) AS total_waitlisted,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS total_cancelled
      FROM registrations
    `);

    // User counts
    const [userCounts] = await promiseDb.query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) AS student_count,
        COUNT(CASE WHEN role = 'organizer' THEN 1 END) AS organizer_count,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) AS admin_count
      FROM users
    `);

    // Category distribution
    const [categoryDist] = await promiseDb.query(`
      SELECT c.category_name, COUNT(e.event_id) AS event_count
      FROM categories c
      LEFT JOIN events e ON c.category_id = e.category_id
      GROUP BY c.category_id, c.category_name
      ORDER BY event_count DESC
    `);

    // Top departments by participation
    const [deptStats] = await promiseDb.query(`
      SELECT u.department, COUNT(r.registration_id) AS registration_count
      FROM users u
      JOIN registrations r ON u.user_id = r.student_id
      WHERE u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY registration_count DESC
      LIMIT 6
    `);

    // Recent audit logs
    const [recentLogs] = await promiseDb.query(`
      SELECT a.*, u.name AS user_name, u.role AS user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
      LIMIT 12
    `);

    const reg = regCounts[0];
    const turnoutRate = reg.total_registrations > 0
      ? Math.round((reg.total_attended / (reg.total_attended + reg.active_registered || 1)) * 100)
      : 0;

    res.status(200).json({
      events: eventCounts[0],
      registrations: {
        ...reg,
        turnout_rate: turnoutRate,
      },
      users: userCounts[0],
      category_distribution: categoryDist,
      department_stats: deptStats,
      recent_logs: recentLogs,
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    res.status(500).json({ message: "Failed to fetch admin dashboard statistics" });
  }
};

// Get all users with search and filter
const getAllUsers = async (req, res) => {
  try {
    const { role, search, department } = req.query;
    const promiseDb = db.promise();

    let query = `
      SELECT user_id, name, email, role, department, roll_number, phone, year_of_study, is_active, created_at,
             (SELECT COUNT(*) FROM registrations WHERE student_id = users.user_id) AS registration_count,
             (SELECT COUNT(*) FROM events WHERE organizer_id = users.user_id) AS created_events_count
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== "all") {
      query += " AND role = ?";
      params.push(role);
    }

    if (department && department !== "all") {
      query += " AND department = ?";
      params.push(department);
    }

    if (search && search.trim() !== "") {
      query += " AND (name LIKE ? OR email LIKE ? OR roll_number LIKE ?)";
      const t = `%${search.trim()}%`;
      params.push(t, t, t);
    }

    query += " ORDER BY created_at DESC";

    const [users] = await promiseDb.query(query, params);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users list" });
  }
};

// Update user role or active status (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active, department } = req.body;
    const promiseDb = db.promise();

    await promiseDb.query(
      `UPDATE users
       SET role = COALESCE(?, role),
           is_active = COALESCE(?, is_active),
           department = COALESCE(?, department)
       WHERE user_id = ?`,
      [role, is_active, department, id]
    );

    // Audit log
    await promiseDb.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'USER_UPDATED', ?)",
      [req.user.user_id, `Updated user ID ${id}: role=${role || 'unchanged'}, active=${is_active !== undefined ? is_active : 'unchanged'}`]
    ).catch(() => {});

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// Get audit logs with pagination
const getAuditLogs = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [logs] = await promiseDb.query(`
      SELECT a.*, u.name AS user_name, u.role AS user_role, u.email AS user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUser,
  getAuditLogs,
};

const db = require("../config/db");

const getAnnouncements = async (req, res) => {
  try {
    const { event_id } = req.query;
    const promiseDb = db.promise();

    let query = `
      SELECT a.*, u.name AS author_name, u.role AS author_role, e.title AS event_title
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.user_id
      LEFT JOIN events e ON a.event_id = e.event_id
    `;
    const params = [];

    if (event_id) {
      query += " WHERE a.event_id = ? OR a.event_id IS NULL";
      params.push(event_id);
    }

    query += " ORDER BY CASE WHEN a.priority = 'urgent' THEN 1 ELSE 2 END, a.created_at DESC LIMIT 20";

    const [announcements] = await promiseDb.query(query, params);
    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Failed to load announcements" });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, event_id } = req.body;
    const created_by = req.user.user_id;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const promiseDb = db.promise();
    const [result] = await promiseDb.query(
      `INSERT INTO announcements (title, content, priority, event_id, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [title, content, priority || "normal", event_id || null, created_by]
    );

    res.status(201).json({
      message: "Announcement broadcasted successfully",
      announcement_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Failed to broadcast announcement" });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const promiseDb = db.promise();
    await promiseDb.query("DELETE FROM announcements WHERE announcement_id = ?", [id]);
    res.status(200).json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};

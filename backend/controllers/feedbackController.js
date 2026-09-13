const db = require("../config/db");

// Submit or update a review
const submitFeedback = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { event_id, rating, review_text } = req.body;

    if (!event_id || !rating) {
      return res.status(400).json({ message: "Event ID and rating (1-5) are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5 stars" });
    }

    const promiseDb = db.promise();

    // Verify student was registered/attended
    const [regs] = await promiseDb.query(
      "SELECT registration_id, status FROM registrations WHERE student_id = ? AND event_id = ?",
      [studentId, event_id]
    );

    if (regs.length === 0) {
      return res.status(403).json({ message: "You can only review events you registered for" });
    }

    await promiseDb.query(
      `INSERT INTO feedback_reviews (event_id, student_id, rating, review_text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text), submitted_at = NOW()`,
      [event_id, studentId, rating, review_text || null]
    );

    res.status(200).json({ message: "Feedback submitted successfully! Thank you for rating." });
  } catch (error) {
    console.error("Feedback submit error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
};

// Get feedback for an event
const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const promiseDb = db.promise();

    const [reviews] = await promiseDb.query(
      `SELECT f.*, u.name AS student_name, u.department AS student_department
       FROM feedback_reviews f
       JOIN users u ON f.student_id = u.user_id
       WHERE f.event_id = ?
       ORDER BY f.submitted_at DESC`,
      [eventId]
    );

    const [stats] = await promiseDb.query(
      `SELECT 
         COUNT(*) AS total_reviews,
         COALESCE(AVG(rating), 0) AS average_rating,
         COUNT(CASE WHEN rating = 5 THEN 1 END) AS count_5,
         COUNT(CASE WHEN rating = 4 THEN 1 END) AS count_4,
         COUNT(CASE WHEN rating = 3 THEN 1 END) AS count_3,
         COUNT(CASE WHEN rating = 2 THEN 1 END) AS count_2,
         COUNT(CASE WHEN rating = 1 THEN 1 END) AS count_1
       FROM feedback_reviews
       WHERE event_id = ?`,
      [eventId]
    );

    res.status(200).json({
      reviews,
      stats: stats[0],
    });
  } catch (error) {
    console.error("Error fetching event feedback:", error);
    res.status(500).json({ message: "Failed to load event feedback" });
  }
};

module.exports = {
  submitFeedback,
  getEventFeedback,
};

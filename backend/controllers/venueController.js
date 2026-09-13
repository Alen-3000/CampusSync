const db = require("../config/db");

// Get all venues
const getAllVenues = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [venues] = await promiseDb.query(`
      SELECT 
        v.*,
        COUNT(e.event_id) AS upcoming_events_count
      FROM venues v
      LEFT JOIN events e ON v.venue_id = e.venue_id AND e.event_date >= NOW() AND e.status NOT IN ('cancelled', 'rejected')
      GROUP BY v.venue_id
      ORDER BY v.capacity DESC
    `);
    res.status(200).json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ message: "Failed to fetch campus venues" });
  }
};

// Check if a venue is free for a given time slot (clash detection)
const checkAvailability = async (req, res) => {
  try {
    const { venue_id, event_date, end_date, exclude_event_id } = req.query;

    if (!venue_id || !event_date) {
      return res.status(400).json({ message: "venue_id and event_date are required" });
    }

    const promiseDb = db.promise();

    // Default duration to 3 hours if end_date not provided
    const start = new Date(event_date);
    const end = end_date ? new Date(end_date) : new Date(start.getTime() + 3 * 60 * 60 * 1000);

    let query = `
      SELECT event_id, title, event_date, end_date, location
      FROM events
      WHERE venue_id = ?
        AND status NOT IN ('cancelled', 'rejected')
        AND (
          (event_date <= ? AND COALESCE(end_date, DATE_ADD(event_date, INTERVAL 3 HOUR)) > ?)
        )
    `;
    const params = [venue_id, end, start];

    if (exclude_event_id) {
      query += " AND event_id != ?";
      params.push(exclude_event_id);
    }

    const [conflicts] = await promiseDb.query(query, params);

    res.status(200).json({
      available: conflicts.length === 0,
      conflicts,
    });
  } catch (error) {
    console.error("Error checking venue availability:", error);
    res.status(500).json({ message: "Error checking venue availability" });
  }
};

// Create a new venue (Admin only)
const createVenue = async (req, res) => {
  try {
    const { venue_name, building, floor, capacity, amenities } = req.body;

    if (!venue_name || !building || !capacity) {
      return res.status(400).json({ message: "Venue name, building, and capacity are required" });
    }

    const promiseDb = db.promise();
    const [result] = await promiseDb.query(
      `INSERT INTO venues (venue_name, building, floor, capacity, amenities)
       VALUES (?, ?, ?, ?, ?)`,
      [venue_name, building, floor || "Ground Floor", capacity, amenities || ""]
    );

    res.status(201).json({
      message: "Venue created successfully",
      venue_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating venue:", error);
    res.status(500).json({ message: "Failed to create venue" });
  }
};

// Update venue (Admin only)
const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { venue_name, building, floor, capacity, amenities, is_available } = req.body;

    const promiseDb = db.promise();
    await promiseDb.query(
      `UPDATE venues
       SET venue_name = COALESCE(?, venue_name),
           building = COALESCE(?, building),
           floor = COALESCE(?, floor),
           capacity = COALESCE(?, capacity),
           amenities = COALESCE(?, amenities),
           is_available = COALESCE(?, is_available)
       WHERE venue_id = ?`,
      [venue_name, building, floor, capacity, amenities, is_available, id]
    );

    res.status(200).json({ message: "Venue updated successfully" });
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).json({ message: "Failed to update venue" });
  }
};

module.exports = {
  getAllVenues,
  checkAvailability,
  createVenue,
  updateVenue,
};

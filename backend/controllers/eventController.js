const db = require("../config/db");

// Get all events with advanced search, filters, and analytics stats
const getAllEvents = async (req, res) => {
  try {
    const { search, category_id, venue_id, status, timeframe } = req.query;
    const promiseDb = db.promise();

    let query = `
      SELECT 
        e.event_id,
        e.title,
        e.description,
        e.event_date,
        e.end_date,
        e.location,
        e.capacity,
        e.status,
        e.banner_url,
        e.tags,
        e.certificate_enabled,
        e.registration_deadline,
        c.category_id,
        c.category_name,
        v.venue_id,
        COALESCE(v.venue_name, e.location) AS venue_name,
        v.building AS venue_building,
        u.user_id AS organizer_id,
        u.name AS organizer_name,
        u.email AS organizer_email,
        COUNT(DISTINCT CASE WHEN r.status IN ('registered', 'attended') THEN r.registration_id END) AS registered_count,
        COUNT(DISTINCT CASE WHEN r.status = 'waitlisted' THEN r.registration_id END) AS waitlist_count,
        COALESCE(AVG(f.rating), 0) AS average_rating,
        COUNT(DISTINCT f.feedback_id) AS total_reviews
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.category_id
      LEFT JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN users u ON e.organizer_id = u.user_id
      LEFT JOIN registrations r ON e.event_id = r.event_id
      LEFT JOIN feedback_reviews f ON e.event_id = f.event_id
      WHERE 1=1
    `;

    const params = [];

    // Filter by status (default to 'approved' for public unless specific status requested)
    if (status && status !== "all") {
      query += " AND e.status = ?";
      params.push(status);
    } else if (!status) {
      query += " AND e.status = 'approved'";
    }

    // Search keyword in title, description, or tags
    if (search && search.trim() !== "") {
      query += " AND (e.title LIKE ? OR e.description LIKE ? OR e.tags LIKE ? OR e.location LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    // Category filter
    if (category_id && category_id !== "all") {
      query += " AND e.category_id = ?";
      params.push(category_id);
    }

    // Venue filter
    if (venue_id && venue_id !== "all") {
      query += " AND e.venue_id = ?";
      params.push(venue_id);
    }

    // Timeframe filter
    if (timeframe === "upcoming") {
      query += " AND e.event_date >= NOW()";
    } else if (timeframe === "past") {
      query += " AND e.event_date < NOW()";
    }

    query += `
      GROUP BY e.event_id, c.category_id, c.category_name, v.venue_id, v.venue_name, v.building, u.user_id, u.name, u.email
      ORDER BY e.event_date ASC
    `;

    const [results] = await promiseDb.query(query, params);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to load events" });
  }
};

// Get one event by ID with agenda schedule and feedback reviews
const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const promiseDb = db.promise();

    const [events] = await promiseDb.query(
      `SELECT 
        e.*,
        c.category_name,
        v.venue_name,
        v.building AS venue_building,
        v.capacity AS venue_capacity,
        v.amenities AS venue_amenities,
        u.name AS organizer_name,
        u.email AS organizer_email,
        u.department AS organizer_department,
        COUNT(DISTINCT CASE WHEN r.status IN ('registered', 'attended') THEN r.registration_id END) AS registered_count,
        COUNT(DISTINCT CASE WHEN r.status = 'waitlisted' THEN r.registration_id END) AS waitlist_count,
        COALESCE(AVG(f.rating), 0) AS average_rating,
        COUNT(DISTINCT f.feedback_id) AS total_reviews
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.category_id
      LEFT JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN users u ON e.organizer_id = u.user_id
      LEFT JOIN registrations r ON e.event_id = r.event_id
      LEFT JOIN feedback_reviews f ON e.event_id = f.event_id
      WHERE e.event_id = ?
      GROUP BY e.event_id, c.category_name, v.venue_name, v.building, v.capacity, v.amenities, u.name, u.email, u.department`,
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = events[0];

    // Fetch agenda schedules
    const [schedules] = await promiseDb.query(
      "SELECT * FROM event_schedules WHERE event_id = ? ORDER BY schedule_id ASC",
      [eventId]
    );
    event.schedules = schedules;

    // Fetch feedback reviews
    const [reviews] = await promiseDb.query(
      `SELECT f.*, u.name AS student_name, u.department AS student_department
       FROM feedback_reviews f
       JOIN users u ON f.student_id = u.user_id
       WHERE f.event_id = ?
       ORDER BY f.submitted_at DESC
       LIMIT 15`,
      [eventId]
    );
    event.reviews = reviews;

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({ message: "Failed to fetch event details" });
  }
};

// Create a new event with collision detection & schedule agenda
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      event_date,
      end_date,
      location,
      venue_id,
      capacity,
      category_id,
      club_id,
      tags,
      banner_url,
      registration_deadline,
      certificate_enabled,
      status,
      schedules,
    } = req.body;

    const organizer_id = req.user.user_id;
    const userRole = req.user.role;

    if (!title || !event_date || !capacity || !category_id) {
      return res.status(400).json({
        message: "Title, event date, capacity, and category are required",
      });
    }

    const promiseDb = db.promise();

    // Check venue clash if venue_id provided
    if (venue_id) {
      const start = new Date(event_date);
      const end = end_date ? new Date(end_date) : new Date(start.getTime() + 3 * 60 * 60 * 1000);

      const [clashes] = await promiseDb.query(
        `SELECT event_id, title FROM events 
         WHERE venue_id = ? 
           AND status NOT IN ('cancelled', 'rejected')
           AND (event_date <= ? AND COALESCE(end_date, DATE_ADD(event_date, INTERVAL 3 HOUR)) > ?)`,
        [venue_id, end, start]
      );

      if (clashes.length > 0) {
        return res.status(409).json({
          message: `Venue conflict! '${clashes[0].title}' is already scheduled at this venue during this time slot.`,
          conflict: clashes[0],
        });
      }
    }

    // Determine default status: admin gets 'approved', organizer defaults to 'approved' or requested status
    const eventStatus = status || "approved";

    // Lookup venue name if location not given
    let finalLocation = location;
    if (!finalLocation && venue_id) {
      const [v] = await promiseDb.query("SELECT venue_name FROM venues WHERE venue_id = ?", [venue_id]);
      if (v.length > 0) finalLocation = v[0].venue_name;
    }

    const [result] = await promiseDb.query(
      `INSERT INTO events (
        title, description, event_date, end_date, location, venue_id,
        capacity, category_id, organizer_id, club_id, status,
        banner_url, tags, registration_deadline, certificate_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        event_date,
        end_date || null,
        finalLocation || "Campus Venue",
        venue_id || null,
        capacity,
        category_id,
        organizer_id,
        club_id || null,
        eventStatus,
        banner_url || null,
        tags || "Campus,College",
        registration_deadline || null,
        certificate_enabled !== undefined ? certificate_enabled : true,
      ]
    );

    const eventId = result.insertId;

    // Insert schedules if provided
    if (Array.isArray(schedules) && schedules.length > 0) {
      for (const item of schedules) {
        if (item.session_title && item.start_time) {
          await promiseDb.query(
            `INSERT INTO event_schedules (event_id, start_time, end_time, session_title, speaker_name, venue_details, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              eventId,
              item.start_time,
              item.end_time || "",
              item.session_title,
              item.speaker_name || "",
              item.venue_details || "",
              item.description || "",
            ]
          );
        }
      }
    }

    // Audit log
    await promiseDb.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'EVENT_CREATED', ?)",
      [organizer_id, `Event '${title}' created with ID ${eventId}`]
    ).catch(() => {});

    res.status(201).json({
      message: "Event created successfully",
      event_id: eventId,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
};

// Update an existing event
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const {
      title,
      description,
      event_date,
      end_date,
      location,
      venue_id,
      capacity,
      category_id,
      club_id,
      tags,
      banner_url,
      status,
      registration_deadline,
      certificate_enabled,
      schedules,
    } = req.body;

    const loggedInUserId = req.user.user_id;
    const loggedInUserRole = req.user.role;
    const promiseDb = db.promise();

    const [existing] = await promiseDb.query(
      "SELECT * FROM events WHERE event_id = ?",
      [eventId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = existing[0];

    // Authorization check
    if (loggedInUserRole !== "admin" && event.organizer_id !== loggedInUserId) {
      return res.status(403).json({ message: "You can only update your own events" });
    }

    // Check venue clash if venue or date changed
    const targetVenue = venue_id || event.venue_id;
    const targetDate = event_date || event.event_date;
    const targetEnd = end_date || event.end_date;

    if (targetVenue) {
      const start = new Date(targetDate);
      const end = targetEnd ? new Date(targetEnd) : new Date(start.getTime() + 3 * 60 * 60 * 1000);

      const [clashes] = await promiseDb.query(
        `SELECT event_id, title FROM events 
         WHERE venue_id = ? 
           AND event_id != ?
           AND status NOT IN ('cancelled', 'rejected')
           AND (event_date <= ? AND COALESCE(end_date, DATE_ADD(event_date, INTERVAL 3 HOUR)) > ?)`,
        [targetVenue, eventId, end, start]
      );

      if (clashes.length > 0) {
        return res.status(409).json({
          message: `Venue conflict! '${clashes[0].title}' is already scheduled at this venue during this time slot.`,
        });
      }
    }

    await promiseDb.query(
      `UPDATE events
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           event_date = COALESCE(?, event_date),
           end_date = COALESCE(?, end_date),
           location = COALESCE(?, location),
           venue_id = COALESCE(?, venue_id),
           capacity = COALESCE(?, capacity),
           category_id = COALESCE(?, category_id),
           club_id = COALESCE(?, club_id),
           tags = COALESCE(?, tags),
           banner_url = COALESCE(?, banner_url),
           status = COALESCE(?, status),
           registration_deadline = COALESCE(?, registration_deadline),
           certificate_enabled = COALESCE(?, certificate_enabled)
       WHERE event_id = ?`,
      [
        title,
        description,
        event_date,
        end_date,
        location,
        venue_id,
        capacity,
        category_id,
        club_id,
        tags,
        banner_url,
        status,
        registration_deadline,
        certificate_enabled,
        eventId,
      ]
    );

    // If schedules are provided, replace them
    if (Array.isArray(schedules)) {
      await promiseDb.query("DELETE FROM event_schedules WHERE event_id = ?", [eventId]);
      for (const item of schedules) {
        if (item.session_title && item.start_time) {
          await promiseDb.query(
            `INSERT INTO event_schedules (event_id, start_time, end_time, session_title, speaker_name, venue_details, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              eventId,
              item.start_time,
              item.end_time || "",
              item.session_title,
              item.speaker_name || "",
              item.venue_details || "",
              item.description || "",
            ]
          );
        }
      }
    }

    res.status(200).json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const loggedInUserId = req.user.user_id;
    const loggedInUserRole = req.user.role;
    const promiseDb = db.promise();

    const [events] = await promiseDb.query(
      "SELECT organizer_id, title FROM events WHERE event_id = ?",
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (loggedInUserRole !== "admin" && events[0].organizer_id !== loggedInUserId) {
      return res.status(403).json({ message: "You can only delete your own events" });
    }

    await promiseDb.query("DELETE FROM events WHERE event_id = ?", [eventId]);

    // Audit log
    await promiseDb.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'EVENT_DELETED', ?)",
      [loggedInUserId, `Deleted event '${events[0].title}' (ID ${eventId})`]
    ).catch(() => {});

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Failed to delete event. It may have existing dependencies." });
  }
};

// Get events created by logged-in organizer with roster metrics
const getMyEvents = async (req, res) => {
  try {
    const organizerId = req.user.user_id;
    const promiseDb = db.promise();

    const [results] = await promiseDb.query(
      `SELECT
        e.event_id,
        e.title,
        e.description,
        e.event_date,
        e.end_date,
        e.location,
        e.capacity,
        e.status,
        e.approval_remarks,
        e.banner_url,
        e.tags,
        c.category_name,
        v.venue_name,
        COUNT(DISTINCT CASE WHEN r.status IN ('registered', 'attended') THEN r.registration_id END) AS registered_count,
        COUNT(DISTINCT CASE WHEN r.status = 'attended' THEN r.registration_id END) AS attended_count,
        COUNT(DISTINCT CASE WHEN r.status = 'waitlisted' THEN r.registration_id END) AS waitlist_count,
        COALESCE(AVG(f.rating), 0) AS average_rating
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.category_id
      LEFT JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN registrations r ON e.event_id = r.event_id
      LEFT JOIN feedback_reviews f ON e.event_id = f.event_id
      WHERE e.organizer_id = ?
      GROUP BY e.event_id, c.category_name, v.venue_name
      ORDER BY e.event_date ASC`,
      [organizerId]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    res.status(500).json({ message: "Failed to load your events" });
  }
};

// Update event approval status (Admin only)
const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["approved", "rejected", "pending_approval", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const promiseDb = db.promise();
    await promiseDb.query(
      "UPDATE events SET status = ?, approval_remarks = ? WHERE event_id = ?",
      [status, remarks || null, id]
    );

    // Audit log
    await promiseDb.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'EVENT_STATUS_UPDATED', ?)",
      [req.user.user_id, `Event ID ${id} status set to ${status}. Remarks: ${remarks || 'None'}`]
    ).catch(() => {});

    res.status(200).json({
      message: `Event status successfully updated to '${status}'`,
    });
  } catch (error) {
    console.error("Error updating event status:", error);
    res.status(500).json({ message: "Failed to update event status" });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
};
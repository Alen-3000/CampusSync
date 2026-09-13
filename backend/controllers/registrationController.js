const db = require("../config/db");

// Generate clean unique ticket code
const generateTicketCode = () => {
  const year = new Date().getFullYear();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PASS-${year}-${randNum}-${randStr}`;
};

// Register for an event (with automatic waitlist handling)
const registerForEvent = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const promiseDb = db.promise();

    // Check if event exists and get capacity & title
    const [events] = await promiseDb.query(
      "SELECT event_id, title, capacity, status, registration_deadline FROM events WHERE event_id = ?",
      [event_id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = events[0];

    if (event.status !== "approved") {
      return res.status(400).json({ message: `Cannot register. Event status is ${event.status}.` });
    }

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ message: "Registration deadline has passed." });
    }

    // Check if student already has active registration or waitlist
    const [existing] = await promiseDb.query(
      "SELECT registration_id, status FROM registrations WHERE student_id = ? AND event_id = ?",
      [studentId, event_id]
    );

    if (existing.length > 0) {
      const reg = existing[0];
      if (reg.status === "registered" || reg.status === "attended") {
        return res.status(400).json({ message: "You are already registered for this event." });
      }
      if (reg.status === "waitlisted") {
        return res.status(400).json({ message: "You are currently on the waitlist for this event." });
      }
    }

    // Count currently registered students
    const [countResults] = await promiseDb.query(
      "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND status IN ('registered', 'attended')",
      [event_id]
    );

    const activeCount = countResults[0].count;
    const isFull = activeCount >= event.capacity;

    if (isFull) {
      // Add to waitlist
      const [waitlistCount] = await promiseDb.query(
        "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND status = 'waitlisted'",
        [event_id]
      );
      const nextWaitlistPos = waitlistCount[0].count + 1;

      if (existing.length > 0) {
        await promiseDb.query(
          "UPDATE registrations SET status = 'waitlisted', waitlist_position = ?, registration_date = NOW() WHERE registration_id = ?",
          [nextWaitlistPos, existing[0].registration_id]
        );
      } else {
        await promiseDb.query(
          "INSERT INTO registrations (student_id, event_id, status, waitlist_position) VALUES (?, ?, 'waitlisted', ?)",
          [studentId, event_id, nextWaitlistPos]
        );
      }

      return res.status(200).json({
        message: `Event is at full capacity. You have been placed on the Waitlist (Position #${nextWaitlistPos}). You will be automatically promoted if a seat opens up!`,
        status: "waitlisted",
        waitlist_position: nextWaitlistPos,
      });
    }

    // Confirm registration
    const ticketCode = generateTicketCode();

    let regId;
    if (existing.length > 0) {
      await promiseDb.query(
        "UPDATE registrations SET status = 'registered', ticket_code = ?, waitlist_position = 0, registration_date = NOW() WHERE registration_id = ?",
        [ticketCode, existing[0].registration_id]
      );
      regId = existing[0].registration_id;
    } else {
      const [insertResult] = await promiseDb.query(
        "INSERT INTO registrations (student_id, event_id, status, ticket_code) VALUES (?, ?, 'registered', ?)",
        [studentId, event_id, ticketCode]
      );
      regId = insertResult.insertId;
    }

    // Audit log
    await promiseDb.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'REGISTRATION_SUCCESS', ?)",
      [studentId, `Registered for event '${event.title}' with ticket ${ticketCode}`]
    ).catch(() => {});

    res.status(201).json({
      message: "Successfully registered! Your Digital Pass is ready.",
      status: "registered",
      registration_id: regId,
      ticket_code: ticketCode,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register for event" });
  }
};

// Get all registrations for logged-in student (with tickets, certificates, and review status)
const getMyRegistrations = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const promiseDb = db.promise();

    const [results] = await promiseDb.query(
      `SELECT
        r.registration_id,
        r.ticket_code,
        r.status,
        r.registration_date,
        r.attended_at,
        r.waitlist_position,
        e.event_id,
        e.title,
        e.description,
        e.event_date,
        e.end_date,
        e.location,
        e.capacity,
        e.certificate_enabled,
        c.category_name,
        v.venue_name,
        u.name AS organizer_name,
        cert.certificate_number,
        fb.feedback_id,
        fb.rating AS user_rating,
        fb.review_text AS user_review
      FROM registrations r
      JOIN events e ON r.event_id = e.event_id
      LEFT JOIN categories c ON e.category_id = c.category_id
      LEFT JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN users u ON e.organizer_id = u.user_id
      LEFT JOIN certificates cert ON cert.registration_id = r.registration_id
      LEFT JOIN feedback_reviews fb ON fb.event_id = e.event_id AND fb.student_id = r.student_id
      WHERE r.student_id = ?
      ORDER BY e.event_date DESC`,
      [studentId]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching student registrations:", error);
    res.status(500).json({ message: "Failed to load registered events" });
  }
};

// Cancel registration with automatic promotion of waitlisted student
const cancelRegistration = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const eventId = req.params.eventId;
    const promiseDb = db.promise();

    const [regs] = await promiseDb.query(
      "SELECT registration_id, status FROM registrations WHERE student_id = ? AND event_id = ? AND status IN ('registered', 'waitlisted')",
      [studentId, eventId]
    );

    if (regs.length === 0) {
      return res.status(404).json({ message: "Active registration or waitlist not found" });
    }

    const wasRegistered = regs[0].status === "registered";

    // Mark current as cancelled
    await promiseDb.query(
      "UPDATE registrations SET status = 'cancelled' WHERE student_id = ? AND event_id = ?",
      [studentId, eventId]
    );

    // If student was an active attendee, promote the first waitlisted student
    if (wasRegistered) {
      const [waitlisted] = await promiseDb.query(
        "SELECT registration_id, student_id FROM registrations WHERE event_id = ? AND status = 'waitlisted' ORDER BY waitlist_position ASC, registration_date ASC LIMIT 1",
        [eventId]
      );

      if (waitlisted.length > 0) {
        const promoted = waitlisted[0];
        const newTicket = generateTicketCode();
        await promiseDb.query(
          "UPDATE registrations SET status = 'registered', ticket_code = ?, waitlist_position = 0 WHERE registration_id = ?",
          [newTicket, promoted.registration_id]
        );

        // Shift remaining waitlist positions
        await promiseDb.query(
          "UPDATE registrations SET waitlist_position = waitlist_position - 1 WHERE event_id = ? AND status = 'waitlisted' AND waitlist_position > 1",
          [eventId]
        );

        // Audit log promotion
        await promiseDb.query(
          "INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'WAITLIST_PROMOTION', ?)",
          [promoted.student_id, `Auto-promoted from waitlist for event ID ${eventId}. Ticket: ${newTicket}`]
        ).catch(() => {});
      }
    }

    res.status(200).json({ message: "Registration cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    res.status(500).json({ message: "Failed to cancel registration" });
  }
};

// Get attendee roster for an event (Organizer/Admin)
const getEventAttendees = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const promiseDb = db.promise();

    const [attendees] = await promiseDb.query(
      `SELECT 
        r.registration_id,
        r.student_id,
        r.ticket_code,
        r.status,
        r.registration_date,
        r.attended_at,
        r.waitlist_position,
        u.name AS student_name,
        u.email AS student_email,
        u.roll_number,
        u.department,
        u.phone,
        u.year_of_study,
        staff.name AS checked_in_by_name
      FROM registrations r
      JOIN users u ON r.student_id = u.user_id
      LEFT JOIN users staff ON r.checked_in_by = staff.user_id
      WHERE r.event_id = ?
      ORDER BY 
        CASE 
          WHEN r.status = 'attended' THEN 1
          WHEN r.status = 'registered' THEN 2
          WHEN r.status = 'waitlisted' THEN 3
          ELSE 4
        END,
        r.registration_date ASC`,
      [eventId]
    );

    res.status(200).json(attendees);
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    res.status(500).json({ message: "Failed to fetch attendee roster" });
  }
};

// Live Door Check-In Scanner (by QR ticket_code or roll_number)
const checkInAttendee = async (req, res) => {
  try {
    const { ticket_code, roll_number, event_id } = req.body;
    const staffId = req.user.user_id;

    if (!ticket_code && !roll_number) {
      return res.status(400).json({ message: "Ticket code or student roll number is required for check-in" });
    }

    const promiseDb = db.promise();

    let query = `
      SELECT r.registration_id, r.event_id, r.student_id, r.ticket_code, r.status, r.attended_at,
             u.name AS student_name, u.roll_number, u.department, e.title AS event_title, e.certificate_enabled
      FROM registrations r
      JOIN users u ON r.student_id = u.user_id
      JOIN events e ON r.event_id = e.event_id
      WHERE 1=1
    `;
    const params = [];

    if (ticket_code) {
      query += " AND r.ticket_code = ?";
      params.push(ticket_code.trim());
    } else if (roll_number) {
      query += " AND u.roll_number = ?";
      params.push(roll_number.trim());
    }

    if (event_id) {
      query += " AND r.event_id = ?";
      params.push(event_id);
    }

    const [records] = await promiseDb.query(query, params);

    if (records.length === 0) {
      return res.status(404).json({
        message: "No matching registration found. Please verify the ticket or roll number.",
      });
    }

    const reg = records[0];

    if (reg.status === "attended") {
      return res.status(409).json({
        message: `⚠️ Student '${reg.student_name}' is ALREADY checked in at ${new Date(reg.attended_at).toLocaleTimeString()}!`,
        student: reg,
        already_checked_in: true,
      });
    }

    if (reg.status === "cancelled") {
      return res.status(400).json({
        message: `❌ Cannot check in: Student registration was cancelled.`,
      });
    }

    // Set to attended
    await promiseDb.query(
      "UPDATE registrations SET status = 'attended', attended_at = NOW(), checked_in_by = ? WHERE registration_id = ?",
      [staffId, reg.registration_id]
    );

    // Auto-generate certificate record if certificate enabled
    if (reg.certificate_enabled) {
      const certHash = "CERT-" + reg.event_id + "-" + reg.student_id + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      await promiseDb.query(
        `INSERT IGNORE INTO certificates (registration_id, event_id, student_id, certificate_number)
         VALUES (?, ?, ?, ?)`,
        [reg.registration_id, reg.event_id, reg.student_id, certHash]
      ).catch(() => {});
    }

    // Audit log
    await promiseDb.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'DOOR_CHECKIN', ?)",
      [staffId, `Checked in ${reg.student_name} (${reg.roll_number}) for ${reg.event_title}`]
    ).catch(() => {});

    res.status(200).json({
      message: `✅ Check-in successful for ${reg.student_name}!`,
      student: {
        ...reg,
        status: "attended",
        attended_at: new Date(),
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Check-in processing error" });
  }
};

// Export attendee roster as CSV text
const exportAttendeesCSV = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const promiseDb = db.promise();

    const [events] = await promiseDb.query("SELECT title FROM events WHERE event_id = ?", [eventId]);
    if (events.length === 0) return res.status(404).send("Event not found");

    const [attendees] = await promiseDb.query(
      `SELECT 
        u.roll_number,
        u.name,
        u.email,
        u.department,
        u.year_of_study,
        u.phone,
        r.status,
        r.ticket_code,
        r.registration_date,
        r.attended_at
      FROM registrations r
      JOIN users u ON r.student_id = u.user_id
      WHERE r.event_id = ?
      ORDER BY u.roll_number ASC`,
      [eventId]
    );

    // Build CSV content
    const headers = ["Roll Number", "Full Name", "Email", "Department", "Year", "Phone", "Status", "Ticket Code", "Registration Date", "Check-in Time"];
    const rows = attendees.map(a => [
      `"${a.roll_number || ''}"`,
      `"${a.name || ''}"`,
      `"${a.email || ''}"`,
      `"${a.department || ''}"`,
      `"${a.year_of_study || ''}"`,
      `"${a.phone || ''}"`,
      `"${a.status || ''}"`,
      `"${a.ticket_code || ''}"`,
      `"${a.registration_date ? new Date(a.registration_date).toLocaleString() : ''}"`,
      `"${a.attended_at ? new Date(a.attended_at).toLocaleString() : 'Not Checked In'}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="Attendees_${events[0].title.replace(/[^a-zA-Z0-9]/g, "_")}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("CSV Export error:", error);
    res.status(500).send("Error exporting attendee CSV");
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventAttendees,
  checkInAttendee,
  exportAttendeesCSV,
};
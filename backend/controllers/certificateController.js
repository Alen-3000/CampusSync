const db = require("../config/db");

// Get or issue certificate for attended registration
const getCertificate = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { eventId } = req.params;
    const promiseDb = db.promise();

    const [records] = await promiseDb.query(
      `SELECT 
        r.registration_id,
        r.status,
        r.attended_at,
        e.event_id,
        e.title AS event_title,
        e.event_date,
        e.location,
        u.name AS student_name,
        u.roll_number,
        u.department,
        org.name AS organizer_name,
        cert.certificate_number,
        cert.issued_at
      FROM registrations r
      JOIN events e ON r.event_id = e.event_id
      JOIN users u ON r.student_id = u.user_id
      LEFT JOIN users org ON e.organizer_id = org.user_id
      LEFT JOIN certificates cert ON cert.registration_id = r.registration_id
      WHERE r.student_id = ? AND r.event_id = ?`,
      [studentId, eventId]
    );

    if (records.length === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const record = records[0];

    // Check if student actually attended
    if (record.status !== "attended") {
      return res.status(400).json({
        message: "Certificate is only available for participants who attended the event and had their attendance verified.",
      });
    }

    // If certificate record doesn't exist yet, create one
    if (!record.certificate_number) {
      const certHash = "CERT-" + eventId + "-" + studentId + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      await promiseDb.query(
        `INSERT INTO certificates (registration_id, event_id, student_id, certificate_number)
         VALUES (?, ?, ?, ?)`,
        [record.registration_id, eventId, studentId, certHash]
      );
      record.certificate_number = certHash;
      record.issued_at = new Date();
    }

    res.status(200).json({
      certificate: {
        certificate_number: record.certificate_number,
        student_name: record.student_name,
        roll_number: record.roll_number,
        department: record.department,
        event_title: record.event_title,
        event_date: record.event_date,
        attended_at: record.attended_at,
        organizer_name: record.organizer_name,
        issued_at: record.issued_at,
        institution: "College of Engineering & Technology",
      },
    });
  } catch (error) {
    console.error("Certificate fetch error:", error);
    res.status(500).json({ message: "Failed to generate certificate" });
  }
};

// Public certificate verification
const verifyCertificate = async (req, res) => {
  try {
    const { certNumber } = req.params;
    const promiseDb = db.promise();

    const [results] = await promiseDb.query(
      `SELECT 
        c.certificate_number,
        c.issued_at,
        u.name AS student_name,
        u.roll_number,
        u.department,
        e.title AS event_title,
        e.event_date,
        org.name AS organizer_name
      FROM certificates c
      JOIN users u ON c.student_id = u.user_id
      JOIN events e ON c.event_id = e.event_id
      LEFT JOIN users org ON e.organizer_id = org.user_id
      WHERE c.certificate_number = ?`,
      [certNumber.trim()]
    );

    if (results.length === 0) {
      return res.status(404).json({
        valid: false,
        message: "Certificate code is invalid or does not exist in college records.",
      });
    }

    res.status(200).json({
      valid: true,
      data: results[0],
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    res.status(500).json({ message: "Verification check failed" });
  }
};

module.exports = {
  getCertificate,
  verifyCertificate,
};

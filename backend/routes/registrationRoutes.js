const express = require("express");
const router = express.Router();

const {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventAttendees,
  checkInAttendee,
  exportAttendeesCSV,
} = require("../controllers/registrationController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Student register
router.post(
  "/",
  authenticateToken,
  authorizeRoles("student", "organizer", "admin"),
  registerForEvent
);

// Student views their registrations
router.get(
  "/my-events",
  authenticateToken,
  getMyRegistrations
);

// Student cancels registration
router.delete(
  "/:eventId",
  authenticateToken,
  cancelRegistration
);

// Organizer/Admin views attendees for an event
router.get(
  "/event/:eventId/attendees",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  getEventAttendees
);

// Organizer/Admin checks in an attendee (Door Scanner)
router.post(
  "/check-in",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  checkInAttendee
);

// Organizer/Admin exports attendees to CSV
router.get(
  "/event/:eventId/export",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  exportAttendeesCSV
);

module.exports = router;
const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
} = require("../controllers/eventController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public routes
router.get("/", getAllEvents);

// Organizer routes
router.get(
  "/my-events",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  getMyEvents
);

router.get("/:id", getEventById);

// Protected create, edit, delete
router.post(
  "/",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  createEvent
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  updateEvent
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  deleteEvent
);

// Admin approval / moderation
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin"),
  updateEventStatus
);

module.exports = router;
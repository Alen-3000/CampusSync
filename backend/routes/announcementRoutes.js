const express = require("express");
const router = express.Router();

const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public view
router.get("/", getAnnouncements);

// Create announcement (organizers or admin)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  createAnnouncement
);

// Delete announcement
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  deleteAnnouncement
);

module.exports = router;

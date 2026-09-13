const express = require("express");
const router = express.Router();

const {
  submitFeedback,
  getEventFeedback,
} = require("../controllers/feedbackController");

const authenticateToken = require("../middleware/authMiddleware");

// Public view reviews for an event
router.get("/event/:eventId", getEventFeedback);

// Submit review (Authenticated student)
router.post("/", authenticateToken, submitFeedback);

module.exports = router;

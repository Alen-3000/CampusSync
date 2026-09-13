const express = require("express");
const router = express.Router();

const {
  getAllVenues,
  checkAvailability,
  createVenue,
  updateVenue,
} = require("../controllers/venueController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public routes
router.get("/", getAllVenues);
router.get("/check-availability", checkAvailability);

// Admin-only management routes
router.post("/", authenticateToken, authorizeRoles("admin"), createVenue);
router.put("/:id", authenticateToken, authorizeRoles("admin"), updateVenue);

module.exports = router;

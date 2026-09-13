const express = require("express");
const router = express.Router();

const {
  getCertificate,
  verifyCertificate,
} = require("../controllers/certificateController");

const authenticateToken = require("../middleware/authMiddleware");

// Public certificate verification
router.get("/verify/:certNumber", verifyCertificate);

// Student get certificate for an attended event
router.get("/event/:eventId", authenticateToken, getCertificate);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

const authenticateToken = require("../middleware/authMiddleware");

// Public authentication routes
router.post("/register", register);
router.post("/login", login);

// Authenticated user profile routes
router.get("/me", authenticateToken, getProfile);
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);

module.exports = router;
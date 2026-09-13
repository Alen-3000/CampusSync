const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllUsers,
  updateUser,
  getAuditLogs,
} = require("../controllers/adminController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// All admin routes require admin role
router.use(authenticateToken, authorizeRoles("admin"));

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/users/:id", updateUser);
router.get("/audit-logs", getAuditLogs);

module.exports = router;

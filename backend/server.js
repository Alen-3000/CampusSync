const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const db = require("./config/db");
const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const venueRoutes = require("./routes/venueRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const adminRoutes = require("./routes/adminRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const authenticateToken = require("./middleware/authMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health route
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "College Event Management System API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Mounted API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/announcements", announcementRoutes);

// Protected user profile test route
app.get("/api/profile", authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Protected profile route accessed successfully",
    user: req.user,
  });
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    message: "An internal server error occurred",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 College Event Management Server is running on port ${PORT}`);
});

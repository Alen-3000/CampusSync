const bcrypt = require("bcryptjs");
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

async function fixDemoPasswordsOnce() {
  if (process.env.FIX_DEMO_PASSWORDS !== "true") return;

  const demoAccounts = [
    {
      email: "arun@example.com",
      password: "password123",
      role: "student"
    },
    {
      email: "priya@example.com",
      password: "password123",
      role: "organizer"
    },
    {
      email: "admin@example.com",
      password: "admin123",
      role: "admin"
    }
  ];

  const promiseDb = db.promise();

  for (const account of demoAccounts) {
    const [users] = await promiseDb.query(
      "SELECT user_id, role FROM users WHERE email = ?",
      [account.email]
    );

    if (users.length !== 1 || users[0].role !== account.role) {
      throw new Error(`Demo account missing or role mismatch: ${account.email}`);
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);

    await promiseDb.query(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, users[0].user_id]
    );

    console.log(`Updated demo password for ${account.email}`);
  }

  console.log("Demo account password repair completed.");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 College Event Management Server is running on port ${PORT}`);

  try {
    await fixDemoPasswordsOnce();
  } catch (error) {
    console.error("Demo password repair failed:", error.message);
  }
});

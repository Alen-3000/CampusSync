const mysql = require("mysql2");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "college_event_management",
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});

// Test connection on startup
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL Pool Connection Failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL Database Pool successfully!");
    conn.release();
  }
});

module.exports = pool;
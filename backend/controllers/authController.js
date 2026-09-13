const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, roll_number, phone, year_of_study } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const promiseDb = db.promise();

    // Check if email already exists
    const [existingUsers] = await promiseDb.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        message: "Email already registered with another account",
      });
    }

    // Check if roll number already exists (if provided)
    if (roll_number) {
      const [existingRoll] = await promiseDb.query(
        "SELECT user_id FROM users WHERE roll_number = ?",
        [roll_number]
      );
      if (existingRoll.length > 0) {
        return res.status(400).json({
          message: "Roll number is already registered",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "student";
    const userDept = department || "Computer Science & Engineering";
    const userYear = year_of_study || "1st Year";

    const [result] = await promiseDb.query(
      `INSERT INTO users (name, email, password, role, department, roll_number, phone, year_of_study)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, userRole, userDept, roll_number || null, phone || null, userYear]
    );

    // Audit log entry
    await promiseDb.query(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'USER_REGISTERED', ?)",
      [result.insertId, `New user ${name} registered as ${userRole}`]
    ).catch(() => {});

    res.status(201).json({
      message: "User registered successfully",
      user_id: result.insertId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
    });
  }
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const promiseDb = db.promise();
    const [results] = await promiseDb.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    if (user.is_active === 0) {
      return res.status(403).json({
        message: "Your account has been deactivated by administration",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET || "my_super_secret_key_123",
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        roll_number: user.roll_number,
        phone: user.phone,
        year_of_study: user.year_of_study,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
    });
  }
};

// Get current profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const promiseDb = db.promise();

    const [users] = await promiseDb.query(
      "SELECT user_id, name, email, role, department, roll_number, phone, year_of_study, avatar_url, created_at FROM users WHERE user_id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, department, phone, year_of_study, avatar_url } = req.body;

    const promiseDb = db.promise();
    await promiseDb.query(
      `UPDATE users 
       SET name = COALESCE(?, name),
           department = COALESCE(?, department),
           phone = COALESCE(?, phone),
           year_of_study = COALESCE(?, year_of_study),
           avatar_url = COALESCE(?, avatar_url)
       WHERE user_id = ?`,
      [name, department, phone, year_of_study, avatar_url, userId]
    );

    const [updated] = await promiseDb.query(
      "SELECT user_id, name, email, role, department, roll_number, phone, year_of_study, avatar_url FROM users WHERE user_id = ?",
      [userId]
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updated[0],
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = authHeader;
    }
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "my_super_secret_key_123"
    );

    // Store user information in the request
    req.user = decoded;

    // Continue to the next function
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authenticateToken;
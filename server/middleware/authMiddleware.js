const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");

// =========================
// PROTECT ROUTES
// =========================
const protect = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// =========================
// ADMIN ONLY
// =========================
const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin Authorization Error:", error);

    return res.status(403).json({
      success: false,
      message: "Admin access denied",
    });
  }
};

const approvedDriverOnly = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id, status: "approved" });
    if (!driver) {
      return res.status(403).json({ success: false, message: "An approved driver account is required" });
    }
    req.driver = driver;
    return next();
  } catch (error) {
    console.error("Driver Authorization Error:", error);
    return res.status(403).json({ success: false, message: "Driver access denied" });
  }
};

module.exports = {
  protect,
  adminOnly,
  approvedDriverOnly,
};

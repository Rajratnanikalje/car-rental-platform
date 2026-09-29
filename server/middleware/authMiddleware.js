const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");
const User = require("../models/User");

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"].filter(Boolean).map((origin) => origin.replace(/\/+$/, ""));

// =========================
// PROTECT ROUTES
// =========================
const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    const cookieSession = Boolean(token);

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (cookieSession && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin")?.replace(/\/+$/, "");
      if (!origin || !allowedOrigins.includes(origin)) return res.status(403).json({ success: false, message: "Request origin is not allowed" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // A token is an identity credential, not a permanent authorization grant.
    // Resolve the account on every protected request so deleted accounts and role
    // changes take effect immediately instead of waiting for token expiry.
    const user = await User.findById(decoded.id).select("_id role").lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "Account no longer exists" });
    }
    req.user = { id: user._id.toString(), role: user.role };

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

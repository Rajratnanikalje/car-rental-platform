const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  logoutUser,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === "production" ? 10 : 100, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many authentication attempts. Please try again later." } });

// =========================
// PUBLIC ROUTES
// =========================

router.post("/register", authLimiter, registerUser);

router.post("/login", authLimiter, loginUser);

// =========================
// PROTECTED ROUTES
// =========================

router.get(
  "/profile",
  protect,
  getCurrentUser
);

router.put(
  "/profile",
  protect,
  updateUserProfile
);

// =========================
// LOGOUT
// =========================

router.post(
  "/logout",
  logoutUser
);

// =========================
// EXPORT
// =========================

module.exports = router;

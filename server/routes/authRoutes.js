const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  logoutUser,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// PUBLIC ROUTES
// =========================

router.post("/register", registerUser);

router.post("/login", loginUser);

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
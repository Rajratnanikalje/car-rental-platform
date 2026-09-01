const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingKm,
  cancelBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// =========================
// CREATE BOOKING
// =========================

router.post(
  "/",
  protect,
  createBooking
);


// =========================
// GET MY BOOKINGS
// =========================

router.get(
  "/my",
  protect,
  getMyBookings
);


// =========================
// UPDATE BOOKING KM
// =========================

// Used when car is returned
// Calculates extra KM charges

router.put(
  "/:id/km",
  protect,
  updateBookingKm
);


// =========================
// GET SINGLE BOOKING
// =========================

router.get(
  "/:id",
  protect,
  getBookingById
);


// =========================
// CANCEL BOOKING
// =========================

router.put(
  "/:id/cancel",
  protect,
  cancelBooking
);


// =========================
// EXPORT
// =========================

module.exports = router;
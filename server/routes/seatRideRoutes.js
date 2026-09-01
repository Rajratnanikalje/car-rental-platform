const express = require("express");
const controller = require("../controllers/seatRideController");
const { protect, approvedDriverOnly } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", controller.getRides);
router.get("/my-bookings", protect, controller.getMySeatBookings);
router.get("/:id", controller.getRideById);
router.post("/", protect, approvedDriverOnly, controller.publishRide);
router.post("/:rideId/bookings", protect, controller.createSeatBooking);
router.put("/bookings/:id/cancel", protect, controller.cancelSeatBooking);
router.get("/:rideId/manifest", protect, approvedDriverOnly, controller.getManifest);
router.put("/bookings/:bookingId/check-in", protect, approvedDriverOnly, controller.checkInPassenger);
module.exports = router;

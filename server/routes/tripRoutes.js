const express = require("express");
const { assignDriver, getCustomerOtp, markArrival, verifyAndStartTrip, completeTrip, getDriverTrips, getAllTrips } = require("../controllers/tripController");
const { protect, adminOnly, approvedDriverOnly } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", protect, adminOnly, getAllTrips);
router.get("/driver/my-trips", protect, approvedDriverOnly, getDriverTrips);
router.put("/:bookingId/assign-driver", protect, adminOnly, assignDriver);
router.get("/:bookingId/start-code", protect, getCustomerOtp);
router.put("/:bookingId/arrive", protect, approvedDriverOnly, markArrival);
router.put("/:bookingId/start", protect, approvedDriverOnly, verifyAndStartTrip);
router.put("/:bookingId/complete", protect, approvedDriverOnly, completeTrip);
module.exports = router;

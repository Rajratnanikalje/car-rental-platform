const express = require("express");
const { applyAsDriver, getMyDriverProfile, getDrivers, updateDriverStatus } = require("../controllers/driverController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/apply", protect, applyAsDriver);
router.get("/me", protect, getMyDriverProfile);
router.get("/", protect, adminOnly, getDrivers);
router.put("/:id", protect, adminOnly, updateDriverStatus);

module.exports = router;

const express = require("express");

const {
  getCars,
  getAdminCars,
  getMyCars,
  createDriverCar,
  updateDriverCar,
  deleteDriverCar,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
} = require("../controllers/carController");

const {
  protect,
  adminOnly,
  approvedDriverOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =========================
// PUBLIC ROUTES
// =========================

router.get("/", getCars);
router.get("/admin/all", protect, adminOnly, getAdminCars);
router.get("/driver/mine", protect, approvedDriverOnly, getMyCars);
router.post("/driver/mine", protect, approvedDriverOnly, createDriverCar);
router.put("/driver/mine/:id", protect, approvedDriverOnly, updateDriverCar);
router.delete("/driver/mine/:id", protect, approvedDriverOnly, deleteDriverCar);

router.get("/:id", getCarById);


// =========================
// ADMIN ROUTES
// =========================

// Create car
router.post(
  "/",
  protect,
  adminOnly,
  createCar
);

// Update car
router.put(
  "/:id",
  protect,
  adminOnly,
  updateCar
);

// Delete car
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteCar
);


// =========================
// EXPORT
// =========================

module.exports = router;

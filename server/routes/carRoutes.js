const express = require("express");

const {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
} = require("../controllers/carController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =========================
// PUBLIC ROUTES
// =========================

router.get("/", getCars);

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
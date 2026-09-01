const Car = require("../models/Car");
const Driver = require("../models/Driver");
const mongoose = require("mongoose");

const isValidId = (id) => mongoose.isValidObjectId(id);

const resolveDriverAssignment = async (driverId, ownershipType) => {
  if (ownershipType === "company" && !driverId) return null;
  if (!driverId || !isValidId(driverId)) return { error: "An approved driver is required for partner vehicles" };
  const driver = await Driver.findById(driverId);
  if (!driver || driver.status !== "approved") return { error: "Only approved drivers can be assigned to a vehicle" };
  return driver._id;
};

// =========================
// GET ALL CARS
// =========================
const getCars = async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cars.length,
      cars,
    });
  } catch (error) {
    console.error("Get Cars Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET SINGLE CAR
// =========================
const getCarById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    res.status(200).json({
      success: true,
      car,
    });
  } catch (error) {
    console.error("Get Car Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// CREATE CAR
// =========================
const createCar = async (req, res) => {
  try {
    const {
      name,
      brand,
      model,
      year,
      category,
      transmission,
      fuelType,
      seats,
      pricePerDay,
      pricePerKm,
      includedKm,
      location,
      image,
      description,
      features,
      ownershipType = "company",
      driver,
    } = req.body;

    // Required fields
    if (
      !name ||
      !brand ||
      !model ||
      !year ||
      !category ||
      !transmission ||
      !fuelType ||
      !seats ||
      !pricePerDay ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required car details",
      });
    }

    // Validate price per KM
    if (
      pricePerKm !== undefined &&
      (isNaN(pricePerKm) || Number(pricePerKm) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid price per KM",
      });
    }

    // Validate included KM
    if (
      includedKm !== undefined &&
      (isNaN(includedKm) || Number(includedKm) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid included KM",
      });
    }

    if (!["company", "partner"].includes(ownershipType)) {
      return res.status(400).json({ success: false, message: "Invalid vehicle ownership type" });
    }

    const assignedDriver = await resolveDriverAssignment(driver, ownershipType);
    if (assignedDriver?.error) return res.status(400).json({ success: false, message: assignedDriver.error });

    const car = await Car.create({
      name,
      brand,
      model,
      year,
      category,
      transmission,
      fuelType,
      seats,
      pricePerDay,

      pricePerKm:
        pricePerKm !== undefined
          ? Number(pricePerKm)
          : 0,

      includedKm:
        includedKm !== undefined
          ? Number(includedKm)
          : 300,

      location,
      image,
      description,
      features,
      ownershipType,
      driver: assignedDriver,
    });

    res.status(201).json({
      success: true,
      message: "Car created successfully",
      car,
    });
  } catch (error) {
    console.error("Create Car Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// UPDATE CAR
// =========================
const updateCar = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    const {
      name,
      brand,
      model,
      year,
      category,
      transmission,
      fuelType,
      seats,
      pricePerDay,
      pricePerKm,
      includedKm,
      location,
      image,
      description,
      features,
      available,
    } = req.body;

    // Build update object
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (year !== undefined) updateData.year = year;
    if (category !== undefined) updateData.category = category;
    if (transmission !== undefined) {
      updateData.transmission = transmission;
    }
    if (fuelType !== undefined) {
      updateData.fuelType = fuelType;
    }
    if (seats !== undefined) {
      updateData.seats = Number(seats);
    }
    if (pricePerDay !== undefined) {
      updateData.pricePerDay = Number(pricePerDay);
    }
    if (location !== undefined) {
      updateData.location = location;
    }
    if (image !== undefined) {
      updateData.image = image;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (features !== undefined) {
      updateData.features = features;
    }
    if (available !== undefined) {
      updateData.available = available;
    }

    // =========================
    // KM PRICING UPDATE
    // =========================

    if (pricePerKm !== undefined) {
      if (
        isNaN(pricePerKm) ||
        Number(pricePerKm) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid price per KM",
        });
      }

      updateData.pricePerKm = Number(pricePerKm);
    }

    if (includedKm !== undefined) {
      if (
        isNaN(includedKm) ||
        Number(includedKm) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid included KM",
        });
      }

      updateData.includedKm = Number(includedKm);
    }

    // =========================
    // UPDATE DATABASE
    // =========================

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Car updated successfully",
      car,
    });
  } catch (error) {
    console.error("Update Car Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// DELETE CAR
// =========================
const deleteCar = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    const car = await Car.findByIdAndDelete(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    console.error("Delete Car Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// EXPORT
// =========================
module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
};

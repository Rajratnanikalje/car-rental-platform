const Car = require("../models/Car");
const Driver = require("../models/Driver");
const AuditLog = require("../models/AuditLog");
const Booking = require("../models/Booking");
const ServiceArea = require("../models/ServiceArea");
const mongoose = require("mongoose");

const isValidId = (id) => mongoose.isValidObjectId(id);
const publicCarFields = "name brand model year category transmission fuelType seats pricePerDay pricePerKm includedKm location serviceAreas image description features available ownershipType verificationStatus createdAt";

const validateServiceAreas = async (ids = []) => {
  if (!Array.isArray(ids) || ids.some((id) => !mongoose.isValidObjectId(id))) return null;
  const activeAreas = await ServiceArea.find({ _id: { $in: ids }, active: true }).select("_id").lean();
  return activeAreas.length === new Set(ids.map(String)).size ? activeAreas.map((area) => area._id) : null;
};

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
    const filter = { available: true, verificationStatus: "approved", dataOrigin: { $in: ["admin", "driver"] } };
    const activeAreas = await ServiceArea.find({ active: true }).select("_id name supportsLocal supportsOutstation").lean();
    if (!activeAreas.length) return res.json({ success: true, count: 0, cars: [] });
    filter.$and = [{ $or: [
      { serviceAreas: { $in: activeAreas.map((area) => area._id) } },
      { $expr: { $in: [{ $toLower: "$location" }, activeAreas.map((area) => area.name.toLowerCase())] } },
    ] }];
    if (req.query.serviceArea) {
      const area = activeAreas.find((item) => String(item._id) === String(req.query.serviceArea));
      if (!area) return res.json({ success: true, count: 0, cars: [] });
      filter.$and.push({ $or: [{ serviceAreas: area._id }, { $expr: { $eq: [{ $toLower: "$location" }, area.name.toLowerCase()] } }] });
      const tripKey = req.query.tripType === "OUTSTATION" ? "supportsOutstation" : "supportsLocal";
      if (!area[tripKey]) return res.json({ success: true, count: 0, cars: [] });
    }
    const enums = { category: ["Hatchback", "Sedan", "SUV", "MUV", "Luxury", "Other"], transmission: ["Manual", "Automatic"], fuelType: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"] };
    for (const key of Object.keys(enums)) {
      if (req.query[key]) {
        const value = enums[key].find((item) => item.toLowerCase() === String(req.query[key]).toLowerCase());
        if (!value) return res.status(400).json({ success: false, message: `Invalid ${key} filter` });
        filter[key] = value;
      }
    }
    if (req.query.seats) {
      const seats = Number(req.query.seats);
      if (!Number.isInteger(seats) || seats < 1) return res.status(400).json({ success: false, message: "Invalid seats filter" });
      filter.seats = { $gte: seats };
    }
    if (req.query.maxPrice !== undefined) {
      const maxPrice = Number(req.query.maxPrice);
      if (!Number.isFinite(maxPrice) || maxPrice < 0) return res.status(400).json({ success: false, message: "Invalid maximum price" });
      filter.pricePerDay = { $lte: maxPrice };
    }
    if (req.query.tripType === "OUTSTATION") filter.pricePerKm = { $gt: 0 };
    if (req.query.tripType && !["DAILY", "OUTSTATION"].includes(req.query.tripType)) return res.status(400).json({ success: false, message: "Invalid trip type filter" });
    if (req.query.pickupDate || req.query.returnDate) {
      const pickupDate = new Date(req.query.pickupDate);
      const returnDate = new Date(req.query.returnDate);
      if (!req.query.pickupDate || !req.query.returnDate || Number.isNaN(pickupDate.getTime()) || Number.isNaN(returnDate.getTime()) || returnDate <= pickupDate) {
        return res.status(400).json({ success: false, message: "Invalid availability date range" });
      }
      const overlapping = await Booking.distinct("car", { bookingStatus: { $in: ["pending", "confirmed"] }, pickupDate: { $lt: returnDate }, returnDate: { $gt: pickupDate } });
      filter._id = { $nin: overlapping };
    }
    const cars = await Car.find(filter).select(publicCarFields).sort({ createdAt: -1 });

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
const getAdminCars = async (req, res) => {
  try {
    const cars = await Car.find()
      .populate({ path: "driver", populate: { path: "user", select: "name email phone" } })
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: cars.length, cars });
  } catch (error) {
    console.error("Get admin cars error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ driver: req.driver._id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: cars.length, cars });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createDriverCar = async (req, res) => {
  try {
    const { name, brand, model, year, category, transmission, fuelType, seats, pricePerDay, pricePerKm = 0, includedKm = 300, location, serviceAreas = [], image = "", description = "", features = [], registrationNumber = "", documents = [] } = req.body;
    if (!name || !brand || !model || !year || !category || !transmission || !fuelType || !Number.isFinite(Number(seats)) || Number(seats) < 2 || !Number.isFinite(Number(pricePerDay)) || Number(pricePerDay) < 0 || !location) {
      return res.status(422).json({ success: false, message: "Please provide valid required vehicle details" });
    }
    if (!Array.isArray(documents) || documents.some((doc) => !doc?.documentType || !doc?.documentUrl)) {
      return res.status(422).json({ success: false, message: "Each vehicle document needs a type and upload URL" });
    }
    const validServiceAreas = await validateServiceAreas(serviceAreas);
    if (!validServiceAreas) return res.status(422).json({ success: false, message: "Select only active service areas" });
    const normalizedRegistration = registrationNumber.trim().toUpperCase();
    if (normalizedRegistration && await Car.exists({ registrationNumber: normalizedRegistration })) {
      return res.status(409).json({ success: false, message: "This registration number is already registered" });
    }
    const car = await Car.create({
      name, brand, model, year: Number(year), category, transmission, fuelType, seats: Number(seats),
      pricePerDay: Number(pricePerDay), pricePerKm: Number(pricePerKm), includedKm: Number(includedKm),
      location, serviceAreas: validServiceAreas, image, description, features, registrationNumber: normalizedRegistration, documents,
      ownershipType: "partner", dataOrigin: "driver", driver: req.driver._id, available: false, verificationStatus: "pending",
    });
    await AuditLog.create({ actor: req.user.id, action: "DRIVER_VEHICLE_SUBMITTED", entityType: "Car", entityId: car._id, driver: req.driver._id, newValue: { verificationStatus: car.verificationStatus } });
    return res.status(201).json({ success: true, message: "Vehicle submitted for admin verification", car });
  } catch (error) {
    console.error("Driver vehicle submission error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateDriverCar = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Vehicle not found" });
    const car = await Car.findOne({ _id: req.params.id, driver: req.driver._id });
    if (!car) return res.status(404).json({ success: false, message: "Vehicle not found" });
    if (!["pending", "rejected"].includes(car.verificationStatus)) {
      return res.status(409).json({ success: false, message: "Only pending or rejected vehicles can be edited" });
    }
    const allowed = ["name", "brand", "model", "year", "category", "transmission", "fuelType", "seats", "pricePerDay", "pricePerKm", "includedKm", "location", "image", "description", "features", "registrationNumber", "documents"];
    if (req.body.serviceAreas !== undefined) {
      const validServiceAreas = await validateServiceAreas(req.body.serviceAreas);
      if (!validServiceAreas) return res.status(422).json({ success: false, message: "Select only active service areas" });
      car.serviceAreas = validServiceAreas;
    }
    for (const key of allowed) if (req.body[key] !== undefined) car[key] = req.body[key];
    if (car.registrationNumber && await Car.exists({ _id: { $ne: car._id }, registrationNumber: car.registrationNumber })) {
      return res.status(409).json({ success: false, message: "This registration number is already registered" });
    }
    car.verificationStatus = "pending";
    car.available = false;
    await car.save();
    await AuditLog.create({ actor: req.user.id, action: "DRIVER_VEHICLE_RESUBMITTED", entityType: "Car", entityId: car._id, driver: req.driver._id, newValue: { verificationStatus: car.verificationStatus } });
    return res.json({ success: true, message: "Vehicle resubmitted for review", car });
  } catch (error) {
    console.error("Driver vehicle update error:", error);
    return res.status(error.code === 11000 ? 409 : 422).json({ success: false, message: error.code === 11000 ? "This registration number is already registered" : "Invalid vehicle details" });
  }
};

const deleteDriverCar = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Vehicle not found" });
    const car = await Car.findOne({ _id: req.params.id, driver: req.driver._id });
    if (!car) return res.status(404).json({ success: false, message: "Vehicle not found" });
    if (car.verificationStatus === "approved" || car.available) return res.status(409).json({ success: false, message: "Approved or available vehicles must be taken offline by an admin" });
    await car.deleteOne();
    return res.json({ success: true, message: "Vehicle deleted" });
  } catch (error) {
    console.error("Driver vehicle delete error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCarById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    const car = await Car.findOne({ _id: req.params.id, available: true, verificationStatus: "approved", dataOrigin: { $in: ["admin", "driver"] } }).select(publicCarFields);

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
      serviceAreas = [],
      registrationNumber = "",
      documents = [],
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
    const validServiceAreas = await validateServiceAreas(serviceAreas);
    if (!validServiceAreas) return res.status(422).json({ success: false, message: "Select only active service areas" });

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
      serviceAreas: validServiceAreas,
      image,
      description,
      features,
      ownershipType,
      dataOrigin: "admin",
      driver: assignedDriver,
      registrationNumber: String(registrationNumber).trim().toUpperCase(),
      documents,
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
      verificationStatus,
      verificationReviewNote,
      registrationNumber,
      documents,
      dataOrigin,
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
    if (req.body.serviceAreas !== undefined) {
      const validServiceAreas = await validateServiceAreas(req.body.serviceAreas);
      if (!validServiceAreas) return res.status(422).json({ success: false, message: "Select only active service areas" });
      updateData.serviceAreas = validServiceAreas;
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
    if (registrationNumber !== undefined) updateData.registrationNumber = String(registrationNumber).trim().toUpperCase();
    if (documents !== undefined) updateData.documents = documents;
    if (dataOrigin !== undefined) {
      const existing = await Car.findById(req.params.id).select("driver dataOrigin");
      if (dataOrigin !== "admin" || !existing || existing.driver || ![undefined, "legacy"].includes(existing.dataOrigin)) {
        return res.status(422).json({ success: false, message: "Only legacy records can be adopted into the admin fleet" });
      }
      updateData.dataOrigin = "admin";
    }
    if (available !== undefined) {
      updateData.available = available;
    }
    if (verificationStatus !== undefined) {
      if (!["pending", "approved", "rejected", "suspended"].includes(verificationStatus)) {
        return res.status(422).json({ success: false, message: "Invalid vehicle verification status" });
      }
      updateData.verificationStatus = verificationStatus;
      updateData.verificationReviewNote = verificationStatus === "rejected" ? String(verificationReviewNote || "").trim().slice(0, 1000) : "";
      if (verificationStatus !== "approved") updateData.available = false;
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

    const before = await Car.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ success: false, message: "Car not found" });
    if (available === true && (before.verificationStatus !== "approved" || (verificationStatus !== undefined && verificationStatus !== "approved"))) {
      return res.status(409).json({ success: false, message: "A vehicle must be approved before it can be made available" });
    }
    if (verificationStatus !== undefined && verificationStatus !== "approved") updateData.available = false;
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

    if (verificationStatus !== undefined || available !== undefined) {
      await AuditLog.create({
        actor: req.user.id,
        action: "VEHICLE_STATUS_UPDATED",
        entityType: "Car",
        entityId: car._id,
        driver: car.driver,
        oldValue: { verificationStatus: before.verificationStatus, available: before.available },
        newValue: { verificationStatus: car.verificationStatus, available: car.available },
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
    const activeBooking = await Booking.exists({ car: req.params.id, bookingStatus: { $in: ["pending", "confirmed"] }, returnDate: { $gt: new Date() } });
    if (activeBooking) return res.status(409).json({ success: false, message: "Vehicle has active bookings and cannot be deleted" });
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
  getAdminCars,
  getMyCars,
  createDriverCar,
  updateDriverCar,
  deleteDriverCar,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
};

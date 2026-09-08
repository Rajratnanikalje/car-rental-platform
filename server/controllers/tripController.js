const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const AuditLog = require("../models/AuditLog");
const { getActiveSettings, createFinancialRecords } = require("./financeController");

const isValidId = (id) => mongoose.isValidObjectId(id);
const makeOtp = () => crypto.randomInt(100000, 1000000).toString();
const validEvidence = ({ odometer, photoUrl, location }) => Number.isFinite(Number(odometer)) && Number(odometer) >= 0 && typeof photoUrl === "string" && photoUrl.trim() && typeof location === "string" && location.trim();

const assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!isValidId(req.params.bookingId) || !isValidId(driverId)) return res.status(404).json({ success: false, message: "Booking or driver not found" });
    const booking = await Booking.findById(req.params.bookingId);
    const driver = await Driver.findOne({ _id: driverId, status: "approved" });
    if (!booking || !driver) return res.status(404).json({ success: false, message: "Booking or approved driver not found" });
    if (booking.bookingType !== "PRIVATE_CAR" || ["cancelled", "completed"].includes(booking.bookingStatus)) return res.status(400).json({ success: false, message: "This booking cannot be assigned" });
    if (booking.trip) return res.status(409).json({ success: false, message: "A trip is already assigned to this booking" });

    const otp = makeOtp();
    const trip = await Trip.create({
      booking: booking._id,
      driver: driver._id,
      otpHash: await bcrypt.hash(otp, 10),
      otpExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    booking.driver = driver._id;
    booking.trip = trip._id;
    booking.bookingStatus = "confirmed";
    await booking.save();

    return res.status(201).json({ success: true, message: "Driver assigned and customer start code generated", trip: { id: trip._id, status: trip.status } });
  } catch (error) {
    console.error("Assign driver error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCustomerOtp = async (req, res) => {
  try {
    if (!isValidId(req.params.bookingId)) return res.status(404).json({ success: false, message: "Booking not found" });
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user.id }).populate("trip");
    if (!booking || !booking.trip) return res.status(404).json({ success: false, message: "Assigned trip not found" });
    if (booking.trip.status === "driver_assigned") {
      return res.status(409).json({ success: false, message: "Your driver is on the way. The start OTP will unlock once the driver marks arrival at pickup." });
    }
    if (booking.trip.status === "trip_started" || booking.trip.status === "trip_in_progress") {
      return res.status(409).json({ success: false, message: "Trip is already in progress" });
    }
    if (booking.trip.status === "trip_completed") {
      return res.status(409).json({ success: false, message: "Trip has already been completed" });
    }
    if (booking.trip.status !== "driver_arrived") {
      return res.status(409).json({ success: false, message: "Start code is not available for this trip status" });
    }

    // The raw OTP is intentionally never stored. Reissue a fresh code only to the booking owner.
    const otp = makeOtp();
    booking.trip.otpHash = await bcrypt.hash(otp, 10);
    booking.trip.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await booking.trip.save();
    return res.json({ success: true, otp, expiresAt: booking.trip.otpExpiresAt });
  } catch (error) {
    console.error("Get customer OTP error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const markArrival = async (req, res) => {
  try {
    if (!isValidId(req.params.bookingId)) return res.status(404).json({ success: false, message: "Trip not found" });
    const trip = await Trip.findOne({ booking: req.params.bookingId, driver: req.driver._id });
    if (!trip) return res.status(404).json({ success: false, message: "Assigned trip not found" });
    if (trip.status !== "driver_assigned") return res.status(409).json({ success: false, message: "Arrival cannot be recorded for this trip" });
    trip.status = "driver_arrived";
    trip.arrivedAt = new Date();
    await trip.save();
    return res.json({ success: true, message: "Driver arrival recorded", trip: { id: trip._id, status: trip.status, arrivedAt: trip.arrivedAt } });
  } catch (error) {
    console.error("Mark arrival error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyAndStartTrip = async (req, res) => {
  try {
    const { otp, odometer, photoUrl, location } = req.body;
    if (!isValidId(req.params.bookingId)) return res.status(404).json({ success: false, message: "Trip not found" });
    if (!otp || !validEvidence({ odometer, photoUrl, location })) return res.status(400).json({ success: false, message: "Valid OTP, start odometer, dashboard photo and start location are required" });
    const trip = await Trip.findOne({ booking: req.params.bookingId, driver: req.driver._id }).select("+otpHash +otpExpiresAt");
    if (!trip) return res.status(404).json({ success: false, message: "Assigned trip not found" });
    if (trip.status !== "driver_arrived") return res.status(409).json({ success: false, message: "Driver arrival must be recorded before trip start" });
    if (trip.otpExpiresAt <= new Date() || !(await bcrypt.compare(String(otp), trip.otpHash))) return res.status(400).json({ success: false, message: "Invalid or expired trip start code" });

    trip.status = "trip_started";
    trip.otpVerifiedAt = new Date();
    trip.startEvidence = { odometer: Number(odometer), photoUrl: photoUrl.trim(), location: location.trim(), recordedAt: new Date() };
    await trip.save();
    return res.json({ success: true, message: "Customer verified and trip started", trip: { id: trip._id, status: trip.status, startedAt: trip.startEvidence.recordedAt } });
  } catch (error) {
    console.error("Start trip error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const completeTrip = async (req, res) => {
  try {
    const { odometer, photoUrl, location } = req.body;
    if (!isValidId(req.params.bookingId)) return res.status(404).json({ success: false, message: "Trip not found" });
    if (!validEvidence({ odometer, photoUrl, location })) return res.status(400).json({ success: false, message: "End odometer, dashboard photo and end location are required" });
    const trip = await Trip.findOne({ booking: req.params.bookingId, driver: req.driver._id });
    if (!trip) return res.status(404).json({ success: false, message: "Assigned trip not found" });
    if (trip.status !== "trip_started" && trip.status !== "trip_in_progress") return res.status(409).json({ success: false, message: "Trip must be started before completion" });
    if (!trip.startEvidence) return res.status(409).json({ success: false, message: "Trip cannot complete without start evidence" });

    const endOdometer = Number(odometer);
    if (endOdometer < trip.startEvidence.odometer) {
      return res.status(400).json({
        success: false,
        message: `End odometer reading (${endOdometer} KM) cannot be less than start odometer reading (${trip.startEvidence.odometer} KM)`,
      });
    }

    // Do not complete a financial trip until an admin has configured commission rules.
    await getActiveSettings();

    const distance = endOdometer - trip.startEvidence.odometer;
    const flags = [];
    if (distance > 2000) flags.push("UNUSUAL_DISTANCE");
    trip.endEvidence = { odometer: endOdometer, photoUrl: photoUrl.trim(), location: location.trim(), recordedAt: new Date() };
    trip.actualDistanceKm = distance;
    trip.fraudFlags = [...new Set([...trip.fraudFlags, ...flags])];
    trip.fraudReviewStatus = flags.length ? "flagged" : "clear";
    trip.status = "trip_completed";
    await trip.save();

    const booking = await Booking.findById(trip.booking);
    booking.totalKm = distance;
    booking.extraKm = Math.max(distance - booking.includedKm, 0);
    booking.extraKmAmount = booking.extraKm * booking.pricePerKm;
    booking.totalAmount = booking.rentalAmount + booking.extraKmAmount;
    booking.bookingStatus = "completed";
    await booking.save();
    const ledger = await createFinancialRecords({ booking, driver: req.driver._id });
    await AuditLog.create({
      actor: req.user.id,
      action: "TRIP_COMPLETED_AND_LEDGER_CREATED",
      entityType: "Trip",
      entityId: trip._id,
      booking: booking._id,
      driver: req.driver._id,
      newValue: { actualDistanceKm: distance, totalAmount: booking.totalAmount, commissionAmount: ledger.commissionAmount, driverEarnings: ledger.driverEarnings },
    });
    return res.json({ success: true, message: "Trip completed; final fare and commission recorded by the server", trip: { id: trip._id, status: trip.status, actualDistanceKm: distance, fraudFlags: trip.fraudFlags }, booking, ledger });
  } catch (error) {
    console.error("Complete trip error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Server error" });
  }
};

const getDriverTrips = async (req, res) => {
  try {
    const bookings = await Booking.find({ driver: req.driver._id })
      .populate("car")
      .populate("trip")
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error("Get driver trips error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllTrips = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.fraudReviewStatus) {
      filter.fraudReviewStatus = req.query.fraudReviewStatus;
    }

    const trips = await Trip.find(filter)
      .populate({
        path: "booking",
        populate: [
          { path: "user", select: "name email phone" },
          { path: "car", select: "name brand category image" },
        ],
      })
      .populate({
        path: "driver",
        populate: { path: "user", select: "name email phone" },
      })
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    console.error("Get all trips error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { assignDriver, getCustomerOtp, markArrival, verifyAndStartTrip, completeTrip, getDriverTrips, getAllTrips };

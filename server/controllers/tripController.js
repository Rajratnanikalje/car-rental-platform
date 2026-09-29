const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const DriverLedger = require("../models/DriverLedger");
const AuditLog = require("../models/AuditLog");
const { createFinancialRecords } = require("./financeController");

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
  const session = await mongoose.startSession();
  try {
    const { odometer, photoUrl, location } = req.body;
    if (!isValidId(req.params.bookingId)) return res.status(404).json({ success: false, message: "Trip not found" });
    if (!validEvidence({ odometer, photoUrl, location })) return res.status(400).json({ success: false, message: "End odometer, dashboard photo and end location are required" });
    let result;
    await session.withTransaction(async () => {
      const trip = await Trip.findOne({ booking: req.params.bookingId, driver: req.driver._id }).session(session);
      if (!trip) { const error = new Error("Assigned trip not found"); error.statusCode = 404; throw error; }
      if (trip.status === "trip_completed") {
        const booking = await Booking.findById(trip.booking).session(session);
        let ledger = await DriverLedger.findOne({ booking: trip.booking }).session(session);
        if (booking && !ledger) ledger = await createFinancialRecords({ booking, driver: req.driver._id, session });
        result = { trip, booking, ledger, alreadyCompleted: true };
        return;
      }
      if (trip.status !== "trip_started" && trip.status !== "trip_in_progress") { const error = new Error("Trip must be started before completion"); error.statusCode = 409; throw error; }
      if (!trip.startEvidence) { const error = new Error("Trip cannot complete without start evidence"); error.statusCode = 409; throw error; }
      const endOdometer = Number(odometer);
      if (endOdometer < trip.startEvidence.odometer) { const error = new Error("End odometer cannot be less than start odometer"); error.statusCode = 400; throw error; }
      const distance = endOdometer - trip.startEvidence.odometer;
      const flags = distance > 2000 ? ["UNUSUAL_DISTANCE"] : [];
      const changedTrip = await Trip.findOneAndUpdate(
        { _id: trip._id, status: { $in: ["trip_started", "trip_in_progress"] } },
        { $set: { endEvidence: { odometer: endOdometer, photoUrl: photoUrl.trim(), location: location.trim(), recordedAt: new Date() }, actualDistanceKm: distance, fraudFlags: [...new Set([...trip.fraudFlags, ...flags])], fraudReviewStatus: flags.length ? "flagged" : "clear", status: "trip_completed" } },
        { new: true, session }
      );
      if (!changedTrip) { const error = new Error("Trip completion is already being processed"); error.statusCode = 409; throw error; }
      const booking = await Booking.findById(trip.booking).session(session);
      if (!booking) { const error = new Error("Booking not found for this trip"); error.statusCode = 409; throw error; }
      booking.totalKm = distance;
      const billableDistance = booking.tripType === "OUTSTATION" ? booking.routeSnapshot?.distanceKm || 0 : 0;
      booking.extraKm = Math.max(billableDistance - booking.includedKm * booking.totalDays, 0);
      booking.extraKmAmount = booking.extraKm * booking.pricePerKm;
      const gross = booking.tripType === "OUTSTATION" ? booking.rentalAmount + booking.extraKmAmount : booking.rentalAmount;
      const pct = booking.financialSnapshot?.commissionPercentage || 0;
      const commission = Math.min(gross, Math.round(gross * pct) / 100 + (booking.financialSnapshot?.fixedCommission || 0));
      const fee = Math.min(Math.max(0, gross - commission), booking.financialSnapshot?.platformFee || 0);
      const tax = Math.round((gross + fee) * (booking.financialSnapshot?.taxPercentage || 0)) / 100;
      const earnings = Math.max(0, gross - commission - fee);
      booking.totalAmount = gross + fee + tax;
      booking.financialSnapshot = { ...booking.financialSnapshot.toObject?.(), grossAmount: gross, commissionAmount: commission, platformFee: fee, taxAmount: tax, driverEarnings: earnings, finalPayout: earnings };
      booking.bookingStatus = "completed";
      await booking.save({ session });
      const ledger = await createFinancialRecords({ booking, driver: req.driver._id, session });
      await AuditLog.create([{ actor: req.user.id, action: "TRIP_COMPLETED_AND_LEDGER_CREATED", entityType: "Trip", entityId: trip._id, booking: booking._id, driver: req.driver._id, newValue: { actualDistanceKm: distance, totalAmount: booking.totalAmount, commissionAmount: ledger.commissionAmount, driverEarnings: ledger.driverEarnings } }], { session });
      result = { trip: changedTrip, booking, ledger, alreadyCompleted: false };
    });
    return res.json({ success: true, message: result.alreadyCompleted ? "Trip completion was already recorded" : "Trip completed; final fare and commission recorded by the server", trip: { id: result.trip._id, status: result.trip.status, actualDistanceKm: result.trip.actualDistanceKm, fraudFlags: result.trip.fraudFlags }, booking: result.booking, ledger: result.ledger });
  } catch (error) {
    console.error("Complete trip error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Server error" });
  } finally {
    await session.endSession();
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

const reviewTripRisk = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Trip not found" });
    const { status, note = "" } = req.body;
    if (!["clear", "flagged", "under_review", "resolved"].includes(status)) return res.status(422).json({ success: false, message: "Invalid risk review status" });
    if (["under_review", "resolved"].includes(status) && !note.trim()) return res.status(422).json({ success: false, message: "A review note is required" });
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    const oldValue = { fraudReviewStatus: trip.fraudReviewStatus, fraudReviewNote: trip.fraudReviewNote };
    trip.fraudReviewStatus = status;
    trip.fraudReviewNote = note.trim();
    trip.fraudReviewedBy = req.user.id;
    trip.fraudReviewedAt = new Date();
    await trip.save();
    await AuditLog.create({ actor: req.user.id, action: "TRIP_RISK_REVIEWED", entityType: "Trip", entityId: trip._id, booking: trip.booking, driver: trip.driver, oldValue, newValue: { fraudReviewStatus: status, fraudReviewNote: trip.fraudReviewNote } });
    return res.json({ success: true, message: "Risk review recorded", trip });
  } catch (error) {
    console.error("Review trip risk error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { assignDriver, getCustomerOtp, markArrival, verifyAndStartTrip, completeTrip, getDriverTrips, getAllTrips, reviewTripRisk };

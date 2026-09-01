const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Car = require("../models/Car");
const ScheduledRide = require("../models/ScheduledRide");
const SeatBooking = require("../models/SeatBooking");

const isValidId = (id) => mongoose.isValidObjectId(id);
const createOtp = () => crypto.randomInt(100000, 1000000).toString();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const publishRide = async (req, res) => {
  try {
    const { carId, pickupPoint, destination, departureAt, totalSeats, pricePerSeat } = req.body;
    if (!isValidId(carId) || !pickupPoint?.trim() || !destination?.trim() || !departureAt || !Number.isInteger(Number(totalSeats)) || Number(totalSeats) < 1 || !Number.isFinite(Number(pricePerSeat)) || Number(pricePerSeat) < 0) {
      return res.status(400).json({ success: false, message: "Please provide valid ride details" });
    }
    const departure = new Date(departureAt);
    if (Number.isNaN(departure.getTime()) || departure <= new Date()) return res.status(400).json({ success: false, message: "Departure time must be in the future" });
    const car = await Car.findOne({ _id: carId, driver: req.driver._id, available: true });
    if (!car) return res.status(400).json({ success: false, message: "Select an available vehicle assigned to your driver account" });
    if (Number(totalSeats) > car.seats - 1) return res.status(400).json({ success: false, message: "Passenger seats cannot exceed the vehicle capacity minus the driver seat" });

    const ride = await ScheduledRide.create({
      driver: req.driver._id,
      car: car._id,
      pickupPoint: pickupPoint.trim(),
      destination: destination.trim(),
      departureAt: departure,
      totalSeats: Number(totalSeats),
      availableSeats: Number(totalSeats),
      pricePerSeat: Number(pricePerSeat),
    });
    return res.status(201).json({ success: true, message: "Seat ride published", ride });
  } catch (error) {
    console.error("Publish seat ride error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getRides = async (req, res) => {
  try {
    const filter = { status: { $in: ["published", "full"] }, departureAt: { $gt: new Date() } };
    if (req.query.pickupPoint) filter.pickupPoint = new RegExp(`^${escapeRegex(req.query.pickupPoint.trim())}`, "i");
    if (req.query.destination) filter.destination = new RegExp(`^${escapeRegex(req.query.destination.trim())}`, "i");
    const rides = await ScheduledRide.find(filter).populate("car", "name brand model seats image").sort({ departureAt: 1 });
    return res.json({ success: true, count: rides.length, rides });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getRideById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Ride not found" });
    const ride = await ScheduledRide.findById(req.params.id).populate("car", "name brand model seats image");
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });
    return res.json({ success: true, ride });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const createSeatBooking = async (req, res) => {
  let reservedRide = null;
  try {
    const { seats, pickupLocation, destination, paymentMethod = "cash" } = req.body;
    const requestedSeats = Number(seats);
    if (!isValidId(req.params.rideId)) return res.status(404).json({ success: false, message: "Ride not found" });
    if (!Number.isInteger(requestedSeats) || requestedSeats < 1 || !pickupLocation?.trim() || !destination?.trim() || !["cash", "online"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Please provide valid seat booking details" });
    }
    reservedRide = await ScheduledRide.findOneAndUpdate(
      { _id: req.params.rideId, status: "published", departureAt: { $gt: new Date() }, availableSeats: { $gte: requestedSeats } },
      { $inc: { availableSeats: -requestedSeats } },
      { new: true }
    );
    if (!reservedRide) return res.status(409).json({ success: false, message: "Requested seats are no longer available" });
    if (reservedRide.availableSeats === 0) {
      reservedRide.status = "full";
      await reservedRide.save();
    }
    const otp = createOtp();
    const booking = await SeatBooking.create({
      ride: reservedRide._id,
      user: req.user.id,
      seats: requestedSeats,
      pickupLocation: pickupLocation.trim(),
      destination: destination.trim(),
      fare: requestedSeats * reservedRide.pricePerSeat,
      paymentMethod,
      checkInOtpHash: await bcrypt.hash(otp, 10),
      checkInOtpExpiresAt: reservedRide.departureAt,
    });
    return res.status(201).json({ success: true, message: "Seat booking confirmed", booking, checkInOtp: otp });
  } catch (error) {
    if (reservedRide) {
      await ScheduledRide.findByIdAndUpdate(reservedRide._id, { $inc: { availableSeats: Number(req.body.seats) }, $set: { status: "published" } });
    }
    console.error("Create seat booking error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMySeatBookings = async (req, res) => {
  try {
    const bookings = await SeatBooking.find({ user: req.user.id }).populate("ride").sort({ createdAt: -1 });
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const cancelSeatBooking = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Seat booking not found" });
    const booking = await SeatBooking.findOne({ _id: req.params.id, user: req.user.id }).populate("ride");
    if (!booking) return res.status(404).json({ success: false, message: "Seat booking not found" });
    if (booking.bookingStatus !== "confirmed") return res.status(409).json({ success: false, message: "This seat booking cannot be cancelled" });
    if (booking.ride.departureAt <= new Date()) return res.status(409).json({ success: false, message: "This ride has already departed" });
    booking.bookingStatus = "cancelled";
    await booking.save();
    const ride = await ScheduledRide.findByIdAndUpdate(booking.ride._id, { $inc: { availableSeats: booking.seats }, $set: { status: "published" } }, { new: true });
    return res.json({ success: true, message: "Seat booking cancelled", booking, availableSeats: ride.availableSeats });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getManifest = async (req, res) => {
  try {
    if (!isValidId(req.params.rideId)) return res.status(404).json({ success: false, message: "Ride not found" });
    const ride = await ScheduledRide.findOne({ _id: req.params.rideId, driver: req.driver._id });
    if (!ride) return res.status(404).json({ success: false, message: "Assigned ride not found" });
    const passengers = await SeatBooking.find({ ride: ride._id, bookingStatus: { $in: ["confirmed", "checked_in"] } }).populate("user", "name phone").select("user seats pickupLocation destination fare paymentStatus bookingStatus checkedInAt");
    return res.json({ success: true, ride, passengers });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const checkInPassenger = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!isValidId(req.params.bookingId) || !otp) return res.status(400).json({ success: false, message: "A valid passenger booking and OTP are required" });
    const booking = await SeatBooking.findById(req.params.bookingId).populate("ride").select("+checkInOtpHash +checkInOtpExpiresAt");
    if (!booking || booking.ride.driver.toString() !== req.driver._id.toString()) return res.status(404).json({ success: false, message: "Passenger booking not found" });
    if (booking.bookingStatus !== "confirmed") return res.status(409).json({ success: false, message: "Passenger cannot be checked in" });
    if (booking.checkInOtpExpiresAt < new Date() || !(await bcrypt.compare(String(otp), booking.checkInOtpHash))) return res.status(400).json({ success: false, message: "Invalid or expired passenger OTP" });
    booking.bookingStatus = "checked_in";
    booking.checkedInAt = new Date();
    await booking.save();
    return res.json({ success: true, message: "Passenger checked in", booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { publishRide, getRides, getRideById, createSeatBooking, getMySeatBookings, cancelSeatBooking, getManifest, checkInPassenger };

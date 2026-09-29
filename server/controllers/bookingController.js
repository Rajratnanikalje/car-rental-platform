const Booking = require("../models/Booking");
const Car = require("../models/Car");
const Trip = require("../models/Trip");
const mongoose = require("mongoose");
const crypto = require("crypto");
const SystemSetting = require("../models/SystemSetting");
const { getRoute } = require("../services/routeDistance");
const ServiceArea = require("../models/ServiceArea");

const isValidId = (id) => mongoose.isValidObjectId(id);

// =========================
// CREATE BOOKING
// =========================
const createBooking = async (req, res) => {
  let reservationCarId = null;
  let reservationToken = null;
  try {
    const {
      car,
      pickupDate,
      returnDate,
      pickupLocation,
      destination,
      pickupTime,
      paymentMethod = "cash",
      tripType = "DAILY",
      roundTrip = false,
      serviceArea,
    } = req.body;

    // Validation
    if (
      !car ||
      !pickupDate ||
      !returnDate ||
      !pickupLocation ||
      !destination ||
      !pickupTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details",
      });
    }

    // Check car
    if (!isValidId(car)) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    if (!["cash", "online"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    const carData = await Car.findOne({ _id: car, available: true, verificationStatus: "approved", dataOrigin: { $in: ["admin", "driver"] } });

    if (!carData) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }
    if (!isValidId(serviceArea)) return res.status(422).json({ success: false, message: "Select a valid service area" });
    const selectedArea = await ServiceArea.findOne({ _id: serviceArea, active: true }).lean();
    if (!selectedArea || (tripType === "OUTSTATION" ? !selectedArea.supportsOutstation : !selectedArea.supportsLocal)) {
      return res.status(422).json({ success: false, message: "The selected service area is unavailable for this trip type" });
    }
    const supportedArea = (carData.serviceAreas || []).some((item) => String(item) === String(selectedArea._id)) || String(carData.location).trim().toLowerCase() === selectedArea.name.toLowerCase();
    if (!supportedArea) return res.status(422).json({ success: false, message: "This vehicle does not serve the selected pickup area" });
    if (!["DAILY", "OUTSTATION"].includes(tripType)) return res.status(422).json({ success: false, message: "Invalid trip type" });
    if (typeof roundTrip !== "boolean") return res.status(422).json({ success: false, message: "Invalid round-trip option" });
    if (tripType === "OUTSTATION" && Number(carData.pricePerKm) <= 0) return res.status(422).json({ success: false, message: "This vehicle is not enabled for outstation trips" });

    // Convert dates
    const startDate = new Date(pickupDate);
    const endDate = new Date(returnDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid pickup or return date",
      });
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(pickupTime)) || startDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({ success: false, message: "Pickup date or time is invalid" });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date",
      });
    }

    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / 86400000));
    let routeSnapshot = { origin: "", destination: "", distanceKm: 0, duration: null, provider: "", calculatedAt: null };
    if (tripType === "OUTSTATION") {
      const outbound = await getRoute(pickupLocation.trim(), destination.trim(), startDate);
      const returnRoute = roundTrip ? await getRoute(destination.trim(), pickupLocation.trim(), endDate) : null;
      routeSnapshot = {
        origin: pickupLocation.trim(), destination: destination.trim(),
        distanceKm: outbound.distanceKm + (returnRoute?.distanceKm || 0),
        duration: outbound.duration,
        provider: "google-routes",
        calculatedAt: new Date(),
      };
    }

    const settings = await SystemSetting.findOne({ key: "platform", isActive: true }).lean();
    if (!settings) return res.status(503).json({ success: false, message: "Booking is temporarily unavailable until platform pricing rules are configured" });
    const pricePerDay = Number(carData.pricePerDay);
    const includedKm = Number(carData.includedKm ?? 0);
    const includedLimitKm = includedKm * totalDays;
    const pricePerKm = Number(carData.pricePerKm ?? 0);
    const rentalAmount = totalDays * pricePerDay;
    const totalKm = routeSnapshot.distanceKm;
    const extraKm = tripType === "OUTSTATION" ? Math.max(0, totalKm - includedLimitKm) : 0;
    const extraKmAmount = extraKm * pricePerKm;
    const grossAmount = rentalAmount + extraKmAmount;
    const commissionPercentage = Number(settings?.commissionPercentage || 0);
    const commissionAmount = Math.min(grossAmount, Math.round(grossAmount * commissionPercentage) / 100 + Number(settings?.fixedCommission || 0));
    const platformFee = Math.min(Math.max(0, grossAmount - commissionAmount), Number(settings?.platformFee || 0));
    const taxAmount = Math.round((grossAmount + platformFee) * Number(settings?.taxPercentage || 0)) / 100;
    const totalAmount = grossAmount + platformFee + taxAmount;
    const driverEarnings = Math.max(0, grossAmount - commissionAmount - platformFee);

    // =========================
    // CHECK DATE CONFLICT
    // =========================
    // Acquire a short MongoDB-backed per-vehicle reservation lock before the
    // overlap query. The atomic compare-and-set works across server processes.
    reservationCarId = carData._id;
    reservationToken = crypto.randomUUID();
    const reservedCar = await Car.findOneAndUpdate({
      _id: carData._id,
      available: true,
      verificationStatus: "approved",
      dataOrigin: { $in: ["admin", "driver"] },
      $or: [{ bookingLockUntil: null }, { bookingLockUntil: { $lt: new Date() } }],
    }, { $set: { bookingLockToken: reservationToken, bookingLockUntil: new Date(Date.now() + 30000) } }, { new: true });
    if (!reservedCar) return res.status(409).json({ success: false, message: "Vehicle is being reserved or is no longer available. Please retry." });

    const releaseReservation = () => Car.updateOne(
      { _id: reservationCarId, bookingLockToken: reservationToken },
      { $set: { bookingLockToken: null, bookingLockUntil: null } }
    );

    const existingBooking = await Booking.findOne({
      car: carData._id,
      bookingStatus: {
        $in: ["pending", "confirmed"],
      },
      pickupDate: {
        $lt: endDate,
      },
      returnDate: {
        $gt: startDate,
      },
    });

    if (existingBooking) {
      await releaseReservation();
      reservationToken = null;
      return res.status(409).json({
        success: false,
        message: "Car is already booked for the selected dates",
      });
    }

    // Calculate total days

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      car: carData._id,
      tripType,
      serviceArea: selectedArea._id,
      roundTrip: tripType === "OUTSTATION" && Boolean(roundTrip),
      routeSnapshot,
      financialSnapshot: { grossAmount, commissionPercentage, fixedCommission: Number(settings?.fixedCommission || 0), commissionAmount, platformFee, taxPercentage: Number(settings?.taxPercentage || 0), taxAmount, driverEarnings, refundAmount: 0, finalPayout: driverEarnings },

      pickupDate: startDate,
      returnDate: endDate,
      pickupLocation,
      destination,
      pickupTime,

      totalDays,
      pricePerDay,

      includedKm,
      pricePerKm,

      totalKm,
      extraKm,
      extraKmAmount,

      rentalAmount,
      totalAmount,
      paymentMethod,
    });

    await releaseReservation();
    reservationToken = null;

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    if (reservationCarId && reservationToken) {
      await Car.updateOne({ _id: reservationCarId, bookingLockToken: reservationToken }, { $set: { bookingLockToken: null, bookingLockUntil: null } }).catch(() => {});
    }
    console.error("Create Booking Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET MY BOOKINGS
// =========================
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
    })
      .populate("car")
      .populate({ path: "trip", select: "status arrivedAt actualDistanceKm" })
      .populate({ path: "driver", select: "mobile status user", populate: { path: "user", select: "name phone" } })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get My Bookings Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET SINGLE BOOKING
// =========================
const getBookingById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate("car")
      .populate({ path: "trip", select: "status arrivedAt actualDistanceKm" })
      .populate({ path: "driver", select: "mobile status user", populate: { path: "user", select: "name phone" } });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// UPDATE ACTUAL KM
// =========================
const updateBookingKm = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "KM can only be recorded through the verified trip-completion process",
  });

  /* Legacy calculation code is intentionally unreachable. Final distance and fare
     are now derived from authenticated driver odometer evidence in Trip. */
  try {
    const { totalKm } = req.body;

    // Validation
    if (
      totalKm === undefined ||
      totalKm === null ||
      isNaN(totalKm) ||
      Number(totalKm) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid total KM",
      });
    }

    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Cancelled booking cannot be updated
    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled booking cannot be updated",
      });
    }

    const actualKm = Number(totalKm);

    // Calculate extra KM
    const includedKm = booking.includedKm;
    const pricePerKm = booking.pricePerKm;

    const extraKm = Math.max(
      actualKm - includedKm,
      0
    );

    // Calculate extra KM amount
    const extraKmAmount =
      extraKm * pricePerKm;

    // Calculate final total
    const totalAmount =
      booking.rentalAmount + extraKmAmount;

    // Update booking
    booking.totalKm = actualKm;
    booking.extraKm = extraKm;
    booking.extraKmAmount = extraKmAmount;
    booking.totalAmount = totalAmount;

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking KM updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Update Booking KM Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// CANCEL BOOKING
// =========================
const cancelBooking = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.bookingStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed booking cannot be cancelled",
      });
    }

    const trip = await Trip.findOne({ booking: booking._id });
    if (trip && ["trip_started", "trip_in_progress", "trip_completed"].includes(trip.status)) {
      return res.status(400).json({
        success: false,
        message: "An active or completed trip cannot be cancelled through this endpoint",
      });
    }

    if (trip) {
      trip.status = "cancelled";
      await trip.save();
    }

    booking.bookingStatus = "cancelled";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET ALL BOOKINGS (ADMIN)
// =========================
const getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.bookingStatus = req.query.status;
    }
    const bookings = await Booking.find(filter)
      .populate("user", "name email phone")
      .populate("car", "name brand category image pricePerDay")
      .populate({ path: "driver", populate: { path: "user", select: "name phone" } })
      .populate("trip")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get All Bookings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// EXPORT
// =========================
module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingKm,
  cancelBooking,
  getAllBookings,
};

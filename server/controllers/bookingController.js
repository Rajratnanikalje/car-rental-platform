const Booking = require("../models/Booking");
const Car = require("../models/Car");
const Trip = require("../models/Trip");
const mongoose = require("mongoose");

const isValidId = (id) => mongoose.isValidObjectId(id);

// =========================
// CREATE BOOKING
// =========================
const createBooking = async (req, res) => {
  try {
    const {
      car,
      pickupDate,
      returnDate,
      pickupLocation,
      paymentMethod = "cash",
    } = req.body;

    // Validation
    if (
      !car ||
      !pickupDate ||
      !returnDate ||
      !pickupLocation
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

    const carData = await Car.findById(car);

    if (!carData) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    // Check car availability
    if (!carData.available) {
      return res.status(400).json({
        success: false,
        message: "Car is currently not available",
      });
    }

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

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date",
      });
    }

    // =========================
    // CHECK DATE CONFLICT
    // =========================
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
      return res.status(409).json({
        success: false,
        message: "Car is already booked for the selected dates",
      });
    }

    // Calculate total days
    const difference =
      endDate.getTime() - startDate.getTime();

    const totalDays = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    // Daily rental
    const pricePerDay = carData.pricePerDay;

    const rentalAmount =
      totalDays * pricePerDay;

    // =========================
    // KM PRICING
    // =========================
    const includedKm =
      carData.includedKm ?? 300;

    const pricePerKm =
      carData.pricePerKm ?? 0;

    // Actual KM will be updated later
    const totalKm = 0;
    const extraKm = 0;
    const extraKmAmount = 0;

    // Final total
    const totalAmount =
      rentalAmount + extraKmAmount;

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      car: carData._id,

      pickupDate: startDate,
      returnDate: endDate,
      pickupLocation,

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

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
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
    }).populate("car");

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
// EXPORT
// =========================
module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingKm,
  cancelBooking,
};

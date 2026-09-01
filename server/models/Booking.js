const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },

    bookingType: {
      type: String,
      enum: ["PRIVATE_CAR", "SEAT_RIDE"],
      default: "PRIVATE_CAR",
      immutable: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    pickupDate: {
      type: Date,
      required: true,
    },

    returnDate: {
      type: Date,
      required: true,
    },

    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },

    // Total rental days
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },

    // Daily rental price at the time of booking
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },

    // KM included in rental
    includedKm: {
      type: Number,
      required: true,
      min: 0,
    },

    // Extra KM price
    pricePerKm: {
      type: Number,
      required: true,
      min: 0,
    },

    // Actual KM driven
    totalKm: {
      type: Number,
      default: 0,
      min: 0,
    },

    // KM above included limit
    extraKm: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Extra KM charge
    extraKmAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Day rental amount
    rentalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Final total amount
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["online", "cash"],
      default: "cash",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);

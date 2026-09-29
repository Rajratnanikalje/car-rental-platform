const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dataOrigin: { type: String, enum: ["demo", "production", "legacy"], default: "legacy" },

    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    serviceArea: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceArea", default: null },

    bookingType: {
      type: String,
      enum: ["PRIVATE_CAR", "SEAT_RIDE"],
      default: "PRIVATE_CAR",
      immutable: true,
    },
    tripType: { type: String, enum: ["DAILY", "OUTSTATION"], default: "DAILY" },
    roundTrip: { type: Boolean, default: false },
    routeSnapshot: {
      origin: { type: String, default: "" },
      destination: { type: String, default: "" },
      distanceKm: { type: Number, default: 0, min: 0 },
      duration: { type: String, default: null },
      provider: { type: String, default: "" },
      calculatedAt: { type: Date, default: null },
    },
    financialSnapshot: {
      grossAmount: { type: Number, default: 0, min: 0 },
      commissionPercentage: { type: Number, default: 0, min: 0, max: 100 },
      fixedCommission: { type: Number, default: 0, min: 0 },
      commissionAmount: { type: Number, default: 0, min: 0 },
      platformFee: { type: Number, default: 0, min: 0 },
      taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
      taxAmount: { type: Number, default: 0, min: 0 },
      driverEarnings: { type: Number, default: 0, min: 0 },
      refundAmount: { type: Number, default: 0, min: 0 },
      finalPayout: { type: Number, default: 0, min: 0 },
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

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    pickupTime: {
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

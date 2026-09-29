const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Hatchback",
        "Sedan",
        "SUV",
        "MUV",
        "Luxury",
        "Other",
      ],
    },

    transmission: {
      type: String,
      required: true,
      enum: ["Manual", "Automatic"],
    },

    fuelType: {
      type: String,
      required: true,
      enum: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"],
    },

    seats: {
      type: Number,
      required: true,
      min: 1,
    },

    // Normal daily rental price
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },

    // Extra KM charge after included KM limit
    pricePerKm: {
      type: Number,
      default: 0,
      min: 0,
    },

    // KM included in the normal rental
    includedKm: {
      type: Number,
      default: 300,
      min: 0,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },
    serviceAreas: [{ type: mongoose.Schema.Types.ObjectId, ref: "ServiceArea", index: true }],

    image: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    features: {
      type: [String],
      default: [],
    },

    available: {
      type: Boolean,
      default: true,
    },

    ownershipType: {
      type: String,
      enum: ["company", "partner"],
      default: "company",
    },
    dataOrigin: { type: String, enum: ["admin", "driver", "demo", "legacy"], default: "legacy", index: true },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    bookingLockToken: { type: String, default: null, select: false },
    bookingLockUntil: { type: Date, default: null, select: false, index: true },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "approved",
      index: true,
    },
    verificationReviewNote: { type: String, trim: true, default: "", maxlength: 1000 },
    registrationNumber: { type: String, trim: true, uppercase: true, default: "" },
    documents: [{
      documentType: { type: String, trim: true },
      documentUrl: { type: String, trim: true },
      expiryDate: { type: Date, default: null },
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      verifiedAt: { type: Date, default: null },
      reviewNote: { type: String, default: "", trim: true, maxlength: 1000 },
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Car", carSchema);

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

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Car", carSchema);

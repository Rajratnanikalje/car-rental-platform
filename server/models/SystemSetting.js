const mongoose = require("mongoose");

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    commissionPercentage: { type: Number, required: true, min: 0, max: 100 },
    fixedCommission: { type: Number, required: true, min: 0, default: 0 },
    platformFee: { type: Number, required: true, min: 0, default: 0 },
    includedKm: { type: Number, min: 0, default: 0 },
    perKmRate: { type: Number, min: 0, default: 0 },
    extraKmRate: { type: Number, min: 0, default: 0 },
    acCharge: { type: Number, min: 0, default: 0 },
    minimumFare: { type: Number, min: 0, default: 0 },
    cancellationFee: { type: Number, min: 0, default: 0 },
    taxPercentage: { type: Number, min: 0, max: 100, default: 0 },
    maximumSeats: { type: Number, min: 1, default: 8 },
    paymentMethods: { type: [String], enum: ["cash", "online"], default: ["cash", "online"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSetting", systemSettingSchema);

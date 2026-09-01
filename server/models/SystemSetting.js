const mongoose = require("mongoose");

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    commissionPercentage: { type: Number, required: true, min: 0, max: 100 },
    fixedCommission: { type: Number, required: true, min: 0, default: 0 },
    platformFee: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSetting", systemSettingSchema);

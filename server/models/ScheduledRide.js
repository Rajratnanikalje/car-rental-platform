const mongoose = require("mongoose");

const scheduledRideSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
    dataOrigin: { type: String, enum: ["demo", "production", "legacy"], default: "legacy" },
    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    pickupPoint: { type: String, required: true, trim: true, maxlength: 300 },
    destination: { type: String, required: true, trim: true, maxlength: 300 },
    departureAt: { type: Date, required: true, index: true },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    pricePerSeat: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["published", "full", "completed", "cancelled"], default: "published", index: true },
  },
  { timestamps: true }
);

scheduledRideSchema.index({ departureAt: 1, status: 1 });

module.exports = mongoose.model("ScheduledRide", scheduledRideSchema);

const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
  {
    odometer: { type: Number, required: true, min: 0 },
    photoUrl: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true, maxlength: 500 },
    recordedAt: { type: Date, required: true },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
    status: { type: String, enum: ["driver_assigned", "driver_arrived", "trip_started", "trip_in_progress", "trip_completed", "cancelled"], default: "driver_assigned", index: true },
    otpHash: { type: String, required: true, select: false },
    otpExpiresAt: { type: Date, required: true, select: false },
    otpVerifiedAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    startEvidence: { type: evidenceSchema, default: null },
    endEvidence: { type: evidenceSchema, default: null },
    actualDistanceKm: { type: Number, default: 0, min: 0 },
    fraudFlags: { type: [{ type: String, enum: ["ODOMETER_DECREASE", "MISSING_START_PHOTO", "MISSING_END_PHOTO", "UNUSUAL_DISTANCE", "TRIP_STARTED_LATE", "TRIP_COMPLETED_WITHOUT_START", "MANUAL_OVERRIDE", "CUSTOMER_DISPUTE"] }], default: [] },
    fraudReviewStatus: { type: String, enum: ["clear", "flagged", "under_review", "resolved"], default: "clear" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);

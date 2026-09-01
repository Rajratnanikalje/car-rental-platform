const mongoose = require("mongoose");

const seatBookingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "ScheduledRide", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seats: { type: Number, required: true, min: 1 },
    pickupLocation: { type: String, required: true, trim: true, maxlength: 300 },
    destination: { type: String, required: true, trim: true, maxlength: 300 },
    fare: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["online", "cash"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    bookingStatus: { type: String, enum: ["confirmed", "checked_in", "cancelled", "completed"], default: "confirmed", index: true },
    checkInOtpHash: { type: String, required: true, select: false },
    checkInOtpExpiresAt: { type: Date, required: true, select: false },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SeatBooking", seatBookingSchema);

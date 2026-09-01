const mongoose = require("mongoose");

const driverLedgerSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
    grossAmount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0, default: 0 },
    driverEarnings: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["online", "cash"], required: true },
    amountCollected: { type: Number, required: true, min: 0, default: 0 },
    amountPayableToRideOn: { type: Number, required: true, min: 0, default: 0 },
    amountPayableToDriver: { type: Number, required: true, min: 0, default: 0 },
    cashConfirmedAt: { type: Date, default: null },
    settlementStatus: { type: String, enum: ["pending", "approved", "processing", "paid", "disputed", "failed"], default: "pending" },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DriverLedger", driverLedgerSchema);

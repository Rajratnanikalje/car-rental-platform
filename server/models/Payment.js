const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    dataOrigin: { type: String, enum: ["demo", "production", "legacy"], default: "legacy" },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["online", "cash"], required: true },
    status: { type: String, enum: ["pending", "received", "failed", "refunded"], default: "pending" },
    gateway: { type: String, default: "" },
    gatewayOrderId: { type: String, default: "", select: false },
    gatewayPaymentId: { type: String, default: "", select: false },
    receivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

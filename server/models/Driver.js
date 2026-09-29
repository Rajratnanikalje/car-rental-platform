const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dataOrigin: { type: String, enum: ["demo", "production", "legacy"], default: "legacy" },
    mobile: { type: String, required: true, trim: true },
    profilePhoto: { type: String, default: "", trim: true },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    emergencyContact: {
      name: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
    },
    drivingLicence: {
      number: { type: String, required: true, trim: true, select: false },
      expiryDate: { type: Date, required: true },
      documentUrl: { type: String, required: true, trim: true, select: false },
      verificationStatus: { type: String, enum: ["pending", "approved", "rejected", "correction_requested"], default: "pending" },
      verifiedAt: { type: Date, default: null },
      reviewNote: { type: String, default: "", trim: true, maxlength: 1000 },
    },
    identity: {
      documentType: { type: String, enum: ["aadhaar", "passport", "voter_id", "other"], required: true },
      documentNumber: { type: String, required: true, trim: true, select: false },
      documentUrl: { type: String, required: true, trim: true, select: false },
      verificationStatus: { type: String, enum: ["pending", "approved", "rejected", "correction_requested"], default: "pending" },
      verifiedAt: { type: Date, default: null },
      reviewNote: { type: String, default: "", trim: true, maxlength: 1000 },
    },
    payoutAccount: {
      accountHolderName: { type: String, required: true, trim: true, select: false },
      bankName: { type: String, required: true, trim: true },
      accountNumber: { type: String, required: true, trim: true, select: false },
      ifsc: { type: String, required: true, trim: true, uppercase: true, select: false },
      upiId: { type: String, trim: true, lowercase: true, select: false },
      isVerified: { type: Boolean, default: false },
      isPrimary: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "suspended", "blocked"],
      default: "pending",
      index: true,
    },
    reviewNote: { type: String, default: "", trim: true, maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    verificationHistory: [{
      status: { type: String, enum: ["pending", "under_review", "approved", "rejected", "suspended", "blocked"], required: true },
      note: { type: String, default: "", trim: true, maxlength: 1000 },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reviewedAt: { type: Date, required: true },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);

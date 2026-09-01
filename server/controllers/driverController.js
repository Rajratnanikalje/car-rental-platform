const Driver = require("../models/Driver");
const User = require("../models/User");
const mongoose = require("mongoose");

const safeDriver = (driver) => {
  const data = driver.toObject ? driver.toObject() : driver;
  const accountNumber = data.payoutAccount?.accountNumber || "";
  return {
    ...data,
    drivingLicence: data.drivingLicence ? { expiryDate: data.drivingLicence.expiryDate } : undefined,
    identity: data.identity ? { documentType: data.identity.documentType } : undefined,
    payoutAccount: data.payoutAccount
      ? {
          bankName: data.payoutAccount.bankName,
          isVerified: data.payoutAccount.isVerified,
          isPrimary: data.payoutAccount.isPrimary,
          accountNumberMasked: accountNumber ? `XXXX${accountNumber.slice(-4)}` : undefined,
        }
      : undefined,
  };
};

const applyAsDriver = async (req, res) => {
  try {
    const existing = await Driver.findOne({ user: req.user.id });
    if (existing) {
      return res.status(409).json({ success: false, message: "A driver application already exists for this account" });
    }

    const { mobile, profilePhoto, address, emergencyContact, drivingLicence, identity, payoutAccount } = req.body;
    if (!mobile || !address || !emergencyContact?.name || !emergencyContact?.mobile || !drivingLicence?.number || !drivingLicence?.expiryDate || !drivingLicence?.documentUrl || !identity?.documentType || !identity?.documentNumber || !identity?.documentUrl || !payoutAccount?.accountHolderName || !payoutAccount?.bankName || !payoutAccount?.accountNumber || !payoutAccount?.ifsc) {
      return res.status(400).json({ success: false, message: "Please provide all required driver verification and payout details" });
    }

    const licenceExpiry = new Date(drivingLicence.expiryDate);
    if (Number.isNaN(licenceExpiry.getTime()) || licenceExpiry <= new Date()) {
      return res.status(400).json({ success: false, message: "A valid future driving licence expiry date is required" });
    }

    const driver = await Driver.create({
      user: req.user.id,
      mobile,
      profilePhoto,
      address,
      emergencyContact,
      drivingLicence: { ...drivingLicence, expiryDate: licenceExpiry },
      identity,
      payoutAccount,
    });

    return res.status(201).json({ success: true, message: "Driver application submitted for review", driver: safeDriver(driver) });
  } catch (error) {
    console.error("Driver application error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMyDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });
    if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found" });
    return res.json({ success: true, driver: safeDriver(driver) });
  } catch (error) {
    console.error("Get driver profile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getDrivers = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const drivers = await Driver.find(filter).populate("user", "name email phone").sort({ createdAt: -1 });
    return res.json({ success: true, count: drivers.length, drivers: drivers.map(safeDriver) });
  } catch (error) {
    console.error("Get drivers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateDriverStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Driver not found" });
    const { status, reviewNote = "" } = req.body;
    const allowedStatuses = ["under_review", "approved", "rejected", "suspended", "blocked"];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid driver status" });
    if (["rejected", "suspended", "blocked"].includes(status) && !reviewNote.trim()) return res.status(400).json({ success: false, message: "A review note is required for this status" });

    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    driver.status = status;
    driver.reviewNote = reviewNote.trim();
    driver.reviewedBy = req.user.id;
    driver.reviewedAt = new Date();
    await driver.save();

    if (status === "approved") await User.findByIdAndUpdate(driver.user, { role: "driver" });
    return res.json({ success: true, message: "Driver status updated", driver: safeDriver(driver) });
  } catch (error) {
    console.error("Update driver status error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { applyAsDriver, getMyDriverProfile, getDrivers, updateDriverStatus };

const mongoose = require("mongoose");
const SystemSetting = require("../models/SystemSetting");
const DriverLedger = require("../models/DriverLedger");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Car = require("../models/Car");

const getActiveSettings = async () => {
  const settings = await SystemSetting.findOne({ key: "platform", isActive: true });
  if (!settings) {
    const error = new Error("Commission settings must be configured by an admin before completing trips");
    error.statusCode = 503;
    throw error;
  }
  return settings;
};

const calculateLedgerAmounts = (grossAmount, settings) => {
  const percentageCommission = Math.round((grossAmount * settings.commissionPercentage) / 100 * 100) / 100;
  const commissionAmount = Math.min(grossAmount, percentageCommission + settings.fixedCommission);
  const platformFee = Math.min(grossAmount - commissionAmount, settings.platformFee);
  return { commissionAmount, platformFee, driverEarnings: grossAmount - commissionAmount - platformFee };
};

const createFinancialRecords = async ({ booking, driver }) => {
  const settings = await getActiveSettings();
  const existing = await DriverLedger.findOne({ booking: booking._id });
  if (existing) return existing;
  const amounts = calculateLedgerAmounts(booking.totalAmount, settings);
  const isCash = booking.paymentMethod === "cash";

  // Check if Payment already exists for this booking to prevent duplicate key error
  let payment = await Payment.findOne({ booking: booking._id });
  if (!payment) {
    payment = await Payment.create({
      booking: booking._id,
      amount: booking.totalAmount,
      method: booking.paymentMethod,
      status: isCash ? "pending" : "received",
      receivedAt: isCash ? null : new Date(),
    });
  } else if (payment.amount !== booking.totalAmount) {
    payment.amount = booking.totalAmount;
    await payment.save();
  }

  return DriverLedger.create({
    booking: booking._id,
    driver,
    grossAmount: booking.totalAmount,
    ...amounts,
    paymentMethod: booking.paymentMethod,
    amountPayableToRideOn: isCash ? amounts.commissionAmount + amounts.platformFee : 0,
    amountPayableToDriver: isCash ? 0 : amounts.driverEarnings,
  });
};

const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findOne({ key: "platform" });
    return res.json({ success: true, settings: settings || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { commissionPercentage, fixedCommission = 0, platformFee = 0, isActive = true } = req.body;
    if (!Number.isFinite(Number(commissionPercentage)) || Number(commissionPercentage) < 0 || Number(commissionPercentage) > 100 || !Number.isFinite(Number(fixedCommission)) || Number(fixedCommission) < 0 || !Number.isFinite(Number(platformFee)) || Number(platformFee) < 0) {
      return res.status(400).json({ success: false, message: "Provide valid non-negative commission and fee values" });
    }
    const previous = await SystemSetting.findOne({ key: "platform" }).lean();
    const settings = await SystemSetting.findOneAndUpdate(
      { key: "platform" },
      { commissionPercentage: Number(commissionPercentage), fixedCommission: Number(fixedCommission), platformFee: Number(platformFee), isActive: Boolean(isActive) },
      { new: true, upsert: true, runValidators: true }
    );
    await AuditLog.create({
      actor: req.user.id,
      action: "FINANCIAL_SETTINGS_UPDATED",
      entityType: "SystemSetting",
      entityId: settings._id,
      oldValue: previous ? { commissionPercentage: previous.commissionPercentage, fixedCommission: previous.fixedCommission, platformFee: previous.platformFee, isActive: previous.isActive } : null,
      newValue: { commissionPercentage: settings.commissionPercentage, fixedCommission: settings.fixedCommission, platformFee: settings.platformFee, isActive: settings.isActive },
    });
    return res.json({ success: true, message: "Financial settings updated", settings });
  } catch (error) {
    console.error("Update financial settings error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const confirmCashCollection = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.bookingId)) return res.status(404).json({ success: false, message: "Ledger entry not found" });
    const trip = await Trip.findOne({ booking: req.params.bookingId, driver: req.driver._id });
    if (!trip || trip.status !== "trip_completed") return res.status(409).json({ success: false, message: "Cash can only be confirmed for a completed assigned trip" });
    const ledger = await DriverLedger.findOne({ booking: req.params.bookingId, driver: req.driver._id });
    if (!ledger) return res.status(404).json({ success: false, message: "Ledger entry not found" });
    if (ledger.paymentMethod !== "cash") return res.status(400).json({ success: false, message: "This booking is not a cash payment" });
    if (ledger.cashConfirmedAt) return res.status(409).json({ success: false, message: "Cash collection is already confirmed" });

    ledger.amountCollected = ledger.grossAmount;
    ledger.cashConfirmedAt = new Date();
    await ledger.save();
    const payment = await Payment.findOne({ booking: req.params.bookingId });
    if (payment) {
      payment.status = "received";
      payment.receivedAt = ledger.cashConfirmedAt;
      await payment.save();
    }
    const booking = await Booking.findById(req.params.bookingId);
    if (booking) {
      booking.paymentStatus = "paid";
      await booking.save();
    }
    await AuditLog.create({
      actor: req.user.id,
      action: "CASH_COLLECTION_CONFIRMED",
      entityType: "DriverLedger",
      entityId: ledger._id,
      booking: ledger.booking,
      driver: req.driver._id,
      oldValue: { amountCollected: 0, cashConfirmedAt: null, paymentStatus: "pending", bookingPaymentStatus: "pending" },
      newValue: { amountCollected: ledger.amountCollected, cashConfirmedAt: ledger.cashConfirmedAt, paymentStatus: payment ? payment.status : "received", bookingPaymentStatus: "paid" },
    });
    return res.json({ success: true, message: "Cash collection recorded. RideOn commission remains payable.", ledger });
  } catch (error) {
    console.error("Confirm cash collection error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMyDriverLedger = async (req, res) => {
  try {
    const entries = await DriverLedger.find({ driver: req.driver._id }).populate("booking", "totalAmount paymentStatus paymentMethod bookingStatus").sort({ createdAt: -1 });
    const totals = entries.reduce((sum, entry) => ({
      grossAmount: sum.grossAmount + entry.grossAmount,
      commissionPayable: sum.commissionPayable + entry.amountPayableToRideOn,
      driverPayout: sum.driverPayout + entry.amountPayableToDriver,
    }), { grossAmount: 0, commissionPayable: 0, driverPayout: 0 });
    return res.json({ success: true, entries, totals });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getLedgers = async (req, res) => {
  try {
    const filter = req.query.status ? { settlementStatus: req.query.status } : {};
    const entries = await DriverLedger.find(filter)
      .populate("driver", "mobile status")
      .populate("booking", "totalAmount paymentMethod paymentStatus bookingStatus")
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: entries.length, entries });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSettlementStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: "Ledger entry not found" });
    const { status } = req.body;
    const statuses = ["pending", "approved", "processing", "paid", "disputed", "failed"];
    if (!statuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid settlement status" });
    const ledger = await DriverLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ success: false, message: "Ledger entry not found" });
    const previousStatus = ledger.settlementStatus;
    ledger.settlementStatus = status;
    if (status === "paid") ledger.settledAt = new Date();
    await ledger.save();
    await AuditLog.create({ actor: req.user.id, action: "SETTLEMENT_STATUS_UPDATED", entityType: "DriverLedger", entityId: ledger._id, booking: ledger.booking, driver: ledger.driver, oldValue: { settlementStatus: previousStatus }, newValue: { settlementStatus: status, settledAt: ledger.settledAt } });
    return res.json({ success: true, message: "Settlement status updated", ledger });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDrivers = await Driver.countDocuments({ status: "approved" });
    const totalVehicles = await Car.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeTrips = await Trip.countDocuments({
      status: { $in: ["driver_assigned", "driver_arrived", "trip_started", "trip_in_progress"] },
    });
    const completedTrips = await Trip.countDocuments({ status: "trip_completed" });
    const cancelledTrips = await Trip.countDocuments({ status: "cancelled" });
    const pendingSettlements = await DriverLedger.countDocuments({ settlementStatus: "pending" });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayPayments = await Payment.aggregate([
      {
        $match: {
          status: "received",
          receivedAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const todayRevenue = todayPayments.length > 0 ? todayPayments[0].total : 0;

    const commissionAggr = await DriverLedger.aggregate([
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$amountPayableToRideOn" },
        },
      },
    ]);
    const totalCommission = commissionAggr.length > 0 ? commissionAggr[0].totalCommission : 0;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalDrivers,
        totalVehicles,
        totalBookings,
        activeTrips,
        completedTrips,
        cancelledTrips,
        pendingSettlements,
        todayRevenue,
        totalCommission,
      },
    });
  } catch (error) {
    console.error("Get platform stats error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getActiveSettings,
  createFinancialRecords,
  getSettings,
  updateSettings,
  confirmCashCollection,
  getMyDriverLedger,
  getLedgers,
  updateSettlementStatus,
  getPlatformStats,
};

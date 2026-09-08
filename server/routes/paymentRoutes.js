const express = require("express");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// CREATE PAYMENT ORDER
// =========================
router.post("/create-order", protect, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and amount required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Check booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this booking",
      });
    }

    // Require actual Razorpay credentials in production
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        gatewayAvailable: false,
        message: "Online payment gateway is currently not configured on this server. Please choose Cash on Delivery or contact admin.",
      });
    }

    const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      orderId,
      amount: amount,
      bookingId: bookingId,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// =========================
// VERIFY PAYMENT
// =========================
router.post("/verify-payment", protect, async (req, res) => {
  try {
    const { bookingId, paymentId, orderId, signature } = req.body;

    if (!bookingId || !paymentId || !orderId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Complete payment verification data (including signature) is required",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway secret is not configured on the server",
      });
    }

    // Cryptographic signature check
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Verification failed.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    let payment = await Payment.findOne({ booking: bookingId });
    if (payment) {
      payment.amount = booking.totalAmount;
      payment.method = "online";
      payment.status = "received";
      payment.gateway = "razorpay";
      payment.gatewayOrderId = orderId;
      payment.gatewayPaymentId = paymentId;
      payment.receivedAt = new Date();
      await payment.save();
    } else {
      payment = await Payment.create({
        booking: bookingId,
        amount: booking.totalAmount,
        method: "online",
        status: "received",
        gateway: "razorpay",
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        receivedAt: new Date(),
      });
    }

    booking.paymentMethod = "online";
    booking.paymentStatus = "paid";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// =========================
// SELECT CASH PAYMENT
// =========================
// Customer selects cash payment method. Payment status remains "pending"
// until the driver confirms cash collection upon trip completion.
router.put("/confirm-cash/:bookingId", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking is already marked as paid",
      });
    }

    booking.paymentMethod = "cash";
    booking.paymentStatus = "pending";
    await booking.save();

    let payment = await Payment.findOne({ booking: bookingId });
    if (!payment) {
      await Payment.create({
        booking: bookingId,
        amount: booking.totalAmount,
        method: "cash",
        status: "pending",
        receivedAt: null,
      });
    } else {
      payment.method = "cash";
      payment.status = "pending";
      await payment.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cash on delivery selected. Please pay directly to your driver upon trip completion.",
      booking,
    });
  } catch (error) {
    console.error("Select cash payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

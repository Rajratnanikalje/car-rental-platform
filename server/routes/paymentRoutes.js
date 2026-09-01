const express = require("express");
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

    // In production, create actual Razorpay order
    // For now, return mock order
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      orderId,
      amount: amount,
      bookingId: bookingId,
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

    if (!bookingId || !paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data required",
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

    const payment = await Payment.create({
      booking: bookingId,
      amount: booking.totalAmount,
      method: "online",
      status: "received",
      gateway: "razorpay",
      gatewayOrderId: orderId,
      gatewayPaymentId: paymentId,
      receivedAt: new Date(),
    });

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
// CONFIRM CASH PAYMENT
// =========================
router.put("/confirm-cash/:bookingId", protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amountCollected } = req.body;

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

    const amountToCollect = Number.isFinite(Number(amountCollected))
      ? Number(amountCollected)
      : booking.totalAmount;

    booking.paymentMethod = "cash";
    booking.paymentStatus = "paid";
    await booking.save();

    await Payment.create({
      booking: bookingId,
      amount: amountToCollect,
      method: "cash",
      status: "received",
      receivedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Cash payment confirmed",
      booking,
    });
  } catch (error) {
    console.error("Confirm cash payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

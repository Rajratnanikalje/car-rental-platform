const express = require("express");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const razorpayRequest = async (path, method = "GET", body) => {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.description || "Payment gateway request failed");
  return data;
};

// =========================
// CREATE PAYMENT ORDER
// =========================
router.post("/create-order", protect, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
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

    const amountPaise = Math.round(Number(booking.totalAmount) * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ success: false, message: "Booking amount is invalid" });
    }
    const order = await razorpayRequest("/orders", "POST", {
      amount: amountPaise,
      currency: "INR",
      receipt: String(booking._id),
      notes: { bookingId: String(booking._id), userId: String(req.user.id) },
    });
    await Payment.findOneAndUpdate(
      { booking: booking._id },
      { $set: { amount: booking.totalAmount, method: "online", status: "pending", gateway: "razorpay", gatewayOrderId: order.id, dataOrigin: "production" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      orderId: order.id,
      // Fare is always calculated by the booking service, never accepted from
      // the browser. This prevents a customer from changing the order amount.
      amount: booking.totalAmount,
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

    const expected = Buffer.from(expectedSignature, "hex");
    const supplied = Buffer.from(String(signature), "hex");
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
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

    const paymentIntent = await Payment.findOne({ booking: bookingId, gatewayOrderId: orderId, method: "online" }).select("+gatewayOrderId +gatewayPaymentId");
    if (!paymentIntent) return res.status(400).json({ success: false, message: "Payment order does not match this booking" });
    if (booking.paymentStatus === "paid") {
      return paymentIntent.gatewayPaymentId === paymentId
        ? res.status(200).json({ success: true, message: "Payment was already verified", payment: { id: paymentIntent._id, status: paymentIntent.status, amount: paymentIntent.amount } })
        : res.status(409).json({ success: false, message: "Booking already has a different successful payment" });
    }

    const [order, gatewayPayment] = await Promise.all([
      razorpayRequest(`/orders/${encodeURIComponent(orderId)}`),
      razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`),
    ]);
    if (order.id !== orderId || order.receipt !== String(booking._id) || order.amount !== Math.round(booking.totalAmount * 100) ||
      gatewayPayment.order_id !== orderId || gatewayPayment.amount !== order.amount || gatewayPayment.currency !== "INR" || gatewayPayment.status !== "captured") {
      return res.status(400).json({ success: false, message: "Payment is not captured for the exact booking amount" });
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: paymentIntent._id, status: "pending", gatewayOrderId: orderId },
      { $set: { status: "received", gatewayPaymentId: paymentId, receivedAt: new Date() } },
      { new: true }
    ).select("+gatewayOrderId +gatewayPaymentId");
    if (!payment) return res.status(409).json({ success: false, message: "Payment verification is already being processed" });
    const paidBooking = await Booking.findOneAndUpdate(
      { _id: bookingId, user: req.user.id, paymentStatus: { $ne: "paid" } },
      { $set: { paymentMethod: "online", paymentStatus: "paid" } },
      { new: true }
    );
    if (!paidBooking) return res.status(409).json({ success: false, message: "Could not mark booking paid; contact support" });

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

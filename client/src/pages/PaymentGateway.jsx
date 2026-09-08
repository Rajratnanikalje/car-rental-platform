import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../pages/PaymentGateway.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function PaymentGateway() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [authLoading, isLoggedIn, navigate]);

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const response = await fetch(
          `${API_URL}/bookings/${bookingId}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Booking not found");
        const data = await response.json();
        setBooking(data.booking);
        setPaymentMethod(data.booking.paymentMethod || "cash");
      } catch (err) {
        setError(err.message);
      }
    };
    fetchBooking();
  }, [bookingId]);

  // Handle Cash Payment
  const handleCashPayment = async () => {
    setProcessing(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/payments/confirm-cash/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amountCollected: booking.totalAmount }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to select cash payment");
      }

      setSuccess("Cash on delivery selected! Please pay ₹" + booking.totalAmount + " directly to your assigned driver upon trip completion.");
      setTimeout(() => navigate("/my-bookings"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Handle Online Payment (Razorpay Integration)
  const handleOnlinePayment = async () => {
    if (!booking) return;

    setProcessing(true);
    setError("");

    try {
      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
      }

      // Create order
      const orderResponse = await fetch(
        `${API_URL}/payments/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            bookingId,
            amount: booking.totalAmount,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData?.message || "Online payment is currently unavailable. Please choose Cash payment.");
      }

      if (!orderData.keyId) {
        throw new Error("Online payment gateway key is not configured. Please choose Cash payment.");
      }

      // Razorpay options
      const options = {
        key: orderData.keyId,
        amount: booking.totalAmount * 100, // Amount in paise
        currency: "INR",
        name: "RideOn",
        description: `Booking #${bookingId}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await fetch(
              `${API_URL}/payments/verify-payment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  bookingId,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                }),
              }
            );

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed");
            }

            setSuccess("Payment successful! Redirecting to bookings...");
            setTimeout(() => navigate("/my-bookings"), 2000);
          } catch (err) {
            setError("Payment verification failed: " + err.message);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#3498db",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!booking) {
    return <div className="loading">Loading booking details...</div>;
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h1>Complete Payment</h1>

        {/* Booking Summary */}
        <div className="booking-summary">
          <h2>Booking Summary</h2>
          <div className="summary-row">
            <span>Booking ID:</span>
            <span className="value">{bookingId}</span>
          </div>
          <div className="summary-row">
            <span>Car:</span>
            <span className="value">{booking.car?.name}</span>
          </div>
          <div className="summary-row">
            <span>Rental Amount:</span>
            <span className="value">₹{booking.rentalAmount?.toFixed(2) || 0}</span>
          </div>
          {booking.extraKmAmount > 0 && (
            <div className="summary-row">
              <span>Extra KM Charges:</span>
              <span className="value">₹{booking.extraKmAmount?.toFixed(2) || 0}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total Amount:</span>
            <span className="value">₹{booking.totalAmount?.toFixed(2) || 0}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Success Message */}
        {success && <div className="success-message">{success}</div>}

        {/* Payment Methods */}
        <div className="payment-methods">
          <h2>Select Payment Method</h2>

          {/* Cash Payment */}
          <div
            className={`method-card ${paymentMethod === "cash" ? "active" : ""}`}
            onClick={() => setPaymentMethod("cash")}
          >
            <div className="method-icon">💵</div>
            <div className="method-info">
              <h3>Pay with Cash</h3>
              <p>Pay driver at pickup location</p>
            </div>
            <input
              type="radio"
              name="payment"
              value="cash"
              checked={paymentMethod === "cash"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>

          {/* Online Payment */}
          <div
            className={`method-card ${paymentMethod === "online" ? "active" : ""}`}
            onClick={() => setPaymentMethod("online")}
          >
            <div className="method-icon">💳</div>
            <div className="method-info">
              <h3>Pay Online</h3>
              <p>Secure payment via Razorpay</p>
            </div>
            <input
              type="radio"
              name="payment"
              value="online"
              checked={paymentMethod === "online"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {paymentMethod === "cash" ? (
            <button
              className="btn-primary"
              onClick={handleCashPayment}
              disabled={processing}
            >
              {processing ? "Processing..." : "Confirm Cash Payment"}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleOnlinePayment}
              disabled={processing}
            >
              {processing ? "Processing..." : "Pay ₹" + booking.totalAmount?.toFixed(2)}
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={() => navigate("/my-bookings")}
            disabled={processing}
          >
            Back to Bookings
          </button>
        </div>

        {/* Payment Info */}
        <div className="payment-info">
          <h3>📝 Payment Information</h3>
          <ul>
            <li>✅ Your payment is secure and encrypted</li>
            <li>✅ You'll receive a receipt after payment</li>
            <li>✅ Refunds will be processed within 5-7 business days</li>
            <li>✅ For cash payments, driver will provide receipt on completion</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

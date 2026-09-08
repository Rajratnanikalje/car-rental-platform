import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./MyBookings.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState("");
  const [otpModal, setOtpModal] = useState({ show: false, otp: "", expiresAt: "", error: "", loading: false, bookingId: null });

  const fetchStartOtp = async (bookingId) => {
    setOtpModal({ show: true, otp: "", expiresAt: "", error: "", loading: true, bookingId });
    try {
      const response = await fetch(`${API_URL}/trips/${bookingId}/start-code`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Driver has not arrived yet. OTP is generated once the driver marks arrival.");
      }
      setOtpModal({ show: true, otp: data.otp, expiresAt: data.expiresAt, error: "", loading: false, bookingId });
    } catch (err) {
      setOtpModal({ show: true, otp: "", expiresAt: "", error: err.message, loading: false, bookingId });
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/bookings/my`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to load bookings.");
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (fetchError) {
      console.error("Fetch bookings error:", fetchError);
      setError(fetchError?.message || "Unable to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchBookings, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredBookings = useMemo(() => (
    statusFilter === "all" ? bookings : bookings.filter((booking) => booking.bookingStatus === statusFilter)
  ), [bookings, statusFilter]);

  const upcomingCount = bookings.filter((booking) => ["pending", "confirmed"].includes(booking.bookingStatus)).length;
  const completedCount = bookings.filter((booking) => booking.bookingStatus === "completed").length;

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      setCancellingId(bookingId);
      setError("");
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, { method: "PUT", credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to cancel booking.");
      setBookings((current) => current.map((booking) => booking._id === bookingId ? data.booking : booking));
    } catch (cancelError) {
      console.error("Cancel booking error:", cancelError);
      setError(cancelError?.message || "Unable to cancel booking. Please try again.");
    } finally {
      setCancellingId("");
    }
  };

  return (
    <main className="my-bookings-page">
      <div className="my-bookings-glow my-bookings-glow-purple" />
      <div className="my-bookings-glow my-bookings-glow-blue" />
      <div className="my-bookings-container">
        <section className="my-bookings-header">
          <div><span className="my-bookings-eyebrow">Your Account</span><h1>My <span>Bookings</span></h1><p>View your upcoming reservations, previous trips and booking details from one place.</p></div>
          <Link to="/cars" className="shiny-button my-bookings-action">Book a Car →</Link>
        </section>
        <section className="booking-summary-grid">
          <div className="booking-summary-box glass-card"><span className="summary-box-icon">📅</span><div><strong>{upcomingCount}</strong><span>Upcoming Bookings</span></div></div>
          <div className="booking-summary-box glass-card"><span className="summary-box-icon">✓</span><div><strong>{completedCount}</strong><span>Completed Trips</span></div></div>
          <div className="booking-summary-box glass-card"><span className="summary-box-icon">🚗</span><div><strong>{bookings.length}</strong><span>Total Bookings</span></div></div>
        </section>
        <section className="booking-filter-bar glass-card">
          <div className="booking-filter-title"><span>Booking history</span><h2>Your reservations</h2></div>
          <select className="booking-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All Bookings</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        </section>
        <section className="booking-list-section">
          {error && <div className="cars-error glass-card" role="alert"><span>!</span><div><strong>Unable to load bookings</strong><p>{error}</p></div></div>}
          {loading && <div className="book-loading"><div className="book-spinner" /><p>Loading your bookings...</p></div>}
          {!loading && !error && filteredBookings.length > 0 && <div className="booking-list">{filteredBookings.map((booking) => {
            const car = booking.car || {};
            const status = booking.bookingStatus || "pending";
            return <article key={booking._id} className="booking-history-card glass-card">
              <div className="booking-car-block"><div className="booking-car-image">{car.image ? <img src={car.image} alt={car.name} /> : <span>🚗</span>}</div><div className="booking-car-details"><span>{car.brand || "RideOn"}</span><h3>{car.name || "Vehicle unavailable"}</h3><p>{car.seats || "—"} Seats • {car.transmission || "—"}</p></div></div>
              <div className="booking-status-block"><span className="booking-status-label">Status</span><span className={`booking-status booking-status-${status}`}><span />{status}</span></div>
              <div className="booking-detail-block"><span className="booking-detail-label">Rental Dates</span><strong>{formatDate(booking.pickupDate)}</strong><span className="booking-arrow">↓</span><strong>{formatDate(booking.returnDate)}</strong></div>
              <div className="booking-detail-block"><span className="booking-detail-label">Pickup Location</span><strong>📍 {booking.pickupLocation}</strong></div>
              {Boolean(booking.trip?.actualDistanceKm || booking.totalKm) && (
                <div className="booking-detail-block"><span className="booking-detail-label">Distance Driven</span><strong>{booking.trip?.actualDistanceKm || booking.totalKm} KM</strong></div>
              )}
              <div className="booking-amount-block"><span className="booking-detail-label">Total Amount</span><strong>₹{Number(booking.totalAmount || 0).toLocaleString("en-IN")}</strong><span>Final booking total</span></div>
              <div className="booking-actions">
                {car._id && <Link to={`/cars/${car._id}`} className="booking-view-btn">View Car</Link>}
                {booking.paymentStatus === "pending" && <Link to={`/payment/${booking._id}`} className="booking-payment-btn">💳 Pay Now</Link>}
                {booking.trip && booking.trip.status !== "trip_completed" && (
                  <button type="button" className="booking-trip-btn" onClick={() => fetchStartOtp(booking._id)}>
                    {booking.trip.status === "driver_arrived" ? "🔑 View Start OTP" : "🔑 Start Code / OTP"}
                  </button>
                )}
                {["pending", "confirmed"].includes(status) && (
                  <button type="button" className="booking-cancel-btn" disabled={cancellingId === booking._id} onClick={() => cancelBooking(booking._id)}>
                    {cancellingId === booking._id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </article>;
          })}</div>}
          {!loading && !error && filteredBookings.length === 0 && <div className="bookings-empty glass-card"><div className="empty-icon">🚘</div><h2>No bookings yet</h2><p>You have no bookings matching this filter. Find a car and start planning your next journey.</p><Link to="/cars" className="shiny-button">Explore Cars →</Link></div>}
        </section>
        <section className="booking-account-info"><div className="booking-account-info-card glass-card"><div className="account-info-icon">ℹ️</div><div><h3>Need to manage your account?</h3><p>Update your personal information from your profile or browse available vehicles for a new booking.</p></div><Link to="/profile" className="account-info-link">Go to Profile →</Link></div></section>
        {otpModal.show && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
          >
            <div
              className="glass-card"
              style={{
                maxWidth: "420px",
                width: "100%",
                padding: "24px",
                textAlign: "center",
                background: "rgba(20, 24, 39, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "16px",
              }}
            >
              <h3 style={{ marginBottom: "12px", fontSize: "1.25rem" }}>🔑 Trip Verification Code</h3>
              {otpModal.loading && <p>Retrieving start code from server...</p>}
              {otpModal.error && (
                <div style={{ color: "#ef4444", marginBottom: "16px", fontSize: "0.95rem", background: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                  ℹ️ {otpModal.error}
                </div>
              )}
              {otpModal.otp && (
                <div style={{ margin: "20px 0" }}>
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Share this code with your driver to start the trip:</span>
                  <div
                    style={{
                      fontSize: "2.2rem",
                      fontWeight: 700,
                      letterSpacing: "6px",
                      color: "#38bdf8",
                      margin: "12px 0",
                      background: "rgba(56, 189, 248, 0.1)",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px dashed rgba(56, 189, 248, 0.4)",
                    }}
                  >
                    {otpModal.otp}
                  </div>
                  {otpModal.expiresAt && (
                    <small style={{ color: "#94a3b8", display: "block" }}>
                      Valid for 10 minutes (expires: {new Date(otpModal.expiresAt).toLocaleTimeString()})
                    </small>
                  )}
                </div>
              )}
              <button
                type="button"
                className="shiny-button"
                style={{ width: "100%", marginTop: "12px" }}
                onClick={() => setOtpModal({ show: false, otp: "", expiresAt: "", error: "", loading: false, bookingId: null })}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default MyBookings;

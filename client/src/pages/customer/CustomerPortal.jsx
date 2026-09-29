import { API_URL, getAuthHeaders } from "../../config/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./CustomerPortal.css";


export default function CustomerPortal() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'bookings' | 'trips' | 'payments' | 'profile' | 'support'
  const [bookingFilter, setBookingFilter] = useState("all"); // 'all' | 'upcoming' | 'completed' | 'cancelled'

  const [bookings, setBookings] = useState([]);
  const [seatBookings, setSeatBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [otpData, setOtpData] = useState({ otp: "", expiresAt: "", loading: false, error: "" });

  // Fetch bookings & seat rides
  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [bRes, sRes] = await Promise.all([
        fetch(`${API_URL}/bookings/my`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_URL}/seat-rides/my-bookings`, { headers: getAuthHeaders(), credentials: "include" }),
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        const list = Array.isArray(bData?.bookings) ? bData.bookings : [];
        setBookings(list);
        if (list.length > 0) {
          setSelectedBooking((prev) => prev || list[0]);
        }
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        setSeatBookings(Array.isArray(sData?.bookings) ? sData.bookings : []);
      }
    } catch (err) {
      console.error("Customer data error:", err);
      setError("Unable to load bookings. Please check your network.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const timer = window.setTimeout(fetchCustomerData, 0);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn, navigate, fetchCustomerData]);

  // Fetch Customer OTP if active trip exists
  const activeBooking = useMemo(() => {
    return bookings.find((b) => b.trip && ["driver_assigned", "driver_arrived", "trip_started", "trip_in_progress"].includes(b.trip.status)) ||
      bookings.find((b) => ["pending", "confirmed"].includes(b.bookingStatus)) || null;
  }, [bookings]);

  const loadCustomerOtp = async (bookingId) => {
    try {
      setOtpData({ otp: "", expiresAt: "", loading: true, error: "" });
      const res = await fetch(`${API_URL}/trips/${bookingId}/start-code`, { headers: getAuthHeaders(), credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "OTP unlocks once your driver marks arrival at pickup.");
      }
      setOtpData({ otp: data.otp, expiresAt: data.expiresAt, loading: false, error: "" });
    } catch (err) {
      setOtpData({ otp: "", expiresAt: "", loading: false, error: err.message });
    }
  };

  // KPIs
  const totalBookingsCount = bookings.length + seatBookings.length;
  const upcomingCount = bookings.filter((b) => ["pending", "confirmed"].includes(b.bookingStatus)).length;
  const completedCount = bookings.filter((b) => b.bookingStatus === "completed").length;
  const totalSpent = bookings.reduce((sum, b) => sum + (b.paymentStatus === "paid" ? b.totalAmount : 0), 0);

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "all") return bookings;
    if (bookingFilter === "upcoming") return bookings.filter((b) => ["pending", "confirmed"].includes(b.bookingStatus));
    return bookings.filter((b) => b.bookingStatus === bookingFilter);
  }, [bookings, bookingFilter]);

  const handlePrintInvoice = (booking) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Invoice #${booking._id}</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <h2>RideOn — Official Rental Invoice</h2>
          <hr/>
          <p><strong>Booking ID:</strong> #${booking._id}</p>
          <p><strong>Date:</strong> ${new Date(booking.createdAt).toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${user?.name || "Customer"}</p>
          <p><strong>Vehicle:</strong> ${booking.car?.brand} ${booking.car?.model}</p>
          <p><strong>Route:</strong> ${booking.pickupLocation} ➔ ${booking.destination}</p>
          <hr/>
          <p><strong>Rental Days:</strong> ${booking.totalDays} day(s)</p>
          <p><strong>Rate:</strong> ₹${booking.pricePerDay} / day</p>
          <p><strong>Included KM:</strong> ${booking.includedKm} KM</p>
          <p style="font-size: 18px;"><strong>Total Amount: ₹${booking.totalAmount}</strong></p>
          <p><strong>Payment Status:</strong> ${booking.paymentStatus?.toUpperCase()}</p>
          <p><strong>Payment Method:</strong> ${booking.paymentMethod?.toUpperCase()}</p>
          <hr/>
          <small>Thank you for traveling with RideOn. Safe Journeys!</small>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="customer-portal-root">
      {/* ==========================================
          LEFT SIDEBAR (IMAGE 2 MIDDLE COLUMN)
      =========================================== */}
      <aside className="customer-sidebar glass">
        <div className="customer-brand-top">
          <Link to="/" className="sidebar-logo-link">
            <span className="brand-r">R</span>
            <strong>Ride<span>On</span></strong>
          </Link>
        </div>

        <nav className="customer-sidebar-nav">
          <button
            type="button"
            className={`customer-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            type="button"
            className={`customer-nav-item ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <span>📅</span> My Bookings
          </button>
          <button
            type="button"
            className={`customer-nav-item ${activeTab === "trips" ? "active" : ""}`}
            onClick={() => setActiveTab("trips")}
          >
            <span>🗺️</span> My Trips
          </button>
          <button
            type="button"
            className={`customer-nav-item ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <span>💳</span> Payment History
          </button>
          <button
            type="button"
            className={`customer-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span>👤</span> Profile
          </button>
          <button
            type="button"
            className={`customer-nav-item ${activeTab === "support" ? "active" : ""}`}
            onClick={() => setActiveTab("support")}
          >
            <span>🎧</span> Support
          </button>
        </nav>

        <div className="customer-sidebar-bottom">
          <button
            type="button"
            className="customer-logout-btn"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA
      =========================================== */}
      <main className="customer-main-viewport">
        {/* TOP GREETING HEADER */}
        <header className="customer-viewport-header">
          <div>
            <span className="eyebrow-dashboard">My Dashboard</span>
            <h1>Hello, {user?.name || "Renter"} 👋</h1>
            <p>Here's your ride summary and recent activity</p>
          </div>
          <Link to="/cars" className="shiny-button book-new-ride-btn">
            + Book New Ride
          </Link>
        </header>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            {error}
          </div>
        )}

        {/* 4 STATS CARDS (IMAGE 2 MIDDLE COLUMN) */}
        <section className="customer-stats-grid">
          <div className="customer-stat-card glass-card">
            <span className="stat-num">{loading ? "..." : totalBookingsCount}</span>
            <span className="stat-title">Total Bookings</span>
          </div>
          <div className="customer-stat-card glass-card">
            <span className="stat-num">{loading ? "..." : upcomingCount}</span>
            <span className="stat-title">Upcoming Trips</span>
          </div>
          <div className="customer-stat-card glass-card">
            <span className="stat-num">{loading ? "..." : completedCount}</span>
            <span className="stat-title">Completed Trips</span>
          </div>
          <div className="customer-stat-card glass-card">
            <span className="stat-num highlight-gold">₹ {loading ? "..." : totalSpent.toLocaleString("en-IN")}</span>
            <span className="stat-title">Total Spent</span>
          </div>
        </section>

        {/* TAB 1: DASHBOARD (MAIN OVERVIEW) */}
        {activeTab === "dashboard" && (
          <div className="customer-dashboard-layout">
            {/* LIVE TRIP IN PROGRESS CARD (IF ACTIVE TRIP) */}
            {activeBooking && (
              <section className="trip-in-progress-card glass-card">
                <div className="trip-progress-header">
                  <span className="card-badge-pill live">● Trip in Progress</span>
                  <span className="trip-status-tag">{activeBooking.trip?.status || activeBooking.bookingStatus}</span>
                </div>

                {/* Stepper: Driver Arrived -> Trip Started -> Trip Completed */}
                <div className="trip-flow-stepper">
                  <div className={`flow-step ${activeBooking.trip?.status ? "done" : "active"}`}>
                    <span className="flow-dot">✓</span>
                    <span>Driver Arrived</span>
                  </div>
                  <div className="flow-line" />
                  <div className={`flow-step ${["trip_started", "trip_in_progress", "trip_completed"].includes(activeBooking.trip?.status) ? "done" : ""}`}>
                    <span className="flow-dot">✓</span>
                    <span>Trip Started</span>
                  </div>
                  <div className="flow-line" />
                  <div className={`flow-step ${activeBooking.trip?.status === "trip_completed" ? "done" : ""}`}>
                    <span className="flow-dot">✓</span>
                    <span>Trip Completed</span>
                  </div>
                </div>

                {/* Route Visual & Driver Info */}
                <div className="trip-tracking-body">
                  <div className="tracking-route-summary">
                    <div className="point-dot pickup" />
                    <div className="point-info">
                      <small>Pickup</small>
                      <strong>{activeBooking.pickupLocation}</strong>
                    </div>
                    <div className="point-divider">➔</div>
                    <div className="point-dot dropoff" />
                    <div className="point-info">
                      <small>Destination</small>
                      <strong>{activeBooking.destination}</strong>
                    </div>
                  </div>

                  {/* OTP Verification Box (IMAGE 1 TILE 6 & IMAGE 2 MIDDLE) */}
                  <div className="customer-otp-box">
                    <div className="otp-box-left">
                      <strong>OTP Verification</strong>
                      <p>Share this code with your driver once they arrive at pickup location.</p>
                      {otpData.otp ? (
                        <div className="live-otp-display">
                          <span className="live-otp-code">{otpData.otp}</span>
                          <span className="otp-valid-badge">Valid for trip start</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="shiny-button get-otp-btn"
                          onClick={() => loadCustomerOtp(activeBooking._id)}
                          disabled={otpData.loading}
                        >
                          {otpData.loading ? "Unlocking OTP..." : "Show Start OTP 🔑"}
                        </button>
                      )}
                      {otpData.error && <span className="otp-error-hint">{otpData.error}</span>}
                    </div>

                    {/* Driver Card with Call Button */}
                    {activeBooking.driver?.user ? (
                      <div className="driver-mini-profile">
                        <div className="driver-avatar-circle">Driver</div>
                        <div className="driver-names">
                          <strong>{activeBooking.driver.user.name}</strong>
                          <span>Verified RideOn partner</span>
                        </div>
                        {activeBooking.driver.user.phone && (
                          <a href={`tel:${activeBooking.driver.user.phone}`} className="driver-call-btn">Call</a>
                        )}
                      </div>
                    ) : <p className="driver-assignment-pending">Driver details will appear once a driver is assigned.</p>}
                  </div>
                </div>
              </section>
            )}

            {/* UPCOMING TRIPS & BOOKING DETAILS SPLIT */}
            <div className="dashboard-columns-split">
              {/* Left Column: Upcoming Trips List */}
              <div className="upcoming-trips-column">
                <div className="column-header-row">
                  <h3>Upcoming Trips</h3>
                  <button type="button" className="view-link-text" onClick={() => setActiveTab("bookings")}>
                    View All →
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="empty-trips-box glass-card">
                    <p>No upcoming trips scheduled yet.</p>
                    <Link to="/cars" className="shiny-button empty-book-btn">
                      Explore Cars →
                    </Link>
                  </div>
                ) : (
                  <div className="trips-cards-list">
                    {bookings.slice(0, 3).map((b) => (
                      <div
                        key={b._id}
                        className={`upcoming-trip-card glass-card ${selectedBooking?._id === b._id ? "selected" : ""}`}
                        onClick={() => setSelectedBooking(b)}
                      >
                        <div className="trip-card-top">
                          <strong>{b.pickupLocation} ➔ {b.destination}</strong>
                          <span className={`status-pill ${b.bookingStatus}`}>{b.bookingStatus}</span>
                        </div>
                        <div className="trip-card-meta">
                          <span>📅 {new Date(b.pickupDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                          <span>🚗 {b.car?.brand} {b.car?.model}</span>
                        </div>
                        <div className="trip-card-bottom">
                          <span className="trip-fare">₹ {b.totalAmount}</span>
                          <span className="details-hint">View Details →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Booking Details Card (IMAGE 2 MIDDLE) */}
              <div className="booking-details-column">
                <div className="column-header-row">
                  <h3>Booking Details</h3>
                  {selectedBooking && (
                    <span className={`status-pill ${selectedBooking.bookingStatus}`}>
                      {selectedBooking.bookingStatus}
                    </span>
                  )}
                </div>

                {selectedBooking ? (
                  <div className="booking-details-card glass-card">
                    <div className="booking-car-header">
                      {selectedBooking.car?.image ? (
                        <img
                          src={selectedBooking.car.image}
                          alt={selectedBooking.car?.name}
                          className="details-car-thumb"
                        />
                      ) : (
                        <div className="details-car-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#1e293b", fontSize: "24px" }}>
                          🚗
                        </div>
                      )}
                      <div>
                        <h4>{selectedBooking.car?.brand} {selectedBooking.car?.model}</h4>
                        <span>Private Car Rental</span>
                      </div>
                    </div>

                    <div className="details-route-box">
                      <p>📍 <strong>Pickup:</strong> {selectedBooking.pickupLocation}</p>
                      <p>📅 <strong>Dates:</strong> {new Date(selectedBooking.pickupDate).toLocaleDateString()} to {new Date(selectedBooking.returnDate).toLocaleDateString()}</p>
                      <p>⏱️ <strong>Duration:</strong> {selectedBooking.totalDays} Day(s)</p>
                    </div>

                    {/* Fare Details */}
                    <div className="details-fare-breakdown">
                      <h5>Fare Details</h5>
                      <div className="fare-line">
                        <span>Base Rental Fare</span>
                        <strong>₹ {selectedBooking.rentalAmount || selectedBooking.totalAmount}</strong>
                      </div>
                      <div className="fare-line">
                        <span>Included Limit</span>
                        <span>{selectedBooking.includedKm || 300} KM</span>
                      </div>
                      <div className="fare-line">
                        <span>Extra KM Rate</span>
                        <span>₹{selectedBooking.pricePerKm || 12}/km</span>
                      </div>
                      <div className="fare-line total">
                        <strong>Total Fare</strong>
                        <strong className="total-figure">₹ {selectedBooking.totalAmount}</strong>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="details-payment-section">
                      <h5>Payment Details</h5>
                      <div className="payment-status-row">
                        <span>Method: {selectedBooking.paymentMethod?.toUpperCase()}</span>
                        <span className={`payment-pill ${selectedBooking.paymentStatus}`}>
                          {selectedBooking.paymentStatus?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="details-actions-row">
                      <button
                        type="button"
                        className="invoice-download-btn"
                        onClick={() => handlePrintInvoice(selectedBooking)}
                      >
                        📄 Download Invoice
                      </button>
                      <button
                        type="button"
                        className="support-contact-btn"
                        onClick={() => setActiveTab("support")}
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-trips-box glass-card">
                    <p>Select a trip from the left to view complete booking details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY BOOKINGS (FULL LIST WITH TABS) */}
        {activeTab === "bookings" && (
          <div className="customer-bookings-view">
            <div className="bookings-filter-tabs">
              {["all", "upcoming", "completed", "cancelled"].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`filter-tab-pill ${bookingFilter === f ? "active" : ""}`}
                  onClick={() => setBookingFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="empty-trips-box glass-card">
                <p>No {bookingFilter !== "all" ? bookingFilter : ""} bookings found.</p>
              </div>
            ) : (
              <div className="bookings-full-list">
                {filteredBookings.map((b) => (
                  <div key={b._id} className="booking-list-card glass-card">
                    <div className="booking-card-main">
                      <h4>{b.pickupLocation} ➔ {b.destination}</h4>
                      <p>🚗 {b.car?.brand} {b.car?.model} • 📅 {new Date(b.pickupDate).toLocaleDateString()} to {new Date(b.returnDate).toLocaleDateString()}</p>
                    </div>
                    <div className="booking-card-meta">
                      <span className={`status-pill ${b.bookingStatus}`}>{b.bookingStatus}</span>
                      <strong className="booking-fare">₹ {b.totalAmount}</strong>
                      <button
                        type="button"
                        className="invoice-btn-sm"
                        onClick={() => handlePrintInvoice(b)}
                      >
                        Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SHARED SEAT TRIPS */}
        {activeTab === "trips" && (
          <div className="customer-seat-trips-view">
            <h3>My Scheduled Seat Rides</h3>
            {seatBookings.length === 0 ? (
              <div className="empty-trips-box glass-card">
                <p>You have not booked any shared seat rides yet.</p>
                <Link to="/seat-rides" className="shiny-button empty-book-btn">
                  Browse Seat Rides →
                </Link>
              </div>
            ) : (
              <div className="bookings-full-list">
                {seatBookings.map((sb) => (
                  <div key={sb._id} className="booking-list-card glass-card">
                    <div className="booking-card-main">
                      <h4>{sb.pickupLocation} ➔ {sb.destination}</h4>
                      <p>🚌 {sb.seats} Seat(s) • Fare: ₹{sb.fare} • Method: {sb.paymentMethod}</p>
                    </div>
                    <div className="booking-card-meta">
                      <span className={`status-pill ${sb.bookingStatus}`}>{sb.bookingStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PAYMENT HISTORY */}
        {activeTab === "payments" && (
          <div className="customer-payments-view glass-card">
            <h3>Payment Transactions</h3>
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>#{b._id.slice(-8)}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td><strong>₹ {b.totalAmount}</strong></td>
                    <td>{b.paymentMethod?.toUpperCase()}</td>
                    <td>
                      <span className={`payment-pill ${b.paymentStatus}`}>
                        {b.paymentStatus?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: PROFILE */}
        {activeTab === "profile" && (
          <div className="customer-profile-view glass-card">
            <h3>My Profile Details</h3>
            <div className="profile-fields-grid">
              <div className="profile-field">
                <label>Full Name</label>
                <input type="text" value={user?.name || ""} disabled />
              </div>
              <div className="profile-field">
                <label>Email Address</label>
                <input type="email" value={user?.email || ""} disabled />
              </div>
              <div className="profile-field">
                <label>Phone Number</label>
                <input type="text" value={user?.phone || "+919999999999"} disabled />
              </div>
              <div className="profile-field">
                <label>Account Role</label>
                <input type="text" value={user?.role?.toUpperCase() || "CUSTOMER"} disabled />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SUPPORT */}
        {activeTab === "support" && (
          <div className="customer-support-view glass-card">
            <h3>RideOn Customer Assistance</h3>
            <p>Need help with a past booking, active ride, or cancellation refund? Reach our 24/7 desk:</p>
            <div className="support-channels-row">
              <div className="support-box">
                <span className="support-icon">📞</span>
                <strong>Phone Support</strong>
                <span>+91 1800-RIDE-ON</span>
              </div>
              <div className="support-box">
                <span className="support-icon">✉️</span>
                <strong>Email Support</strong>
                <span>support@rideon.com</span>
              </div>
              <div className="support-box">
                <span className="support-icon">📍</span>
                <strong>Headquarters</strong>
                <span>Chikhli, Buldhana, Maharashtra</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./DriverPortal.css";


export default function DriverPortal() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'vehicle' | 'trips' | 'seat-rides' | 'earnings' | 'settlements' | 'documents' | 'support'
  const [trips, setTrips] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Active Trip Execution State (Image 1 Tile 6 & 7)
  const [selectedTripBooking, setSelectedTripBooking] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [startEvidenceModalOpen, setStartEvidenceModalOpen] = useState(false);
  const [endEvidenceModalOpen, setEndEvidenceModalOpen] = useState(false);

  // Verification & Evidence form inputs
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [startOdometer, setStartOdometer] = useState("");
  const [startPhoto, setStartPhoto] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [endPhoto, setEndPhoto] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [modalMsg, setModalMsg] = useState("");

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      setError("");

      const [tripsRes, ledgerRes] = await Promise.all([
        fetch(`${API_URL}/trips/driver/my-trips`, { credentials: "include" }),
        fetch(`${API_URL}/finance/driver-ledger`, { credentials: "include" }),
      ]);

      if (tripsRes.ok) {
        const tData = await tripsRes.json();
        setTrips(Array.isArray(tData.bookings) ? tData.bookings : []);
      }

      if (ledgerRes.ok) {
        const lData = await ledgerRes.json();
        setLedger(lData.ledger || null);
      }
    } catch (err) {
      console.error("Driver data error:", err);
      setError("Unable to load driver data. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const timer = window.setTimeout(fetchDriverData, 0);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn, navigate]);

  // Mark Driver Arrival (Step 1)
  const handleMarkArrival = async (bookingId) => {
    try {
      setSubmitting(true);
      setError("");
      const res = await fetch(`${API_URL}/trips/${bookingId}/arrive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to mark arrival");

      alert("✅ Arrived at pickup! Customer start code is now unlocked.");
      fetchDriverData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Verify Customer OTP (Step 2 - Image 1 Tile 6)
  const handleVerifyOtp = (booking) => {
    setSelectedTripBooking(booking);
    setEnteredOtp("");
    setOtpVerified(false);
    setModalMsg("");
    setOtpModalOpen(true);
  };

  // Submit Start Trip with Evidence (Step 3 - Image 1 Tile 7)
  const handleStartTripWithEvidence = async (e) => {
    e.preventDefault();
    if (!selectedTripBooking) return;

    try {
      setSubmitting(true);
      setModalMsg("");

      const payload = {
        otp: enteredOtp.trim(),
        odometer: Number(startOdometer),
        photoUrl: startPhoto.trim(),
        location: startLocation.trim(),
      };

      const res = await fetch(`${API_URL}/trips/${selectedTripBooking._id}/start`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start trip with evidence");

      setStartEvidenceModalOpen(false);
      setOtpModalOpen(false);
      alert("✅ Trip started successfully! Safe driving.");
      fetchDriverData();
    } catch (err) {
      setModalMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Complete Trip with End Evidence (Step 4 - Image 1 Tile 7)
  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    if (!selectedTripBooking) return;

    try {
      setSubmitting(true);
      setModalMsg("");

      const payload = {
        odometer: Number(endOdometer),
        photoUrl: endPhoto.trim(),
        location: endLocation.trim(),
      };

      const res = await fetch(`${API_URL}/trips/${selectedTripBooking._id}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to complete trip");

      setEndEvidenceModalOpen(false);
      alert(`🎉 Trip completed! Actual KM recorded: ${data.actualDistanceKm} KM.`);
      fetchDriverData();
    } catch (err) {
      setModalMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="driver-portal-root">
      {/* ==========================================
          DRIVER SIDEBAR (REFERENCE IMAGE 1 TILE 5)
      =========================================== */}
      <aside className="driver-sidebar glass">
        <div className="driver-brand-top">
          <Link to="/" className="sidebar-logo-link">
            <span className="brand-r">R</span>
            <strong>Ride<span>On</span></strong>
          </Link>
          <span className="driver-portal-tag">DRIVER PARTNER</span>
        </div>

        <nav className="driver-sidebar-nav">
          <button
            type="button"
            className={`driver-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            type="button"
            className={`driver-nav-item ${activeTab === "vehicle" ? "active" : ""}`}
            onClick={() => setActiveTab("vehicle")}
          >
            <span>🚗</span> My Vehicle
          </button>
          <button
            type="button"
            className={`driver-nav-item ${activeTab === "trips" ? "active" : ""}`}
            onClick={() => setActiveTab("trips")}
          >
            <span>🗺️</span> Assigned Trips
          </button>
          <button
            type="button"
            className={`driver-nav-item ${activeTab === "seat-rides" ? "active" : ""}`}
            onClick={() => setActiveTab("seat-rides")}
          >
            <span>🚌</span> Seat Rides
          </button>
          <button
            type="button"
            className={`driver-nav-item ${activeTab === "earnings" ? "active" : ""}`}
            onClick={() => setActiveTab("earnings")}
          >
            <span>💰</span> Earnings
          </button>
          <button
            type="button"
            className={`driver-nav-item ${activeTab === "settlements" ? "active" : ""}`}
            onClick={() => setActiveTab("settlements")}
          >
            <span>📜</span> Settlement History
          </button>
          <button
            type="button"
            className={`driver-nav-item ${activeTab === "documents" ? "active" : ""}`}
            onClick={() => setActiveTab("documents")}
          >
            <span>📁</span> Documents
          </button>
          <button
            type="button"
            className={`driver-nav-item ${activeTab === "support" ? "active" : ""}`}
            onClick={() => setActiveTab("support")}
          >
            <span>🎧</span> Support
          </button>
        </nav>

        <div className="driver-sidebar-bottom">
          <button
            type="button"
            className="driver-logout-btn"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN VIEWPORT
      =========================================== */}
      <main className="driver-main-viewport">
        <header className="driver-viewport-header">
          <div>
            <span className="eyebrow-driver">Driver Control Panel</span>
            <h1>Welcome, {user?.name || "Driver Partner"}</h1>
            <p>Monitor assigned trips, submit odometer verification, and track payouts.</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              type="button"
              className="driver-btn-outline"
              onClick={fetchDriverData}
              disabled={loading}
              style={{ padding: "8px 14px", fontSize: "13px" }}
            >
              {loading ? "..." : "🔄 Refresh"}
            </button>
            <div className="driver-status-badge approved">
              <span>●</span> Duty: Online & Available
            </div>
          </div>
        </header>

        {error && <div className="driver-error-alert">{error}</div>}

        {/* 3 STATS CARDS (IMAGE 1 TILE 5) */}
        <section className="driver-stats-grid">
          <div className="driver-stat-card glass-card">
            <span className="stat-title">Today's Trips</span>
            <strong className="stat-num">{loading ? "..." : trips.filter((t) => t.bookingStatus === "completed").length}</strong>
          </div>
          <div className="driver-stat-card glass-card">
            <span className="stat-title">Earnings</span>
            <strong className="stat-num highlight-gold">
              ₹ {ledger ? ledger.driverEarnings.toLocaleString("en-IN") : "4,850"}
            </strong>
          </div>
          <div className="driver-stat-card glass-card">
            <span className="stat-title">Pending Settlement</span>
            <strong className="stat-num highlight-blue">
              ₹ {ledger ? ledger.amountPayableToDriver.toLocaleString("en-IN") : "8,200"}
            </strong>
          </div>
        </section>

        {/* TAB 1: DASHBOARD & UPCOMING TRIPS (IMAGE 1 TILE 5) */}
        {activeTab === "dashboard" && (
          <div className="driver-dashboard-view">
            <div className="section-title-row">
              <h3>Upcoming & Assigned Trips</h3>
              <span className="trips-count-tag">{trips.length} Trip(s)</span>
            </div>

            {trips.length === 0 ? (
              <div className="driver-empty-box glass-card">
                <p>No trips assigned right now. You are ready to receive new dispatch requests.</p>
              </div>
            ) : (
              <div className="driver-trips-list">
                {trips.map((b) => (
                  <div key={b._id} className="driver-trip-card glass-card">
                    <div className="trip-card-header">
                      <div>
                        <h4>{b.pickupLocation} ➔ {b.car?.location || "Destination"}</h4>
                        <span className="trip-dates-text">
                          📅 {new Date(b.pickupDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} • 
                          Duration: {b.totalDays} Day(s)
                        </span>
                      </div>
                      <span className={`trip-badge ${b.trip?.status || b.bookingStatus}`}>
                        {b.trip?.status || b.bookingStatus}
                      </span>
                    </div>

                    <div className="trip-card-specs">
                      <span>🚗 Vehicle: <strong>{b.car?.brand} {b.car?.model}</strong></span>
                      <span>💰 Fare: <strong>₹ {b.totalAmount}</strong> ({b.paymentMethod?.toUpperCase()})</span>
                      <span>👤 Customer: <strong>{b.user?.name || "Customer"}</strong></span>
                    </div>

                    {/* EXECUTION ACTION BUTTONS */}
                    <div className="trip-action-buttons-row">
                      {b.trip?.status === "driver_assigned" && (
                        <button
                          type="button"
                          className="shiny-button arrive-btn"
                          onClick={() => handleMarkArrival(b._id)}
                          disabled={submitting}
                        >
                          📍 Mark Arrived at Pickup
                        </button>
                      )}

                      {b.trip?.status === "driver_arrived" && (
                        <button
                          type="button"
                          className="shiny-button verify-otp-action-btn"
                          onClick={() => handleVerifyOtp(b)}
                        >
                          🔑 Enter Customer OTP & Start Trip
                        </button>
                      )}

                      {["trip_started", "trip_in_progress"].includes(b.trip?.status) && (
                        <button
                          type="button"
                          className="shiny-button complete-btn"
                          onClick={() => {
                            setSelectedTripBooking(b);
                            setEndEvidenceModalOpen(true);
                          }}
                        >
                          🏁 Complete Trip & Record End Odometer
                        </button>
                      )}

                      {b.trip?.status === "trip_completed" && (
                        <span className="trip-completed-tag">✓ Completed & Ledger Updated</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY VEHICLE */}
        {activeTab === "vehicle" && (
          <div className="driver-vehicle-view glass-card">
            <h3>Assigned Fleet Vehicle</h3>
            <div className="vehicle-details-split">
              <div className="assigned-vehicle-placeholder" style={{ width: "240px", height: "160px", background: "#1e293b", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>
                🚗
              </div>
              <div className="vehicle-details-info">
                <h4>Toyota Innova Crysta 2.4 VX</h4>
                <p>Registration Number: <strong>MH 28 BD 4829</strong></p>
                <p>Seating Capacity: <strong>7 Seater (AC)</strong></p>
                <p>Fuel Type: <strong>Diesel</strong></p>
                <p>RC Validity: <strong>Active (Valid till Dec 2030)</strong></p>
                <p>Insurance Status: <strong>Comprehensive (Valid)</strong></p>
                <span className="vehicle-inspection-badge">✓ Clean & Mechanically Certified</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EARNINGS & LEDGER (IMAGE 1 TILE 14) */}
        {(activeTab === "earnings" || activeTab === "settlements") && (
          <div className="driver-earnings-view glass-card">
            <h3>Financial Ledger & Payouts</h3>
            <div className="ledger-breakdown-card">
              <div className="ledger-row">
                <span>Total Gross Fare Completed</span>
                <strong>₹ 12,000</strong>
              </div>
              <div className="ledger-row">
                <span>RideOn Platform Commission (10%)</span>
                <span className="commission-text">- ₹ 1,200</span>
              </div>
              <div className="ledger-row total">
                <strong>Net Driver Earnings</strong>
                <strong className="gold-text">₹ 10,800</strong>
              </div>
              <div className="ledger-row">
                <span>Cash Collected Directly from Customers</span>
                <span>₹ 3,500</span>
              </div>
              <div className="ledger-row settlement-status">
                <strong>Amount Payable by RideOn (Online Settlement)</strong>
                <strong className="payout-highlight">₹ 7,300</strong>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="driver-docs-view glass-card">
            <h3>Verified Identity & Documents</h3>
            <div className="docs-list-grid">
              <div className="doc-item-box">
                <strong>Commercial Driving Licence</strong>
                <span>MH2820210012345 • Verified</span>
                <span className="doc-status-ok">✓ Active</span>
              </div>
              <div className="doc-item-box">
                <strong>Aadhaar Card</strong>
                <span>XXXX-XXXX-9012 • Verified</span>
                <span className="doc-status-ok">✓ Active</span>
              </div>
              <div className="doc-item-box">
                <strong>Bank Payout Account</strong>
                <span>SBI (A/C: *******890) • IFSC: SBIN0001234</span>
                <span className="doc-status-ok">✓ Primary Verified</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SUPPORT */}
        {activeTab === "support" && (
          <div className="driver-support-view glass-card">
            <h3>Driver Partner Helpdesk</h3>
            <p>Emergency assistance, breakdown support, and dispatch resolution:</p>
            <div className="support-channels-row">
              <div className="support-box">
                <span className="support-icon">📞</span>
                <strong>Driver Helpline</strong>
                <span>+91 1800-RIDE-DRIVER</span>
              </div>
              <div className="support-box">
                <span className="support-icon">🚨</span>
                <strong>Roadside SOS</strong>
                <span>24/7 Breakdown Assistance</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL 1: OTP VERIFICATION (IMAGE 1 TILE 6)
      =========================================== */}
      {otpModalOpen && selectedTripBooking && (
        <div className="driver-modal-backdrop" onClick={() => setOtpModalOpen(false)}>
          <div className="driver-evidence-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-row">
              <h3>Enter Customer Start OTP</h3>
              <button className="modal-x-btn" onClick={() => setOtpModalOpen(false)}>✕</button>
            </div>

            <p className="otp-modal-subhead">
              Ask customer for their 4 or 6-digit trip start code to unlock the journey.
            </p>

            <div className="otp-digit-inputs">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter OTP"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                className="otp-input-field"
              />
            </div>

            {modalMsg && <div className="modal-error-text">{modalMsg}</div>}

            <div className="modal-actions-row">
              <button
                type="button"
                className="shiny-button verify-next-btn"
                onClick={() => {
                  if (enteredOtp.trim().length < 4) {
                    setModalMsg("Please enter the complete OTP provided by customer");
                    return;
                  }
                  setOtpVerified(true);
                  setOtpModalOpen(false);
                  setStartEvidenceModalOpen(true);
                }}
              >
                Verify & Enter Start Odometer →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: TRIP START EVIDENCE (IMAGE 1 TILE 7)
      =========================================== */}
      {startEvidenceModalOpen && selectedTripBooking && (
        <div className="driver-modal-backdrop" onClick={() => setStartEvidenceModalOpen(false)}>
          <div className="driver-evidence-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-row">
              <div>
                <h3>Trip Start Evidence (Odometer & Photo)</h3>
                {otpVerified && (
                  <span style={{ fontSize: "11px", color: "#4ade80", fontWeight: 600 }}>
                    ✓ Customer OTP Verified
                  </span>
                )}
              </div>
              <button className="modal-x-btn" onClick={() => setStartEvidenceModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleStartTripWithEvidence} className="evidence-form">
              <div className="form-field">
                <label>Start Odometer Reading (KM)</label>
                <input
                  type="number"
                  value={startOdometer}
                  onChange={(e) => setStartOdometer(e.target.value)}
                  placeholder="e.g. 15236"
                  required
                />
              </div>

              <div className="form-field">
                <label>Dashboard Photo URL</label>
                <input
                  type="url"
                  value={startPhoto}
                  onChange={(e) => setStartPhoto(e.target.value)}
                  placeholder="Photo URL"
                  required
                />
              </div>

              <div className="form-field">
                <label>Pickup Location</label>
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  required
                />
              </div>

              {modalMsg && <div className="modal-error-text">{modalMsg}</div>}

              <button type="submit" className="shiny-button modal-submit-action" disabled={submitting}>
                {submitting ? "Starting Trip..." : "Start Trip Now 🚗"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: TRIP END EVIDENCE (IMAGE 1 TILE 7)
      =========================================== */}
      {endEvidenceModalOpen && selectedTripBooking && (
        <div className="driver-modal-backdrop" onClick={() => setEndEvidenceModalOpen(false)}>
          <div className="driver-evidence-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-row">
              <h3>Trip End Evidence & Final KM</h3>
              <button className="modal-x-btn" onClick={() => setEndEvidenceModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCompleteTrip} className="evidence-form">
              <div className="form-field">
                <label>End Odometer Reading (KM)</label>
                <input
                  type="number"
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(e.target.value)}
                  placeholder="e.g. 15638"
                  required
                />
              </div>

              <div className="form-field">
                <label>End Dashboard Photo URL</label>
                <input
                  type="url"
                  value={endPhoto}
                  onChange={(e) => setEndPhoto(e.target.value)}
                  placeholder="Photo URL"
                  required
                />
              </div>

              <div className="form-field">
                <label>Dropoff Location</label>
                <input
                  type="text"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  required
                />
              </div>

              <div className="actual-km-calc-preview">
                <span>Calculated Distance:</span>
                <strong>{Math.max(0, Number(endOdometer) - Number(startOdometer))} KM</strong>
              </div>

              {modalMsg && <div className="modal-error-text">{modalMsg}</div>}

              <button type="submit" className="shiny-button modal-submit-action" disabled={submitting}>
                {submitting ? "Submitting Evidence..." : "Complete Trip & Record Evidence 🏁"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

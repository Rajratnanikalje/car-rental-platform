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
  const [vehicles, setVehicles] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState("");
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [vehicleForm, setVehicleForm] = useState({ name: "", brand: "", model: "", year: new Date().getFullYear(), category: "Sedan", transmission: "Manual", fuelType: "Petrol", seats: 5, pricePerDay: "", pricePerKm: 0, includedKm: 300, location: "", serviceAreas: [], registrationNumber: "", image: "", description: "", features: "", documents: [] });
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
        setLedger(lData.totals || null);
      }
    } catch (err) {
      console.error("Driver data error:", err);
      setError("Unable to load driver data. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    setVehiclesLoading(true); setVehicleError("");
    try {
      const response = await fetch(`${API_URL}/cars/driver/mine`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load your vehicles");
      setVehicles(Array.isArray(data.cars) ? data.cars : []);
    } catch (err) { setVehicleError(err.message); }
    finally { setVehiclesLoading(false); }
  };

  const submitVehicle = async (event) => {
    event.preventDefault(); setVehicleSubmitting(true); setVehicleError("");
    try {
      const payload = { ...vehicleForm, features: typeof vehicleForm.features === "string" ? vehicleForm.features.split(",").map((v) => v.trim()).filter(Boolean) : vehicleForm.features, documents: [...vehicleForm.documents, ...(documentType.trim() && documentUrl.trim() ? [{ documentType: documentType.trim(), documentUrl: documentUrl.trim() }] : [])] };
      const response = await fetch(editingVehicle ? `${API_URL}/cars/driver/mine/${editingVehicle._id}` : `${API_URL}/cars/driver/mine`, { method: editingVehicle ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Vehicle submission failed");
      setVehicleForm({ name: "", brand: "", model: "", year: new Date().getFullYear(), category: "Sedan", transmission: "Manual", fuelType: "Petrol", seats: 5, pricePerDay: "", pricePerKm: 0, includedKm: 300, location: "", serviceAreas: [], registrationNumber: "", image: "", description: "", features: "", documents: [] });
      setEditingVehicle(null); setDocumentType(""); setDocumentUrl("");
      await fetchVehicles();
    } catch (err) { setVehicleError(err.message); }
    finally { setVehicleSubmitting(false); }
  };

  useEffect(() => {
    fetch(`${API_URL}/service-areas`).then((response) => response.json()).then((data) => setServiceAreas(data.areas || [])).catch(() => setServiceAreas([]));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const timer = window.setTimeout(fetchDriverData, 0);
    const vehicleTimer = window.setTimeout(fetchVehicles, 0);
    return () => { window.clearTimeout(timer); window.clearTimeout(vehicleTimer); };
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
            <div className="driver-status-badge approved">Driver account</div>
          </div>
        </header>

        {error && <div className="driver-error-alert">{error}</div>}

        {/* 3 STATS CARDS (IMAGE 1 TILE 5) */}
        <section className="driver-stats-grid">
          <div className="driver-stat-card glass-card">
            <span className="stat-title">Completed Trips</span>
            <strong className="stat-num">{loading ? "..." : trips.filter((t) => t.bookingStatus === "completed").length}</strong>
          </div>
          <div className="driver-stat-card glass-card">
            <span className="stat-title">Earnings</span>
            <strong className="stat-num highlight-gold">
              ₹ {ledger?.netEarnings?.toLocaleString("en-IN") || "0"}
            </strong>
          </div>
          <div className="driver-stat-card glass-card">
            <span className="stat-title">Pending Settlement</span>
            <strong className="stat-num highlight-blue">
              ₹ {ledger?.pendingPayout?.toLocaleString("en-IN") || "0"}
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
            <h3>My Vehicles</h3>
            <button type="button" className="driver-btn-outline" onClick={fetchVehicles} disabled={vehiclesLoading}>Refresh</button>
            {vehicleError && <p role="alert">{vehicleError}</p>}
            {vehiclesLoading ? <p>Loading your vehicles…</p> : vehicles.length === 0 ? <p>No vehicles submitted yet.</p> : vehicles.map((car) => <article key={car._id} className="vehicle-details-split">
              {car.image ? <img src={car.image} alt={`${car.brand} ${car.model}`} style={{ width: 240, height: 160, objectFit: "cover", borderRadius: 12 }} /> : <div className="assigned-vehicle-placeholder">🚗</div>}
              <div className="vehicle-details-info"><h4>{car.name || `${car.brand} ${car.model}`}</h4><p>Registration: <strong>{car.registrationNumber || "Not provided"}</strong></p><p>{car.year} · {car.seats} seats · {car.fuelType} · {car.transmission}</p><p>₹{Number(car.pricePerDay).toLocaleString("en-IN")} / day · {car.location}</p><p>Review: <strong>{car.verificationStatus}</strong> · Availability: <strong>{car.available ? "Available" : "Unavailable"}</strong></p>{car.verificationStatus === "rejected" && <p>Review note: {car.verificationReviewNote || "No reason provided. Contact support/admin."}</p>}{["pending", "rejected"].includes(car.verificationStatus) && <button type="button" className="driver-btn-outline" onClick={() => { setEditingVehicle(car); setVehicleForm({ ...car, features: (car.features || []).join(", "), documents: car.documents || [] }); }}>Edit and resubmit</button>}{car.documents?.map((doc, index) => <p key={`${doc.documentType}-${index}`}><a href={doc.documentUrl} target="_blank" rel="noreferrer">{doc.documentType} document ({doc.status})</a></p>)}</div>
            </article>)}
            <h4>{editingVehicle ? "Edit and resubmit vehicle" : "Add a vehicle"}</h4>
            <form onSubmit={submitVehicle} className="vehicle-details-info" style={{ display: "grid", gap: 10, maxWidth: 680 }}>
              {[["name", "Vehicle name"], ["brand", "Brand"], ["model", "Model"], ["year", "Year"], ["category", "Category"], ["transmission", "Transmission"], ["fuelType", "Fuel type"], ["seats", "Seats"], ["pricePerDay", "Price per day"], ["pricePerKm", "Price per km"], ["includedKm", "Included km"], ["location", "Location"], ["registrationNumber", "Registration number"], ["image", "Vehicle image URL"], ["features", "Features (comma separated)"], ["description", "Description"]].map(([key, label]) => <label key={key}>{label}<input required={!['pricePerKm','includedKm','image','features','description'].includes(key)} value={vehicleForm[key]} onChange={(e) => setVehicleForm((prev) => ({ ...prev, [key]: e.target.value }))} /></label>)}
              <label>Supported service areas<select multiple value={(vehicleForm.serviceAreas || []).map(String)} onChange={(e) => setVehicleForm((prev) => ({ ...prev, serviceAreas: Array.from(e.target.selectedOptions, (option) => option.value) }))}>{serviceAreas.map((area) => <option key={area._id} value={area._id}>{area.name}</option>)}</select><small>Hold Ctrl to select multiple areas.</small></label>
              <label>Vehicle document type<input value={documentType} onChange={(e) => setDocumentType(e.target.value)} placeholder="Registration certificate / insurance" /></label><label>Document URL<input value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="Secure document URL" /></label>
              <button type="submit" className="shiny-button" disabled={vehicleSubmitting}>{vehicleSubmitting ? "Submitting…" : editingVehicle ? "Resubmit for approval" : "Submit for approval"}</button>
              {editingVehicle && <button type="button" className="driver-btn-outline" onClick={() => { setEditingVehicle(null); setVehicleForm({ name: "", brand: "", model: "", year: new Date().getFullYear(), category: "Sedan", transmission: "Manual", fuelType: "Petrol", seats: 5, pricePerDay: "", pricePerKm: 0, includedKm: 300, location: "", serviceAreas: [], registrationNumber: "", image: "", description: "", features: "", documents: [] }); }}>Cancel edit</button>}
            </form>
          </div>
        )}

        {/* TAB 3: EARNINGS & LEDGER (IMAGE 1 TILE 14) */}
        {(activeTab === "earnings" || activeTab === "settlements") && (
          <div className="driver-earnings-view glass-card">
            <h3>Financial Ledger & Payouts</h3>
            <div className="ledger-breakdown-card">
              <div className="ledger-row">
                <span>Total Gross Fare Completed</span>
                <strong>₹ {ledger?.grossAmount?.toLocaleString("en-IN") || 0}</strong>
              </div>
              <div className="ledger-row">
                <span>Platform Commission & Fee</span>
                <span className="commission-text">- ₹ {ledger?.commissionPayable?.toLocaleString("en-IN") || 0}</span>
              </div>
              <div className="ledger-row total">
                <strong>Net Driver Earnings</strong>
                <strong className="gold-text">₹ {ledger?.netEarnings?.toLocaleString("en-IN") || 0}</strong>
              </div>
              <div className="ledger-row settlement-status">
                <strong>Amount Payable by RideOn (Online Settlement)</strong>
                <strong className="payout-highlight">₹ {ledger?.driverPayout?.toLocaleString("en-IN") || 0}</strong>
              </div>
              <div className="ledger-row"><span>Pending payout</span><strong>{ledger?.pendingPayout?.toLocaleString("en-IN") || 0}</strong></div>
              <div className="ledger-row"><span>Paid out</span><strong>{ledger?.paidPayout?.toLocaleString("en-IN") || 0}</strong></div>
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="driver-docs-view glass-card">
            <h3>Verified Identity & Documents</h3>
            <p>Driver identity documents are managed in your driver application. Vehicle documents are listed with each vehicle.</p>
          </div>
        )}

        {/* TAB 5: SUPPORT */}
        {activeTab === "support" && (
          <div className="driver-support-view glass-card">
            <h3>Driver Partner Helpdesk</h3>
            <p>Emergency assistance, breakdown support, and dispatch resolution:</p>
            <div className="support-channels-row">
              <div className="support-box"><strong>Driver support</strong><span>Contact the platform support team for assistance.</span></div>
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

import { API_URL } from "../config/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../pages/DriverTrips.css";


export default function DriverTrips() {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Form states
  const [otp, setOtp] = useState("");
  const [startOdometer, setStartOdometer] = useState("");
  const [startPhoto, setStartPhoto] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [endPhoto, setEndPhoto] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch trips
  const fetchTrips = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      const response = await fetch(`${API_URL}/trips/driver/my-trips`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch assigned trips");

      const data = await response.json();
      setTrips(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err) {
      setError(err.message || "Unable to load assigned trips");
    } finally {
      setLoading(false);
    }
  };

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [authLoading, isLoggedIn, navigate]);

  // Check if driver
  useEffect(() => {
    if (!authLoading && user?.role !== "driver") {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  // Fetch trips on mount
  useEffect(() => {
    const timer = window.setTimeout(fetchTrips, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Mark arrival
  const handleMarkArrival = async (bookingId) => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/trips/${bookingId}/arrive`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to mark arrival");
      }

      setError("");
      alert("✅ Arrival marked! Customer will receive OTP shortly.");
      fetchTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle start trip
  const handleStartTrip = async () => {
    if (!otp || !startOdometer || !startPhoto || !startLocation) {
      setError("All fields required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_URL}/trips/${selectedBooking._id}/start`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            otp: otp.trim(),
            odometer: Number(startOdometer),
            photoUrl: startPhoto,
            location: startLocation.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to start trip");
      }

      alert("✅ Trip started successfully!");
      setShowStartModal(false);
      setOtp("");
      setStartOdometer("");
      setStartPhoto("");
      setStartLocation("");
      fetchTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle complete trip
  const handleCompleteTrip = async () => {
    if (!endOdometer || !endPhoto || !endLocation) {
      setError("All fields required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_URL}/trips/${selectedBooking._id}/complete`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            odometer: Number(endOdometer),
            photoUrl: endPhoto,
            location: endLocation.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to complete trip");
      }

      alert("✅ Trip completed successfully!");
      setShowCompleteModal(false);
      setEndOdometer("");
      setEndPhoto("");
      setEndLocation("");
      fetchTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm cash collection for completed cash trips
  const handleConfirmCashCollection = async (bookingId) => {
    if (!window.confirm("Confirm that you have collected the cash from the customer for this trip?")) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/finance/bookings/${bookingId}/cash-collection`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to confirm cash collection");
      }

      alert("✅ " + (data.message || "Cash collection confirmed!"));
      fetchTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Convert image to base64
  const handleImageUpload = (file, setter) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      driver_assigned: { label: "Assigned", color: "blue" },
      driver_arrived: { label: "Arrived", color: "yellow" },
      trip_started: { label: "In Progress", color: "orange" },
      trip_in_progress: { label: "In Progress", color: "orange" },
      trip_completed: { label: "Completed", color: "green" },
      cancelled: { label: "Cancelled", color: "red" },
    };

    const config = statusConfig[status] || { label: status, color: "gray" };
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (authLoading) return <div className="loading">Loading...</div>;
  if (user?.role !== "driver") return null;
  if (loading) return <div className="loading">Loading trips...</div>;

  return (
    <div className="driver-trips-container">
      <div className="trips-header">
        <h1>📍 My Trips</h1>
        <p>Manage your active bookings and trips</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h2>No Trips Yet</h2>
          <p>You don't have any assigned trips. Check back soon!</p>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => (
            <div key={trip._id} className="trip-card">
              <div className="trip-header">
                <div>
                  <h3>{trip.car?.name}</h3>
                  <p className="trip-id">Booking #{trip._id?.slice(-6).toUpperCase()}</p>
                </div>
                {getStatusBadge(trip.trip?.status)}
              </div>

              <div className="trip-details">
                {trip.user && (
                  <div className="detail-row">
                    <span className="label">👤 Customer:</span>
                    <span>
                      {trip.user.name || "Customer"}{trip.user.phone ? ` (${trip.user.phone})` : ""}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">🚌 Type:</span>
                  <span>{trip.bookingType || "Private Car"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">📍 Pickup:</span>
                  <span>{trip.pickupLocation}</span>
                </div>
                <div className="detail-row">
                  <span className="label">💰 Amount:</span>
                  <span className="amount">₹{trip.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">💳 Payment:</span>
                  <span className="payment-method">
                    {trip.paymentMethod?.toUpperCase() || "CASH"} (
                    <span
                      style={{
                        color: trip.paymentStatus === "paid" ? "#4ade80" : "#fbbf24",
                        fontWeight: "600",
                      }}
                    >
                      {trip.paymentStatus === "paid" ? "PAID" : "PENDING"}
                    </span>
                    )
                  </span>
                </div>
                {trip.trip?.startEvidence?.odometer !== undefined && trip.trip?.startEvidence?.odometer !== null && (
                  <div className="detail-row">
                    <span className="label">🚀 Start Odo:</span>
                    <span>{trip.trip.startEvidence.odometer} KM</span>
                  </div>
                )}
                {trip.trip?.endEvidence?.odometer !== undefined && trip.trip?.endEvidence?.odometer !== null && (
                  <div className="detail-row">
                    <span className="label">🏁 End Odo:</span>
                    <span>{trip.trip.endEvidence.odometer} KM</span>
                  </div>
                )}
                {trip.trip?.actualDistanceKm !== undefined && trip.trip?.actualDistanceKm !== null && trip.trip?.status === "trip_completed" && (
                  <div className="detail-row">
                    <span className="label">📏 Distance:</span>
                    <span>
                      {trip.trip.actualDistanceKm} KM
                      {trip.extraKm > 0 ? ` (+${trip.extraKm} KM extra)` : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="trip-actions">
                {trip.trip?.status === "driver_assigned" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleMarkArrival(trip._id)}
                    disabled={submitting}
                  >
                    ✓ Mark Arrival
                  </button>
                )}

                {trip.trip?.status === "driver_arrived" && (
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setSelectedBooking(trip);
                      setShowStartModal(true);
                      setError("");
                    }}
                  >
                    ▶ Start Trip
                  </button>
                )}

                {(trip.trip?.status === "trip_started" ||
                  trip.trip?.status === "trip_in_progress") && (
                  <button
                    className="btn btn-warning"
                    onClick={() => {
                      setSelectedBooking(trip);
                      setShowCompleteModal(true);
                      setError("");
                    }}
                  >
                    ⛔ Complete Trip
                  </button>
                )}

                {trip.trip?.status === "trip_completed" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <button className="btn btn-completed" disabled>
                      ✓ Completed
                    </button>
                    {trip.paymentMethod === "cash" && trip.paymentStatus !== "paid" && (
                      <button
                        className="btn btn-success"
                        style={{ background: "#10b981", borderColor: "#059669" }}
                        onClick={() => handleConfirmCashCollection(trip._id)}
                        disabled={submitting}
                      >
                        💵 Confirm Cash Received (₹{trip.totalAmount?.toFixed(2)})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start Trip Modal */}
      {showStartModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowStartModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🚀 Start Trip</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Customer OTP (6 digits)</label>
              <input
                type="text"
                maxLength="6"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Start Odometer (KM)</label>
              <input
                type="number"
                placeholder="e.g., 45000"
                value={startOdometer}
                onChange={(e) => setStartOdometer(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Start Location</label>
              <input
                type="text"
                placeholder="Current location"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Dashboard Photo (JPEG/PNG)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files[0], setStartPhoto)
                }
              />
              {startPhoto && <div className="image-preview">✓ Photo uploaded</div>}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleStartTrip}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "▶ Start Trip"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowStartModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⛔ Complete Trip</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>End Odometer (KM)</label>
              <input
                type="number"
                placeholder="e.g., 45150"
                value={endOdometer}
                onChange={(e) => setEndOdometer(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>End Location</label>
              <input
                type="text"
                placeholder="Dropoff location"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Final Dashboard Photo (JPEG/PNG)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files[0], setEndPhoto)
                }
              />
              {endPhoto && <div className="image-preview">✓ Photo uploaded</div>}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleCompleteTrip}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "✓ Complete Trip"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCompleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

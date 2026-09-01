import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../pages/DriverTrips.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function DriverTrips() {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
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

  // Fetch trips
  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings/my`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch trips");

      const data = await response.json();
      // Filter only driver's trips
      const driverTrips = data.bookings.filter((b) => b.driver && b.trip);
      setTrips(driverTrips);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
                  <span className="label">👤 Payment:</span>
                  <span className="payment-method">
                    {trip.paymentMethod?.toUpperCase() || "CASH"}
                  </span>
                </div>
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
                  <button className="btn btn-completed" disabled>
                    ✓ Completed
                  </button>
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

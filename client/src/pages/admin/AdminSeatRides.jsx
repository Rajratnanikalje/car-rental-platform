import { useState, useEffect } from "react";
import "./AdminPages.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function AdminSeatRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRideManifest, setSelectedRideManifest] = useState(null);
  const [manifestLoading, setManifestLoading] = useState(false);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/seat-rides/admin/all`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load scheduled rides");
      setRides(Array.isArray(data.rides) ? data.rides : []);
    } catch (err) {
      console.error("Admin seat rides fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchRides, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loadManifest = async (rideId) => {
    try {
      setManifestLoading(true);
      setSelectedRideManifest(null);
      const res = await fetch(`${API_URL}/seat-rides/${rideId}/manifest`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setSelectedRideManifest(data);
      }
    } catch (err) {
      console.error("Manifest error:", err);
    } finally {
      setManifestLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Scheduled Seat Rides & Manifests</h1>
          <p>Manage shared routes, monitor available seat inventory, and inspect passenger boarding manifests.</p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={fetchRides} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}

      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Departure Time</th>
              <th>Available / Total</th>
              <th>Price / Seat</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">Loading scheduled seat rides...</td>
              </tr>
            ) : rides.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">No scheduled rides found in database.</td>
              </tr>
            ) : (
              rides.map((ride) => (
                <tr key={ride._id}>
                  <td>
                    <strong>{ride.pickupPoint?.split(",")[0]} ➔ {ride.destination?.split(",")[0]}</strong>
                    <small style={{ display: "block", color: "#94a3b8", fontSize: "11px" }}>
                      {ride.pickupPoint} to {ride.destination}
                    </small>
                  </td>
                  <td>
                    {ride.car?.brand} {ride.car?.model} ({ride.car?.seats || ride.totalSeats} seats)
                  </td>
                  <td>
                    {new Date(ride.departureAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} |{" "}
                    {new Date(ride.departureAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    <span className={`admin-status-pill ${ride.availableSeats === 0 ? "cancelled" : "confirmed"}`}>
                      {ride.availableSeats} / {ride.totalSeats} seats
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "#facc15" }}>₹{ride.pricePerSeat}</strong>
                  </td>
                  <td>
                    <span className={`admin-status-pill ${ride.status}`}>{ride.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn-sm"
                      onClick={() => loadManifest(ride._id)}
                      disabled={manifestLoading}
                    >
                      {manifestLoading ? "Loading..." : "📋 View Manifest"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manifest Modal */}
      {selectedRideManifest && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedRideManifest(null)}>
          <div className="admin-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Passenger Boarding Manifest</h3>
              <button className="admin-modal-close" onClick={() => setSelectedRideManifest(null)}>✕</button>
            </div>

            <div style={{ marginBottom: "16px", color: "#cbd5e1", fontSize: "13px" }}>
              <p>Route: <strong>{selectedRideManifest.ride?.pickupPoint} ➔ {selectedRideManifest.ride?.destination}</strong></p>
              <p>Departure: <strong>{new Date(selectedRideManifest.ride?.departureAt).toLocaleString()}</strong></p>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Passenger</th>
                  <th>Seats</th>
                  <th>Pickup Spot</th>
                  <th>Fare</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedRideManifest.passengers?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">No booked passengers for this route yet.</td>
                  </tr>
                ) : (
                  selectedRideManifest.passengers?.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{p.user?.name || "Passenger"}</strong>
                        <small style={{ display: "block", color: "#94a3b8" }}>{p.user?.phone}</small>
                      </td>
                      <td>{p.seats} seat(s)</td>
                      <td>{p.pickupLocation}</td>
                      <td>₹{p.fare}</td>
                      <td>
                        <span className={`admin-status-pill ${p.bookingStatus}`}>
                          {p.bookingStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

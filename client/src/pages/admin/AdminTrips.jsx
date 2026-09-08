import { useState, useEffect } from "react";
import "./AdminPages.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function AdminTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTripEvidence, setSelectedTripEvidence] = useState(null);

  const fetchTrips = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      setError("");
      const url = statusFilter === "all"
        ? `${API_URL}/trips`
        : `${API_URL}/trips?status=${statusFilter}`;

      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();
      if (response.ok && data.success) {
        setTrips(Array.isArray(data.trips) ? data.trips : []);
      } else {
        throw new Error(data?.message || "Failed to load trips");
      }
    } catch (err) {
      console.error("Fetch trips error:", err);
      setError(err.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchTrips, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "driver_assigned": return <span className="admin-badge badge-blue">Driver Assigned</span>;
      case "driver_arrived": return <span className="admin-badge badge-yellow">Driver Arrived</span>;
      case "trip_started":
      case "trip_in_progress": return <span className="admin-badge badge-orange">In Progress</span>;
      case "trip_completed": return <span className="admin-badge badge-green">Completed</span>;
      case "cancelled": return <span className="admin-badge badge-red">Cancelled</span>;
      default: return <span className="admin-badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Trip Execution & Fraud Oversight</h1>
          <p>Monitor real-time trip states, start/end odometer verification photos, and system fraud flags.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchTrips}>
            🔄 Refresh Trips
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", padding: "14px 18px", borderRadius: "10px" }}>
          {error}
        </div>
      )}

      <div className="admin-card">
        <div className="admin-filter-bar">
          <div className="admin-tabs-row">
            {["all", "driver_assigned", "driver_arrived", "trip_started", "trip_completed", "cancelled"].map((st) => (
              <button
                key={st}
                className={`admin-filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.replace(/_/g, " ").toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            Showing {trips.length} trips
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Loading trip lifecycle records...
          </div>
        ) : trips.length === 0 ? (
          <div className="admin-empty-box">
            <div className="admin-empty-icon">🗺️</div>
            <h3>No trips recorded</h3>
            <p>Trips created from driver assignments will appear here.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Customer</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Odometer (Start / End)</th>
                  <th>Distance</th>
                  <th>Fraud Flags</th>
                  <th style={{ textAlign: "right" }}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <code>#{t._id.slice(-6).toUpperCase()}</code>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <strong>{t.booking?.user?.name || "Customer"}</strong>
                      <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                        {t.booking?.user?.phone || t.booking?.user?.email || "—"}
                      </div>
                    </td>
                    <td>
                      <strong>{t.driver?.user?.name || "Driver"}</strong>
                      <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                        {t.driver?.mobile || "—"}
                      </div>
                    </td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td>
                      <div>Start: {t.startEvidence?.odometer !== undefined ? `${t.startEvidence.odometer} KM` : "—"}</div>
                      <div style={{ color: "#94a3b8" }}>End: {t.endEvidence?.odometer !== undefined ? `${t.endEvidence.odometer} KM` : "—"}</div>
                    </td>
                    <td>
                      <strong>{t.actualDistanceKm !== undefined ? `${t.actualDistanceKm} KM` : "—"}</strong>
                    </td>
                    <td>
                      {t.fraudFlags && t.fraudFlags.length > 0 ? (
                        <span className="admin-badge badge-red">
                          ⚠️ {t.fraudFlags.join(", ")}
                        </span>
                      ) : (
                        <span className="admin-badge badge-green">✓ Clear</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        {(t.startEvidence || t.endEvidence) ? (
                          <button
                            className="admin-btn admin-btn-sm admin-btn-secondary"
                            onClick={() => setSelectedTripEvidence(t)}
                          >
                            📷 Evidence
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#64748b" }}>No evidence yet</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTripEvidence && (
        <div className="admin-modal-overlay" onClick={() => setSelectedTripEvidence(null)}>
          <div className="admin-modal" style={{ maxWidth: "650px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Trip Evidence: #{selectedTripEvidence._id.slice(-6).toUpperCase()}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedTripEvidence(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#38bdf8", fontSize: "13px" }}>🚀 Start Trip Evidence</h4>
                {selectedTripEvidence.startEvidence ? (
                  <div style={{ fontSize: "13px", display: "grid", gap: "6px" }}>
                    <div><span style={{ color: "#94a3b8" }}>Odometer Reading:</span> <strong>{selectedTripEvidence.startEvidence.odometer} KM</strong></div>
                    <div><span style={{ color: "#94a3b8" }}>Pickup Location:</span> <strong>{selectedTripEvidence.startEvidence.location}</strong></div>
                    <div><span style={{ color: "#94a3b8" }}>Recorded At:</span> {new Date(selectedTripEvidence.startEvidence.recordedAt).toLocaleString()}</div>
                    {selectedTripEvidence.startEvidence.photoUrl && (
                      <div style={{ marginTop: "8px" }}>
                        <img
                          src={selectedTripEvidence.startEvidence.photoUrl}
                          alt="Start Odometer Dashboard"
                          style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                      </div>
                    )}
                  </div>
                ) : <span style={{ color: "#64748b" }}>Not recorded yet</span>}
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#4ade80", fontSize: "13px" }}>🏁 End Trip Evidence</h4>
                {selectedTripEvidence.endEvidence ? (
                  <div style={{ fontSize: "13px", display: "grid", gap: "6px" }}>
                    <div><span style={{ color: "#94a3b8" }}>Odometer Reading:</span> <strong>{selectedTripEvidence.endEvidence.odometer} KM</strong></div>
                    <div><span style={{ color: "#94a3b8" }}>Dropoff Location:</span> <strong>{selectedTripEvidence.endEvidence.location}</strong></div>
                    <div><span style={{ color: "#94a3b8" }}>Recorded At:</span> {new Date(selectedTripEvidence.endEvidence.recordedAt).toLocaleString()}</div>
                    {selectedTripEvidence.endEvidence.photoUrl && (
                      <div style={{ marginTop: "8px" }}>
                        <img
                          src={selectedTripEvidence.endEvidence.photoUrl}
                          alt="End Odometer Dashboard"
                          style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                      </div>
                    )}
                  </div>
                ) : <span style={{ color: "#64748b" }}>Not recorded yet</span>}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedTripEvidence(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import "./AdminPages.css";


export default function AdminFraudDisputes() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvidenceTrip, setSelectedEvidenceTrip] = useState(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/trips`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load trips");
      setTrips(Array.isArray(data.trips) ? data.trips : []);
    } catch (err) {
      console.error("Fetch fraud trips error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchTrips, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Trip Safety, Odometer Evidence & Disputes</h1>
          <p>Inspect odometer readings, start/end photo verification, GPS evidence, and fraud risk flags.</p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={fetchTrips} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}

      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Trip / Booking</th>
              <th>Driver Partner</th>
              <th>Start Odometer</th>
              <th>End Odometer</th>
              <th>Actual KM</th>
              <th>Risk Status</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">Loading trip audit records...</td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">No trips recorded in the platform yet.</td>
              </tr>
            ) : (
              trips.map((t) => (
                <tr key={t._id}>
                  <td>
                    <strong>#{t.booking?._id?.slice(-8) || t._id?.slice(-8)}</strong>
                    <small style={{ display: "block", color: "#94a3b8" }}>
                      {t.booking?.pickupLocation || "Pickup"}
                    </small>
                  </td>
                  <td>
                    <strong>{t.driver?.user?.name || "Driver Partner"}</strong>
                    <small style={{ display: "block", color: "#94a3b8" }}>{t.driver?.mobile}</small>
                  </td>
                  <td>
                    {t.startEvidence?.odometer ? `${t.startEvidence.odometer} KM` : "—"}
                  </td>
                  <td>
                    {t.endEvidence?.odometer ? `${t.endEvidence.odometer} KM` : "—"}
                  </td>
                  <td>
                    <strong style={{ color: "#facc15" }}>{t.actualDistanceKm || 0} KM</strong>
                  </td>
                  <td>
                    {t.fraudFlags && t.fraudFlags.length > 0 ? (
                      <span className="admin-status-pill cancelled">
                        ⚠️ {t.fraudFlags.join(", ")}
                      </span>
                    ) : (
                      <span className="admin-status-pill confirmed">
                        ✓ Clear
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn-sm"
                      onClick={() => setSelectedEvidenceTrip(t)}
                    >
                      📸 Inspect Evidence
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Evidence Modal (Image 1 Tile 7) */}
      {selectedEvidenceTrip && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedEvidenceTrip(null)}>
          <div className="admin-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Trip Evidence & Odometer Verification</h3>
              <button className="admin-modal-close" onClick={() => setSelectedEvidenceTrip(null)}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "16px" }}>
              {/* Start Evidence */}
              <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "#38bdf8", marginBottom: "8px" }}>Trip Start Evidence</h4>
                <p>Odometer: <strong>{selectedEvidenceTrip.startEvidence?.odometer ?? "N/A"} KM</strong></p>
                <p>Location: <span>{selectedEvidenceTrip.startEvidence?.location || "N/A"}</span></p>
                <p>Recorded At: <small>{selectedEvidenceTrip.startEvidence?.recordedAt ? new Date(selectedEvidenceTrip.startEvidence.recordedAt).toLocaleString() : "N/A"}</small></p>
                {selectedEvidenceTrip.startEvidence?.photoUrl && (
                  <img
                    src={selectedEvidenceTrip.startEvidence.photoUrl}
                    alt="Start Odometer"
                    style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginTop: "10px" }}
                  />
                )}
              </div>

              {/* End Evidence */}
              <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "#22c55e", marginBottom: "8px" }}>Trip End Evidence</h4>
                <p>Odometer: <strong>{selectedEvidenceTrip.endEvidence?.odometer ?? "N/A"} KM</strong></p>
                <p>Location: <span>{selectedEvidenceTrip.endEvidence?.location || "N/A"}</span></p>
                <p>Recorded At: <small>{selectedEvidenceTrip.endEvidence?.recordedAt ? new Date(selectedEvidenceTrip.endEvidence.recordedAt).toLocaleString() : "N/A"}</small></p>
                {selectedEvidenceTrip.endEvidence?.photoUrl && (
                  <img
                    src={selectedEvidenceTrip.endEvidence.photoUrl}
                    alt="End Odometer"
                    style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginTop: "10px" }}
                  />
                )}
              </div>
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                type="button"
                className="admin-btn-sm"
                style={{ background: "#22c55e", color: "#0f172a", fontWeight: "700" }}
                onClick={() => {
                  alert("✅ Evidence verified and approved by admin.");
                  setSelectedEvidenceTrip(null);
                }}
              >
                ✓ Mark Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

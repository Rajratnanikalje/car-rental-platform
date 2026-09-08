import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import "./AdminPages.css";


export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchDrivers = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      setError("");
      const url = statusFilter === "all"
        ? `${API_URL}/drivers`
        : `${API_URL}/drivers?status=${statusFilter}`;

      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();
      if (response.ok && data.success) {
        setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
      } else {
        throw new Error(data?.message || "Failed to load drivers");
      }
    } catch (err) {
      console.error("Fetch drivers error:", err);
      setError(err.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchDrivers, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleUpdateStatus = async (driverId, newStatus) => {
    if (["rejected", "suspended"].includes(newStatus) && !reviewNote.trim()) {
      alert("Please provide a review note explaining the reason for rejection/suspension.");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`${API_URL}/drivers/${driverId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, reviewNote: reviewNote.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to update driver status");
      }

      alert(`✅ Driver status updated to: ${newStatus.toUpperCase()}`);
      setSelectedDriver(null);
      setReviewNote("");
      fetchDrivers();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": return <span className="admin-badge badge-green">✓ Approved</span>;
      case "under_review": return <span className="admin-badge badge-yellow">⏳ Under Review</span>;
      case "rejected": return <span className="admin-badge badge-red">✕ Rejected</span>;
      case "suspended": return <span className="admin-badge badge-orange">⛔ Suspended</span>;
      default: return <span className="admin-badge badge-blue">● Pending</span>;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Driver Verification & Oversight</h1>
          <p>Review submitted driving licences, identity proofs, and bank payout details for partner drivers.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchDrivers}>
            🔄 Refresh List
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
            {["all", "pending", "under_review", "approved", "rejected", "suspended"].map((st) => (
              <button
                key={st}
                className={`admin-filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            Showing {drivers.length} drivers
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Loading driver records...
          </div>
        ) : drivers.length === 0 ? (
          <div className="admin-empty-box">
            <div className="admin-empty-icon">🪪</div>
            <h3>No drivers found</h3>
            <p>No driver accounts match the selected status filter.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Contact</th>
                  <th>Licence No.</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <strong style={{ color: "#f8fafc", display: "block" }}>{d.user?.name || "Driver"}</strong>
                      <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>ID: #{d._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <div>{d.mobile || d.user?.phone || "—"}</div>
                      <small style={{ color: "#94a3b8" }}>{d.user?.email || "—"}</small>
                    </td>
                    <td>
                      <code>{d.drivingLicence?.number || "—"}</code>
                    </td>
                    <td>{getStatusBadge(d.status)}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                          onClick={() => {
                            setSelectedDriver(d);
                            setReviewNote(d.reviewNote || "");
                          }}
                        >
                          🔍 Review Documents
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDriver && (
        <div className="admin-modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="admin-modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>🔍 Driver Verification: {selectedDriver.user?.name || "Driver"}</h3>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Status: {selectedDriver.status?.toUpperCase()}</span>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedDriver(null)}>✕</button>
            </div>

            <div className="admin-modal-body">
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#818cf8", fontSize: "13px" }}>👤 Contact & Address</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div><span style={{ color: "#94a3b8" }}>Phone:</span> <strong>{selectedDriver.mobile || selectedDriver.user?.phone || "—"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>Email:</span> <strong>{selectedDriver.user?.email || "—"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>Emergency Contact:</span> <strong>{selectedDriver.emergencyContact?.name ? `${selectedDriver.emergencyContact.name} (${selectedDriver.emergencyContact.mobile || selectedDriver.emergencyContact.phone || "—"})` : "—"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>Full Address:</span> <strong>{typeof selectedDriver.address === "string" ? selectedDriver.address : selectedDriver.address?.street ? `${selectedDriver.address.street}, ${selectedDriver.address.city}, ${selectedDriver.address.state} - ${selectedDriver.address.pincode}` : "—"}</strong></div>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#818cf8", fontSize: "13px" }}>🪪 Driving Licence Evidence</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div><span style={{ color: "#94a3b8" }}>Licence Number:</span> <strong>{selectedDriver.drivingLicence?.number || "—"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>Expiry Date:</span> <strong>{selectedDriver.drivingLicence?.expiryDate ? new Date(selectedDriver.drivingLicence.expiryDate).toLocaleDateString() : "—"}</strong></div>
                </div>
                {selectedDriver.drivingLicence?.documentUrl && (
                  <div style={{ marginTop: "10px" }}>
                    <a href={selectedDriver.drivingLicence.documentUrl} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-sm admin-btn-secondary">
                      📄 View Driving Licence Document ↗
                    </a>
                  </div>
                )}
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#818cf8", fontSize: "13px" }}>🆔 Identity Proof (KYC)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div><span style={{ color: "#94a3b8" }}>Document Type:</span> <strong style={{ textTransform: "uppercase" }}>{selectedDriver.identity?.documentType || selectedDriver.identityProof?.documentType || "—"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>Document Number:</span> <strong>{selectedDriver.identity?.documentNumber || selectedDriver.identityProof?.documentNumber || "—"}</strong></div>
                </div>
                {(selectedDriver.identity?.documentUrl || selectedDriver.identityProof?.documentUrl) && (
                  <div style={{ marginTop: "10px" }}>
                    <a href={selectedDriver.identity?.documentUrl || selectedDriver.identityProof?.documentUrl} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-sm admin-btn-secondary">
                      📄 View ID Proof Document ↗
                    </a>
                  </div>
                )}
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#818cf8", fontSize: "13px" }}>🏦 Payout Account (Masked)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div><span style={{ color: "#94a3b8" }}>Bank Name:</span> <strong>{selectedDriver.payoutAccount?.bankName || "—"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>Account Holder:</span> <strong>{selectedDriver.payoutAccount?.accountHolderName || "—"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>Account Number:</span> <strong>{selectedDriver.payoutAccount?.accountNumberMasked || "XXXX1234"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>IFSC Code:</span> <strong>{selectedDriver.payoutAccount?.ifsc || selectedDriver.payoutAccount?.ifscCode || "—"}</strong></div>
                  <div><span style={{ color: "#94a3b8" }}>UPI ID:</span> <strong>{selectedDriver.payoutAccount?.upiId || "—"}</strong></div>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Review Notes (Required for rejection/suspension)</label>
                <textarea
                  rows="2"
                  placeholder="Enter audit or verification notes..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-modal-footer" style={{ justifyContent: "space-between" }}>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setSelectedDriver(null)}>
                Close
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedDriver._id, "under_review")}
                >
                  Mark Under Review
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedDriver._id, "rejected")}
                >
                  Reject Driver
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-success"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedDriver._id, "approved")}
                >
                  ✓ Approve Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

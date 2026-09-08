import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import "./AdminPages.css";


export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [approvedDrivers, setApprovedDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchBookings = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      setError("");
      const url = statusFilter === "all"
        ? `${API_URL}/bookings`
        : `${API_URL}/bookings?status=${statusFilter}`;

      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();
      if (response.ok && data.success) {
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } else {
        throw new Error(data?.message || "Failed to load bookings");
      }
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedDrivers = async () => {
    try {
      const response = await fetch(`${API_URL}/drivers?status=approved`, { credentials: "include" });
      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.drivers)) {
        setApprovedDrivers(data.drivers);
      }
    } catch (err) {
      console.error("Fetch approved drivers error:", err);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchBookings();
      fetchApprovedDrivers();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      alert("Please select an approved driver to assign.");
      return;
    }

    try {
      setAssigning(true);
      const response = await fetch(`${API_URL}/trips/${selectedBookingForAssign._id}/assign-driver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ driverId: selectedDriverId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to assign driver");
      }

      alert("✅ Driver assigned! Customer trip OTP generated.");
      setSelectedBookingForAssign(null);
      setSelectedDriverId("");
      fetchBookings();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Cancel this booking? This action will mark it as cancelled.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: "PUT",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to cancel booking");
      }

      alert("Booking cancelled.");
      fetchBookings();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Customer Bookings & Dispatch</h1>
          <p>Monitor customer reservations, assign verified drivers to confirmed trips, and manage status.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchBookings}>
            🔄 Refresh Bookings
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
            {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
              <button
                key={st}
                className={`admin-filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            Showing {bookings.length} reservations
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="admin-empty-box">
            <div className="admin-empty-icon">📋</div>
            <h3>No bookings found</h3>
            <p>No bookings match the selected filter.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Dates & Pickup</th>
                  <th>Amount</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <code>#{b._id.slice(-6).toUpperCase()}</code>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {new Date(b.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#f8fafc", display: "block" }}>{b.user?.name || "Customer"}</strong>
                      <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>{b.user?.phone || b.user?.email || "—"}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {b.car?.image ? (
                          <img src={b.car.image} alt={b.car.name} style={{ width: "36px", height: "26px", objectFit: "cover", borderRadius: "4px" }} />
                        ) : <span>🚗</span>}
                        <span>{b.car?.name || "Vehicle"}</span>
                      </div>
                    </td>
                    <td>
                      <div>{new Date(b.pickupDate).toLocaleDateString()} → {new Date(b.returnDate).toLocaleDateString()}</div>
                      <small style={{ color: "#94a3b8" }}>📍 {b.pickupLocation}</small>
                    </td>
                    <td>
                      <strong>₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}</strong>
                      <div>
                        <span className={`admin-badge ${b.paymentStatus === "paid" ? "badge-green" : "badge-yellow"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                          {b.paymentMethod?.toUpperCase()} • {b.paymentStatus?.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      {b.driver ? (
                        <div>
                          <strong style={{ color: "#86efac", fontSize: "13px" }}>✓ Assigned</strong>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{b.driver?.mobile || "Driver"}</div>
                        </div>
                      ) : (
                        <span className="admin-badge badge-gray">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${
                        b.bookingStatus === "confirmed" ? "badge-blue" :
                        b.bookingStatus === "completed" ? "badge-green" :
                        b.bookingStatus === "cancelled" ? "badge-red" : "badge-yellow"
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        {!b.driver && !["cancelled", "completed"].includes(b.bookingStatus) && (
                          <button
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => {
                              setSelectedBookingForAssign(b);
                              setSelectedDriverId("");
                            }}
                          >
                            + Assign Driver
                          </button>
                        )}

                        {["pending", "confirmed"].includes(b.bookingStatus) && (
                          <button
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => handleCancelBooking(b._id)}
                          >
                            Cancel
                          </button>
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

      {selectedBookingForAssign && (
        <div className="admin-modal-overlay" onClick={() => setSelectedBookingForAssign(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>🚗 Assign Driver to Booking #{selectedBookingForAssign._id.slice(-6).toUpperCase()}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedBookingForAssign(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "13px" }}>
                <div><strong>Customer:</strong> {selectedBookingForAssign.user?.name} ({selectedBookingForAssign.user?.phone || "No phone"})</div>
                <div><strong>Vehicle:</strong> {selectedBookingForAssign.car?.name} ({selectedBookingForAssign.car?.brand})</div>
                <div><strong>Pickup:</strong> {selectedBookingForAssign.pickupLocation}</div>
                <div><strong>Rental Dates:</strong> {new Date(selectedBookingForAssign.pickupDate).toLocaleDateString()} to {new Date(selectedBookingForAssign.returnDate).toLocaleDateString()}</div>
              </div>

              <div className="admin-form-group">
                <label>Select Approved Driver</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                  <option value="">-- Choose an approved driver --</option>
                  {approvedDrivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.user?.name || "Driver"} • {d.mobile} (Licence: {d.drivingLicence?.number || "Verified"})
                    </option>
                  ))}
                </select>
              </div>

              {approvedDrivers.length === 0 && (
                <div style={{ color: "#fca5a5", fontSize: "12.5px" }}>
                  ⚠️ No approved drivers available. Please approve pending drivers from the Drivers tab first.
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedBookingForAssign(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={assigning || !selectedDriverId}
                onClick={handleAssignDriver}
              >
                {assigning ? "Assigning..." : "Confirm & Dispatch Driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

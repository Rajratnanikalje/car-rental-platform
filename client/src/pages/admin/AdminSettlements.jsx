import { useState, useEffect } from "react";
import "./AdminPages.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function AdminSettlements() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [updatingId, setUpdatingId] = useState("");

  const fetchLedgers = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      setError("");
      const url = statusFilter === "all"
        ? `${API_URL}/finance/ledgers`
        : `${API_URL}/finance/ledgers?status=${statusFilter}`;

      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();
      if (response.ok && data.success) {
        setLedgers(Array.isArray(data.entries) ? data.entries : []);
      } else {
        throw new Error(data?.message || "Failed to load driver ledgers");
      }
    } catch (err) {
      console.error("Fetch ledgers error:", err);
      setError(err.message || "Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchLedgers, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateSettlement = async (ledgerId, newStatus) => {
    try {
      setUpdatingId(ledgerId);
      const response = await fetch(`${API_URL}/finance/ledgers/${ledgerId}/settlement-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to update settlement status");
      }

      alert(`✅ Settlement marked as ${newStatus.toUpperCase()}`);
      fetchLedgers();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Driver Ledger & Settlement Payouts</h1>
          <p>Review completed trip gross fares, calculate platform commissions, and disburse driver earnings.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchLedgers}>
            🔄 Refresh Ledgers
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
            {["all", "pending", "approved", "processing", "paid", "disputed"].map((st) => (
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
            Showing {ledgers.length} ledger entries
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Loading ledger records...
          </div>
        ) : ledgers.length === 0 ? (
          <div className="admin-empty-box">
            <div className="admin-empty-icon">💰</div>
            <h3>No ledger entries</h3>
            <p>Entries are generated automatically upon trip completion.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ledger ID</th>
                  <th>Driver</th>
                  <th>Gross Fare</th>
                  <th>RideOn Commission</th>
                  <th>Driver Payout</th>
                  <th>Method & Cash</th>
                  <th>Settlement Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.map((entry) => (
                  <tr key={entry._id}>
                    <td>
                      <code>#{entry._id.slice(-6).toUpperCase()}</code>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Booking #{entry.booking?._id?.slice(-6).toUpperCase() || "—"}
                      </div>
                    </td>
                    <td>
                      <strong>Driver #{entry.driver?._id?.slice(-6).toUpperCase()}</strong>
                      <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>{entry.driver?.mobile || "—"}</div>
                    </td>
                    <td>
                      <strong>₹{Number(entry.grossAmount || 0).toLocaleString("en-IN")}</strong>
                    </td>
                    <td style={{ color: "#a78bfa" }}>
                      <strong>₹{Number(entry.amountPayableToRideOn || 0).toLocaleString("en-IN")}</strong>
                    </td>
                    <td style={{ color: "#4ade80" }}>
                      <strong>₹{Number(entry.amountPayableToDriver || 0).toLocaleString("en-IN")}</strong>
                    </td>
                    <td>
                      <span className="admin-badge badge-gray">
                        {entry.paymentMethod?.toUpperCase()}
                      </span>
                      {entry.paymentMethod === "cash" && (
                        <div style={{ fontSize: "11px", color: entry.cashConfirmedAt ? "#4ade80" : "#fbbf24", marginTop: "2px" }}>
                          {entry.cashConfirmedAt ? "✓ Cash Collected" : "⏳ Cash Pending"}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${
                        entry.settlementStatus === "paid" ? "badge-green" :
                        entry.settlementStatus === "approved" ? "badge-blue" :
                        entry.settlementStatus === "disputed" ? "badge-red" : "badge-yellow"
                      }`}>
                        {entry.settlementStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        {entry.settlementStatus === "pending" && (
                          <button
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            disabled={updatingId === entry._id}
                            onClick={() => updateSettlement(entry._id, "approved")}
                          >
                            Approve
                          </button>
                        )}
                        {entry.settlementStatus === "approved" && (
                          <button
                            className="admin-btn admin-btn-sm admin-btn-success"
                            disabled={updatingId === entry._id}
                            onClick={() => updateSettlement(entry._id, "paid")}
                          >
                            Mark Paid
                          </button>
                        )}
                        {entry.settlementStatus !== "paid" && entry.settlementStatus !== "disputed" && (
                          <button
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            disabled={updatingId === entry._id}
                            onClick={() => updateSettlement(entry._id, "disputed")}
                          >
                            Dispute
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
    </div>
  );
}

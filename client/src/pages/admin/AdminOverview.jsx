import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminPages.css";


export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    activeTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    pendingSettlements: 0,
    todayRevenue: 0,
    totalCommission: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverviewData = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      setError("");

      const [statsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/finance/stats`, { credentials: "include" }),
        fetch(`${API_URL}/bookings`, { credentials: "include" }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        if (bookingsData.success && Array.isArray(bookingsData.bookings)) {
          setRecentBookings(bookingsData.bookings.slice(0, 5));
        }
      }
    } catch (err) {
      console.error("Overview data fetch error:", err);
      setError("Unable to load live dashboard stats. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchOverviewData, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Welcome back, {user?.name || "Administrator"} 👋</h1>
          <p>Executive overview of fleet operations, driver verifications, and financial performance.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchOverviewData} disabled={loading}>
            🔄 Refresh Live Stats
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", padding: "14px 18px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          {error}
        </div>
      )}

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper stat-icon-blue">🚗</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Fleet Vehicles</span>
            <strong className="admin-stat-value">{loading ? "..." : stats.totalVehicles}</strong>
            <span className="admin-stat-sub">Total registered</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper stat-icon-green">🪪</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Approved Drivers</span>
            <strong className="admin-stat-value">{loading ? "..." : stats.totalDrivers}</strong>
            <span className="admin-stat-sub">Verified & active</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper stat-icon-purple">👥</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Users</span>
            <strong className="admin-stat-value">{loading ? "..." : stats.totalUsers}</strong>
            <span className="admin-stat-sub">Registered accounts</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper stat-icon-amber">⚡</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Active Trips</span>
            <strong className="admin-stat-value">{loading ? "..." : stats.activeTrips}</strong>
            <span className="admin-stat-sub">Currently on road</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper stat-icon-cyan">🏁</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Completed Trips</span>
            <strong className="admin-stat-value">{loading ? "..." : stats.completedTrips}</strong>
            <span className="admin-stat-sub">Successfully fulfilled</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper stat-icon-green">💰</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Today's Revenue</span>
            <strong className="admin-stat-value">₹{loading ? "..." : Number(stats.todayRevenue || 0).toLocaleString("en-IN")}</strong>
            <span className="admin-stat-sub">Received payments</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper stat-icon-purple">📈</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">RideOn Commission</span>
            <strong className="admin-stat-value">₹{loading ? "..." : Number(stats.totalCommission || 0).toLocaleString("en-IN")}</strong>
            <span className="admin-stat-sub">Total earned fees</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper stat-icon-amber">⏳</div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Pending Settlements</span>
            <strong className="admin-stat-value">{loading ? "..." : stats.pendingSettlements}</strong>
            <span className="admin-stat-sub">Awaiting admin review</span>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2>⚡ Quick Administrative Actions</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
          <Link to="/admin/vehicles" className="admin-btn admin-btn-secondary" style={{ padding: "14px", justifyContent: "flex-start", textDecoration: "none" }}>
            <span style={{ fontSize: "20px" }}>🚗</span>
            <div>
              <strong style={{ display: "block", color: "#f8fafc" }}>Fleet Management</strong>
              <small style={{ color: "#94a3b8" }}>Add cars & toggle availability</small>
            </div>
          </Link>

          <Link to="/admin/drivers" className="admin-btn admin-btn-secondary" style={{ padding: "14px", justifyContent: "flex-start", textDecoration: "none" }}>
            <span style={{ fontSize: "20px" }}>🪪</span>
            <div>
              <strong style={{ display: "block", color: "#f8fafc" }}>Driver Verifications</strong>
              <small style={{ color: "#94a3b8" }}>Review licences & bank proofs</small>
            </div>
          </Link>

          <Link to="/admin/bookings" className="admin-btn admin-btn-secondary" style={{ padding: "14px", justifyContent: "flex-start", textDecoration: "none" }}>
            <span style={{ fontSize: "20px" }}>📋</span>
            <div>
              <strong style={{ display: "block", color: "#f8fafc" }}>Assign Bookings</strong>
              <small style={{ color: "#94a3b8" }}>Dispatch approved drivers</small>
            </div>
          </Link>

          <Link to="/admin/settlements" className="admin-btn admin-btn-secondary" style={{ padding: "14px", justifyContent: "flex-start", textDecoration: "none" }}>
            <span style={{ fontSize: "20px" }}>💰</span>
            <div>
              <strong style={{ display: "block", color: "#f8fafc" }}>Driver Settlements</strong>
              <small style={{ color: "#94a3b8" }}>Process ledger payouts</small>
            </div>
          </Link>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2>🕒 Recent Customer Bookings</h2>
          <Link to="/admin/bookings" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ textDecoration: "none" }}>
            View All ({stats.totalBookings || 0}) →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="admin-empty-box">
            <div className="admin-empty-icon">📋</div>
            <h3>No bookings recorded yet</h3>
            <p>New reservations from customers will appear here in real-time.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Pickup Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b._id}>
                    <td><code>#{b._id.slice(-6).toUpperCase()}</code></td>
                    <td>
                      <strong>{b.user?.name || "Customer"}</strong>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{b.user?.phone || b.user?.email || "—"}</div>
                    </td>
                    <td>{b.car?.name || "Vehicle"}</td>
                    <td>{new Date(b.pickupDate).toLocaleDateString()}</td>
                    <td><strong>₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}</strong></td>
                    <td>
                      <span className={`admin-badge ${b.paymentStatus === "paid" ? "badge-green" : "badge-yellow"}`}>
                        {b.paymentStatus || "pending"}
                      </span>
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

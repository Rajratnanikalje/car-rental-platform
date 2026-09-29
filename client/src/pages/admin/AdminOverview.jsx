import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./AdminPages.css";

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");
const formatCurrency = (value) => `₹${formatNumber(value)}`;
const bookingStatusClass = (status) => ["confirmed", "completed"].includes(status) ? "success" : status === "cancelled" ? "danger" : "warning";

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsResponse, bookingsResponse, tripsResponse] = await Promise.all([
        fetch(`${API_URL}/finance/stats`, { credentials: "include" }),
        fetch(`${API_URL}/bookings`, { credentials: "include" }),
        fetch(`${API_URL}/trips`, { credentials: "include" }),
      ]);
      const [statsData, bookingsData, tripsData] = await Promise.all([statsResponse.json(), bookingsResponse.json(), tripsResponse.json()]);
      if (statsResponse.ok && statsData.success) setStats(statsData.stats || {});
      if (bookingsResponse.ok && bookingsData.success) setBookings((bookingsData.bookings || []).slice(0, 5));
      if (tripsResponse.ok && tripsData.success) setTrips((tripsData.trips || []).slice(0, 4));
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadDashboard(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const display = (key) => loading ? "—" : formatNumber(stats[key]);
  const metrics = [
    ["Available vehicles", display("availableVehicles"), "Approved and online", "▰", "blue"],
    ["Approved drivers", display("totalDrivers"), "Eligible for driver operations", "♙", "orange"],
    ["Customers", display("totalCustomers"), "Registered customer accounts", "▣", "purple"],
    ["Active trips", display("activeTrips"), "Currently in progress", "◉", "green"],
  ];
  const miniMetrics = [
    ["Pending vehicle reviews", display("pendingVehicles"), "Requires review", "warning"],
    ["Completed trips", display("completedTrips"), "All-time completed", "success"],
    ["Today's revenue", loading ? "—" : formatCurrency(stats.todayRevenue), "Payments received today", "info"],
    ["Pending payouts", loading ? "?" : formatCurrency(stats.driverPayoutsPending), "Driver balances awaiting settlement", "danger"],
  ];

  return <div className="reference-dashboard">
    <section className="dashboard-intro"><div><h1>Dashboard</h1><p>Welcome back, {user?.name || "Admin"}. Live operational data for RideOn.</p></div><button className="dashboard-refresh" onClick={loadDashboard} disabled={loading}>Refresh</button></section>
    <section className="dashboard-metrics">{metrics.map(([label, number, caption, icon, tone]) => <article className="metric-card" key={label}><div className={`metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{number}</strong><small>{caption}</small></div></article>)}</section>
    <section className="dashboard-mini-metrics">{miniMetrics.map(([label, number, caption, tone]) => <article className="mini-metric" key={label}><span>{label}</span><strong>{number}</strong><small className={tone}>{caption}</small></article>)}</section>
    <section className="dashboard-main-grid">
      <article className="white-panel bookings-panel"><PanelTitle title="Recent bookings" to="/admin/bookings" />{bookings.length ? <div className="reference-table-wrap"><table className="reference-table"><thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Amount</th><th>Status</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking._id}><td>#{booking._id?.slice(-5).toUpperCase()}</td><td><b>{booking.user?.name || "Customer"}</b></td><td>{booking.car?.name || "Private car"}</td><td>{formatCurrency(booking.totalAmount)}</td><td><span className={`reference-badge ${bookingStatusClass(booking.bookingStatus)}`}>{booking.bookingStatus || "pending"}</span></td></tr>)}</tbody></table></div> : <div className="reference-empty">No bookings yet.</div>}</article>
      <article className="white-panel verification-panel"><PanelTitle title="Driver verification" to="/admin/drivers" /><div className="donut-wrap"><div className="donut"><div><strong>{display("totalDrivers")}</strong><span>Approved</span></div></div><div className="legend"><p><i className="approved" /> Approved <b>{display("totalDrivers")}</b></p><p><i className="pending" /> Pending <b>{display("pendingDrivers")}</b></p><p><i className="review" /> Under review <b>{display("underReviewDrivers")}</b></p><p><i className="rejected" /> Rejected <b>{display("rejectedDrivers")}</b></p></div></div></article>
      <article className="white-panel trips-panel"><PanelTitle title="Recent trips" to="/admin/trips" />{trips.length ? <div className="trip-list">{trips.map((trip) => <p key={trip._id}><span><b>{trip.booking?.user?.name || "Customer"} · {trip.booking?.car?.name || "Vehicle"}</b><small>{trip.status.replaceAll("_", " ")}{trip.fraudFlags?.length ? ` · ${trip.fraudFlags.length} risk alert(s)` : ""}</small></span><Link to="/admin/trips">View</Link></p>)}</div> : <div className="reference-empty">No trips yet.</div>}</article>
      <article className="white-panel chart-panel"><PanelTitle title="Operations alerts" to="/admin/fraud" /><div className="trip-list"><p><span><b>Risk alerts</b><small>Trips flagged for review</small></span><Link to="/admin/fraud">{display("riskAlerts")} open</Link></p><p><span><b>RideOn commission</b><small>Recorded from completed-trip ledgers</small></span><Link to="/admin/settlements">{loading ? "—" : formatCurrency(stats.totalCommission)}</Link></p><p><span><b>Seat rides</b><small>Manage schedules and capacity</small></span><Link to="/admin/seat-rides">Open</Link></p></div></article>
    </section>
    <section className="quick-actions white-panel"><PanelTitle title="Quick actions" /><div className="action-grid"><Quick to="/admin/drivers" icon="♙" title="Review drivers" text="Verify applications" /><Quick to="/admin/vehicles" icon="▰" title="Review vehicles" text="Approve fleet vehicles" /><Quick to="/admin/bookings" icon="▤" title="View bookings" text="Check all reservations" /><Quick to="/admin/settings" icon="⚙" title="Platform settings" text="Configure commission rules" /></div></section>
  </div>;
}

function PanelTitle({ title, to }) { return <div className="reference-panel-title"><h2>{title}</h2>{to && <Link to={to}>View all →</Link>}</div>; }
function Quick({ to, icon, title, text }) { return <Link className="quick-action" to={to}><i>{icon}</i><span><b>{title}</b><small>{text}</small></span></Link>; }

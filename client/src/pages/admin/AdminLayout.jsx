import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } catch (err) {
      console.error("Admin logout error:", err);
      navigate("/admin/login", { replace: true });
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  const getSectionTitle = () => {
    const path = location.pathname;
    if (path.includes("/admin/vehicles")) return "Fleet & Vehicles";
    if (path.includes("/admin/service-areas")) return "Service Areas";
    if (path.includes("/admin/drivers")) return "Driver Verification & Management";
    if (path.includes("/admin/bookings")) return "Booking Management";
    if (path.includes("/admin/trips")) return "Trips & Safety Oversight";
    if (path.includes("/admin/seat-rides")) return "Scheduled Seat Rides & Manifests";
    if (path.includes("/admin/settlements")) return "Finance & Driver Settlements";
    if (path.includes("/admin/fraud")) return "Trip Safety & Fraud Disputes";
    if (path.includes("/admin/audit-logs")) return "System Audit & Security Logs";
    if (path.includes("/admin/settings")) return "Platform Commission & Settings";
    if (path.includes("/admin/cms")) return "Website Content Management (CMS)";
    return "Executive Dashboard";
  };

  return (
    <div className="admin-layout-root">
      {sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={closeSidebar} />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Link to="/admin/dashboard" className="admin-brand-link" onClick={closeSidebar}>
            <span className="admin-sidebar-logo">R</span>
            <div className="admin-sidebar-title">
              <h2>Ride<span>On</span></h2>
              <span className="admin-panel-tag">CONTROL CENTER</span>
            </div>
          </Link>
          <button className="admin-sidebar-close" onClick={closeSidebar} aria-label="Close menu">
            ✕
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-group">
            <span className="admin-nav-group-label">OPERATIONS</span>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">📊</span>
              <span className="admin-nav-text">Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/drivers"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">🪪</span>
              <span className="admin-nav-text">Drivers</span>
            </NavLink>

            <NavLink
              to="/admin/vehicles"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">🚗</span>
              <span className="admin-nav-text">Vehicles</span>
            </NavLink>

            <NavLink to="/admin/service-areas" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`} onClick={closeSidebar}>
              <span className="admin-nav-icon">⌖</span><span className="admin-nav-text">Service Areas</span>
            </NavLink>

            <NavLink
              to="/admin/bookings"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">📋</span>
              <span className="admin-nav-text">Bookings</span>
            </NavLink>

            <NavLink
              to="/admin/trips"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">🗺️</span>
              <span className="admin-nav-text">Trips & Safety</span>
            </NavLink>

            <NavLink
              to="/admin/seat-rides"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">💺</span>
              <span className="admin-nav-text">Seat Rides</span>
            </NavLink>

            <NavLink
              to="/admin/settlements"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">💰</span>
              <span className="admin-nav-text">Settlements</span>
            </NavLink>

            <NavLink
              to="/admin/fraud"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">🛡️</span>
              <span className="admin-nav-text">Fraud & Disputes</span>
            </NavLink>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-group-label">CMS / WEBSITE</span>
            <NavLink
              to="/admin/cms"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">🖥️</span>
              <span className="admin-nav-text">Site Content (CMS)</span>
            </NavLink>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-group-label">SYSTEM</span>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">⚙️</span>
              <span className="admin-nav-text">Platform Settings</span>
            </NavLink>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-group-label">SECURITY / AUDIT</span>
            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={closeSidebar}
            >
              <span className="admin-nav-icon">📜</span>
              <span className="admin-nav-text">Audit Logs</span>
            </NavLink>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="admin-user-info">
              <strong className="admin-user-name">{user?.name || "Administrator"}</strong>
              <span className="admin-user-role">Super Admin</span>
            </div>
          </div>

          <button onClick={handleLogout} className="admin-logout-btn">
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
            <div className="admin-breadcrumbs">
              <span className="breadcrumb-root">Admin</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{getSectionTitle()}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-status-pill">
              <span className="status-indicator-dot" />
              <span>System Online</span>
            </div>

            <Link to="/" className="admin-client-site-btn" target="_blank" rel="noopener noreferrer">
              <span>🌐</span>
              <span className="site-btn-text">Customer Site</span>
            </Link>
          </div>
        </header>

        <main className="admin-content-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Overview stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    activeTrips: 0,
    completedTrips: 0,
    todayRevenue: 0,
  });

  // Drivers list
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverStatus, setSelectedDriverStatus] = useState("all");

  // Ledgers list
  const [ledgers, setLedgers] = useState([]);
  const [selectedLedgerStatus, setSelectedLedgerStatus] = useState("pending");

  // Settings
  const [settings, setSettings] = useState({
    commissionPercentage: 0,
    fixedCommission: 0,
    platformFee: 0,
  });

  const [settingsForm, setSettingsForm] = useState({
    commissionPercentage: 0,
    fixedCommission: 0,
    platformFee: 0,
  });

  // Only admin users can access the dashboard.
  useEffect(() => {
    if (!authLoading && (!isLoggedIn || user?.role !== "admin")) {
      navigate("/");
    }
  }, [authLoading, isLoggedIn, user?.role, navigate]);

  // =========================
  // FETCH DRIVERS
  // =========================
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const url =
        selectedDriverStatus === "all"
          ? `${API_URL}/drivers`
          : `${API_URL}/drivers?status=${selectedDriverStatus}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
      }
    } catch (err) {
      console.error("Fetch Drivers Error:", err);
      setError("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH LEDGERS
  // =========================
  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const url = `${API_URL}/finance/ledgers?status=${selectedLedgerStatus}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLedgers(Array.isArray(data.entries) ? data.entries : []);
      }
    } catch (err) {
      console.error("Fetch Ledgers Error:", err);
      setError("Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH SETTINGS
  // =========================
  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/finance/settings`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success && data.settings) {
        setSettings(data.settings);
        setSettingsForm(data.settings);
      }
    } catch (err) {
      console.error("Fetch Settings Error:", err);
    }
  };

  // =========================
  // HANDLE SETTINGS CHANGE
  // =========================
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // =========================
  // SAVE SETTINGS
  // =========================
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/finance/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(settingsForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save settings");
      }

      setSettings(data.settings);
      alert("Settings updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UPDATE DRIVER STATUS
  // =========================
  const updateDriverStatus = async (driverId, newStatus, reviewNote = "") => {
    try {
      const response = await fetch(`${API_URL}/drivers/${driverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, reviewNote }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update driver status");
      }

      alert("Driver status updated!");
      fetchDrivers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // =========================
  // UPDATE LEDGER SETTLEMENT
  // =========================
  const updateSettlement = async (ledgerId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/finance/ledgers/${ledgerId}/settlement-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update settlement");
      }

      alert("Settlement status updated!");
      fetchLedgers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // =========================
  // LOAD DATA ON TAB CHANGE
  // =========================
  useEffect(() => {
    if (activeTab === "drivers") {
      fetchDrivers();
    } else if (activeTab === "ledgers") {
      fetchLedgers();
    } else if (activeTab === "settings") {
      fetchSettings();
    }
  }, [activeTab, selectedDriverStatus, selectedLedgerStatus]);

  if (authLoading) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-container">
          <div className="book-spinner" />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>🎛️ Admin Dashboard</h1>
          <p>Manage drivers, settlements, and platform settings</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* =========================
            TABS
        ========================== */}
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button
            className={`tab-button ${activeTab === "drivers" ? "active" : ""}`}
            onClick={() => setActiveTab("drivers")}
          >
            👥 Drivers
          </button>
          <button
            className={`tab-button ${activeTab === "ledgers" ? "active" : ""}`}
            onClick={() => setActiveTab("ledgers")}
          >
            📑 Settlements
          </button>
          <button
            className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* =========================
            OVERVIEW TAB
        ========================== */}
        {activeTab === "overview" && (
          <section className="tab-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats.totalUsers}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🚗</div>
                <div className="stat-info">
                  <h3>Approved Drivers</h3>
                  <p className="stat-value">{stats.totalDrivers}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🚙</div>
                <div className="stat-info">
                  <h3>Total Vehicles</h3>
                  <p className="stat-value">{stats.totalVehicles}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <h3>Active Trips</h3>
                  <p className="stat-value">{stats.activeTrips}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Completed Trips</h3>
                  <p className="stat-value">{stats.completedTrips}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>Today's Revenue</h3>
                  <p className="stat-value">₹{stats.todayRevenue}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================
            DRIVERS TAB
        ========================== */}
        {activeTab === "drivers" && (
          <section className="tab-content">
            <div className="filters">
              <select
                value={selectedDriverStatus}
                onChange={(e) => setSelectedDriverStatus(e.target.value)}
              >
                <option value="all">All Drivers</option>
                <option value="pending">Pending Review</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {loading ? (
              <div className="book-spinner" />
            ) : drivers.length === 0 ? (
              <p className="no-data">No drivers found</p>
            ) : (
              <div className="drivers-list">
                {drivers.map((driver) => (
                  <div key={driver._id} className="driver-card glass-card">
                    <div className="driver-info">
                      <h3>{driver.user?.name || "Unknown"}</h3>
                      <p>Email: {driver.user?.email}</p>
                      <p>Mobile: {driver.mobile}</p>
                      <p>
                        Status:{" "}
                        <span className={`status-badge status-${driver.status}`}>
                          {driver.status}
                        </span>
                      </p>
                    </div>

                    {driver.status === "pending" && (
                      <div className="driver-actions">
                        <button
                          onClick={() => updateDriverStatus(driver._id, "under_review")}
                          className="btn-primary"
                        >
                          Review
                        </button>
                      </div>
                    )}

                    {driver.status === "under_review" && (
                      <div className="driver-actions">
                        <button
                          onClick={() => updateDriverStatus(driver._id, "approved")}
                          className="btn-success"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateDriverStatus(driver._id, "rejected", "Does not meet criteria")}
                          className="btn-danger"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================
            SETTLEMENTS TAB
        ========================== */}
        {activeTab === "ledgers" && (
          <section className="tab-content">
            <div className="filters">
              <select
                value={selectedLedgerStatus}
                onChange={(e) => setSelectedLedgerStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>

            {loading ? (
              <div className="book-spinner" />
            ) : ledgers.length === 0 ? (
              <p className="no-data">No ledger entries found</p>
            ) : (
              <div className="ledgers-list">
                {ledgers.map((ledger) => (
                  <div key={ledger._id} className="ledger-card glass-card">
                    <div className="ledger-info">
                      <h3>₹{ledger.grossAmount}</h3>
                      <p>Driver: {ledger.driver?.mobile}</p>
                      <p>Commission: ₹{ledger.commissionAmount}</p>
                      <p>Driver Earnings: ₹{ledger.driverEarnings}</p>
                      <p>Payment Method: {ledger.paymentMethod}</p>
                      <p>
                        Settlement Status:{" "}
                        <span className={`status-badge status-${ledger.settlementStatus}`}>
                          {ledger.settlementStatus}
                        </span>
                      </p>
                    </div>

                    {ledger.settlementStatus === "pending" && (
                      <div className="ledger-actions">
                        <button
                          onClick={() => updateSettlement(ledger._id, "approved")}
                          className="btn-success"
                        >
                          Approve
                        </button>
                      </div>
                    )}

                    {ledger.settlementStatus === "approved" && (
                      <div className="ledger-actions">
                        <button
                          onClick={() => updateSettlement(ledger._id, "processing")}
                          className="btn-primary"
                        >
                          Processing
                        </button>
                      </div>
                    )}

                    {ledger.settlementStatus === "processing" && (
                      <div className="ledger-actions">
                        <button
                          onClick={() => updateSettlement(ledger._id, "paid")}
                          className="btn-success"
                        >
                          Mark Paid
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================
            SETTINGS TAB
        ========================== */}
        {activeTab === "settings" && (
          <section className="tab-content">
            <div className="settings-form glass-card">
              <h2>Platform Financial Settings</h2>

              <div className="form-group">
                <label htmlFor="commissionPercentage">Commission Percentage (%)</label>
                <input
                  type="number"
                  id="commissionPercentage"
                  name="commissionPercentage"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settingsForm.commissionPercentage}
                  onChange={handleSettingsChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fixedCommission">Fixed Commission (₹)</label>
                <input
                  type="number"
                  id="fixedCommission"
                  name="fixedCommission"
                  min="0"
                  step="1"
                  value={settingsForm.fixedCommission}
                  onChange={handleSettingsChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="platformFee">Platform Fee (₹)</label>
                <input
                  type="number"
                  id="platformFee"
                  name="platformFee"
                  min="0"
                  step="1"
                  value={settingsForm.platformFee}
                  onChange={handleSettingsChange}
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="shiny-button"
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>

              <div className="settings-info">
                <p>
                  <strong>Note:</strong> These settings apply to all future bookings and affect
                  how driver commissions are calculated.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;

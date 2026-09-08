import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DriverDashboard.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function DriverDashboard() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("earnings");
  const [loading, setLoading] = useState(false);

  // Earnings
  const [ledgerData, setLedgerData] = useState({
    entries: [],
    totals: {
      grossAmount: 0,
      commissionPayable: 0,
      driverPayout: 0,
    },
  });

  // =========================
  // FETCH DRIVER EARNINGS
  // =========================
  const fetchEarnings = async () => {
    try {
      setTimeout(() => setLoading(true), 0);

      const response = await fetch(`${API_URL}/finance/driver-ledger`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLedgerData(data);
      }
    } catch (err) {
      console.error("Fetch Earnings Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === "driver") {
      const timer = window.setTimeout(fetchEarnings, 0);
      return () => window.clearTimeout(timer);
    }
  }, [authLoading, user]);

  // Redirect if not driver
  if (!authLoading && (!isLoggedIn || user?.role !== "driver")) {
    return (
      <main className="driver-dashboard-page">
        <div className="driver-container">
          <div className="not-driver-message">
            <h1>Driver Dashboard</h1>
            <p>This page is only accessible to approved drivers.</p>
            <Link to="/driver-register" className="shiny-button">
              Become a Driver
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="driver-dashboard-page">
        <div className="driver-container">
          <div className="book-spinner" />
        </div>
      </main>
    );
  }

  return (
    <main className="driver-dashboard-page">
      <div className="driver-container">
        <div className="driver-header">
          <h1>👨‍✈️ Driver Dashboard</h1>
          <p>Manage your earnings, trips, and payout account</p>
        </div>

        {/* =========================
            TABS
        ========================== */}
        <div className="driver-tabs">
          <button
            className={`tab-button ${activeTab === "earnings" ? "active" : ""}`}
            onClick={() => setActiveTab("earnings")}
          >
            💰 Earnings
          </button>
          <button
            className={`tab-button ${activeTab === "trips" ? "active" : ""}`}
            onClick={() => setActiveTab("trips")}
          >
            🚗 Trips
          </button>
          <button
            className={`tab-button ${activeTab === "vehicle" ? "active" : ""}`}
            onClick={() => setActiveTab("vehicle")}
          >
            🚙 Vehicle
          </button>
          <button
            className={`tab-button ${activeTab === "payout" ? "active" : ""}`}
            onClick={() => setActiveTab("payout")}
          >
            🏦 Payout Account
          </button>
        </div>

        {/* =========================
            EARNINGS TAB
        ========================== */}
        {activeTab === "earnings" && (
          <section className="tab-content">
            {/* Stats Overview */}
            <div className="earnings-stats">
              <div className="stat-card glass-card">
                <div className="stat-label">Gross Earnings</div>
                <div className="stat-value">₹{ledgerData.totals.grossAmount}</div>
              </div>

              <div className="stat-card glass-card">
                <div className="stat-label">Commission Payable</div>
                <div className="stat-value">₹{ledgerData.totals.commissionPayable}</div>
              </div>

              <div className="stat-card glass-card">
                <div className="stat-label">Your Payout</div>
                <div className="stat-value">₹{ledgerData.totals.driverPayout}</div>
              </div>
            </div>

            {/* Earnings List */}
            {loading ? (
              <div className="book-spinner" />
            ) : ledgerData.entries.length === 0 ? (
              <p className="no-data">No earnings yet. Start accepting trips!</p>
            ) : (
              <div className="earnings-list">
                <h3>Earnings History</h3>
                {ledgerData.entries.map((entry) => (
                  <div key={entry._id} className="earning-card glass-card">
                    <div className="earning-info">
                      <div className="earning-amount">₹{entry.grossAmount}</div>
                      <div className="earning-details">
                        <p>Commission: ₹{entry.commissionAmount}</p>
                        <p>Your Share: ₹{entry.driverEarnings}</p>
                        <p>
                          Payment: {entry.paymentMethod === "cash" ? "💵 Cash" : "💳 Online"}
                        </p>
                        <p>
                          Status:{" "}
                          <span className={`status-badge status-${entry.settlementStatus}`}>
                            {entry.settlementStatus}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =========================
            TRIPS TAB
        ========================== */}
        {activeTab === "trips" && (
          <section className="tab-content">
            <div className="coming-soon glass-card">
              <h3>Trip Management</h3>
              <p>View and manage your assigned trips, start trips with customer OTP verification, and submit odometer readings.</p>
              <Link
                to="/driver-trips"
                className="shiny-button"
                style={{ display: "inline-block", marginTop: "16px" }}
              >
                Go to Trips Console →
              </Link>
            </div>
          </section>
        )}

        {/* =========================
            VEHICLE TAB
        ========================== */}
        {activeTab === "vehicle" && (
          <section className="tab-content">
            <div className="coming-soon glass-card">
              <h3>Vehicle Management</h3>
              <p>Manage your vehicle details, documents, availability, and publish seat rides.</p>
              <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Coming soon: Vehicle dashboard</p>
            </div>
          </section>
        )}

        {/* =========================
            PAYOUT TAB
        ========================== */}
        {activeTab === "payout" && (
          <section className="tab-content">
            <div className="coming-soon glass-card">
              <h3>Payout Account</h3>
              <p>View and update your bank account details for receiving settlements.</p>
              <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Coming soon: Payout account management</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default DriverDashboard;

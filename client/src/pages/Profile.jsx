import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function Profile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      setName(user.name || "");
      setPhone(user.phone || "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to update profile");
      }

      updateUser(data.user);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const initial = (user?.name?.trim()?.[0] || "U").toUpperCase();
  const roleLabel =
    user?.role === "driver"
      ? "Driver Partner"
      : user?.role === "admin"
        ? "Platform Administrator"
        : "Customer Account";

  return (
    <main className="profile-page">
      <div className="profile-glow profile-glow-purple" />
      <div className="profile-glow profile-glow-blue" />

      <div className="profile-container">
        {/* =========================
            HEADER
        ========================== */}
        <section className="profile-header">
          <div>
            <span className="profile-eyebrow">Account</span>

            <h1>
              My <span>Profile</span>
            </h1>

            <p>
              Manage your personal information and keep your account
              details up to date.
            </p>
          </div>

          <Link to="/my-bookings" className="shiny-button profile-bookings-btn">
            My Bookings →
          </Link>
        </section>

        {/* =========================
            PROFILE LAYOUT
        ========================== */}
        <section className="profile-layout">
          {/* =========================
              PROFILE CARD
          ========================== */}
          <aside className="profile-sidebar glass-card">
            <div className="profile-avatar">
              <span>{initial}</span>
            </div>

            <h2>{user?.name || "User"}</h2>

            <p className="profile-role">{roleLabel}</p>

            <div className="profile-status">
              <span />
              Account Active
            </div>

            <div className="profile-sidebar-divider" />

            <div className="profile-side-links">
              <a href="#personal-info" className="profile-side-link active">
                <span>👤</span>
                Personal Information
              </a>

              <a href="#contact-info" className="profile-side-link">
                <span>📱</span>
                Contact Details
              </a>

              <Link to="/my-bookings" className="profile-side-link">
                <span>📅</span>
                My Bookings
              </Link>
            </div>
          </aside>

          {/* =========================
              MAIN
          ========================== */}
          <div className="profile-main">
            {message.text && (
              <div
                className={`alert ${
                  message.type === "success" ? "alert-success" : "alert-error"
                }`}
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  textAlign: "center",
                  background:
                    message.type === "success"
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(239, 68, 68, 0.15)",
                  border: `1px solid ${
                    message.type === "success"
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(239, 68, 68, 0.3)"
                  }`,
                  color: message.type === "success" ? "#dcfce7" : "#fee2e2",
                }}
              >
                {message.text}
              </div>
            )}

            {/* Personal Information */}
            <section
              id="personal-info"
              className="profile-section glass-card"
            >
              <div className="profile-section-header">
                <div>
                  <span>Personal Information</span>
                  <h2>Your details</h2>
                </div>

                <span className="profile-section-number">01</span>
              </div>

              <form className="profile-form" onSubmit={handleSave}>
                <div className="profile-form-group">
                  <label htmlFor="profile-name">Full name</label>

                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    className="glass-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="profile-email">Email address</label>

                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    className="glass-input"
                    value={user?.email || ""}
                    disabled
                    style={{ opacity: 0.7, cursor: "not-allowed" }}
                    autoComplete="email"
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>
                    Email is associated with your account and cannot be changed.
                  </small>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="profile-phone">Mobile number</label>

                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    className="glass-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter mobile number"
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="shiny-button"
                    disabled={saving}
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>

            {/* Contact Details */}
            <section
              id="contact-info"
              className="profile-section glass-card"
            >
              <div className="profile-section-header">
                <div>
                  <span>Contact Details</span>
                  <h2>Communication</h2>
                </div>

                <span className="profile-section-number">02</span>
              </div>

              <div className="contact-cards">
                <div className="contact-card">
                  <div className="contact-card-icon">📧</div>

                  <div>
                    <span>Email</span>
                    <strong>{user?.email || "—"}</strong>
                  </div>
                </div>

                <div className="contact-card">
                  <div className="contact-card-icon">📱</div>

                  <div>
                    <span>Mobile</span>
                    <strong>{user?.phone || phone || "Not added yet"}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Account Information */}
            <section className="profile-section glass-card">
              <div className="profile-section-header">
                <div>
                  <span>Account</span>
                  <h2>Account overview</h2>
                </div>

                <span className="profile-section-number">03</span>
              </div>

              <div className="account-overview-grid">
                <div className="overview-item">
                  <span>Account type</span>
                  <strong style={{ textTransform: "capitalize" }}>
                    {user?.role || "Customer"}
                  </strong>
                </div>

                <div className="overview-item">
                  <span>Bookings</span>
                  <strong>
                    <Link to="/my-bookings">
                      View bookings
                    </Link>
                  </strong>
                </div>

                <div className="overview-item">
                  <span>Security</span>
                  <strong className="security-active">
                    Protected
                  </strong>
                </div>

                <div className="overview-item">
                  <span>Status</span>
                  <strong className="account-active">
                    Active
                  </strong>
                </div>
              </div>
            </section>

            {/* Important Note */}
            <section className="profile-note glass-card">
              <div className="profile-note-icon">ℹ️</div>

              <div>
                <h3>Keep your information updated</h3>

                <p>
                  Make sure your contact information is accurate so
                  important booking-related communication can reach you.
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Profile;
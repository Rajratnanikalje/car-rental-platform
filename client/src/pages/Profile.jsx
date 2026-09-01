import { Link } from "react-router-dom";
import "./Profile.css";

function Profile() {
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
              <span>R</span>
            </div>

            <h2>Rajratna Nikalje</h2>

            <p className="profile-role">Customer Account</p>

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

              <form className="profile-form">
                <div className="profile-form-group">
                  <label htmlFor="profile-name">Full name</label>

                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    className="glass-input"
                    defaultValue="Rajratna Nikalje"
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
                    defaultValue="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="profile-phone">Mobile number</label>

                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    className="glass-input"
                    defaultValue=""
                    placeholder="Enter mobile number"
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="profile-city">City</label>

                  <input
                    id="profile-city"
                    name="city"
                    type="text"
                    className="glass-input"
                    placeholder="Enter your city"
                    autoComplete="address-level2"
                  />
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="shiny-button"
                  >
                    Save Changes
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
                    <strong>you@example.com</strong>
                  </div>
                </div>

                <div className="contact-card">
                  <div className="contact-card-icon">📱</div>

                  <div>
                    <span>Mobile</span>
                    <strong>Not added yet</strong>
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
                  <strong>Customer</strong>
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
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name || !email || !password) {
      setError("Name, email and password are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Registration failed. Please try again."
        );
      }

      setSuccess(
        data?.message || "Registration successful. Redirecting to login..."
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            registered: true,
            email,
          },
        });
      }, 1000);
    } catch (submitError) {
      console.error("Register Error:", submitError);

      setError(
        submitError?.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page register-page">
      <div className="auth-glow auth-glow-purple" />
      <div className="auth-glow auth-glow-blue" />

      <section className="auth-container register-container">
        {/* =========================
            INTRO
        ========================== */}
        <div className="auth-intro">
          <span className="auth-eyebrow">Join RideOn</span>

          <h1>
            Start your journey
            <span> with us.</span>
          </h1>

          <p>
            Create your RideOn account to book cars, manage reservations
            and keep your rental experience simple.
          </p>

          <div className="auth-benefits">
            <div className="auth-benefit">
              <span className="auth-benefit-icon">🚘</span>

              <div>
                <strong>Easy car booking</strong>
                <p>
                  Find and reserve the right car for your journey.
                </p>
              </div>
            </div>

            <div className="auth-benefit">
              <span className="auth-benefit-icon">📋</span>

              <div>
                <strong>Manage reservations</strong>
                <p>
                  Keep track of your upcoming and previous bookings.
                </p>
              </div>
            </div>

            <div className="auth-benefit">
              <span className="auth-benefit-icon">🔐</span>

              <div>
                <strong>Secure account</strong>
                <p>
                  Your account details are handled through secure
                  authentication.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            REGISTER CARD
        ========================== */}
        <div className="auth-card glass-card register-card">
          <div className="auth-card-header">
            <span className="auth-card-label">Create Account</span>

            <h2>Register</h2>

            <p>
              Enter your details to create your RideOn account.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="auth-message auth-message-error" role="alert">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div
              className="auth-message auth-message-success"
              role="status"
            >
              <span>✓</span>
              <p>{success}</p>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name">Full name</label>

              <input
                id="name"
                name="name"
                type="text"
                className="glass-input"
                placeholder="Enter your full name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="register-email">
                Email address
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                className="glass-input"
                placeholder="you@example.com"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">Mobile number</label>

              <input
                id="phone"
                name="phone"
                type="tel"
                className="glass-input"
                placeholder="Enter your mobile number"
                autoComplete="tel"
                inputMode="numeric"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="register-password">
                Password
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                className="glass-input"
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />

              <small className="password-hint">
                Use at least 6 characters.
              </small>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                className="glass-input"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Terms */}
            <label className="terms-row">
              <input
                type="checkbox"
                name="terms"
                required
                disabled={loading}
              />

              <span>
                I agree to the{" "}
                <a href="#terms">Terms & Conditions</a> and{" "}
                <a href="#privacy">Privacy Policy</a>.
              </span>
            </label>

            <button
              type="submit"
              className="shiny-button auth-submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-divider">
            <span />
            <small>Already have an account?</small>
            <span />
          </div>

          <Link
            to="/login"
            className="auth-register-btn"
            aria-disabled={loading}
          >
            Sign in instead
          </Link>

          <Link to="/" className="auth-back-home">
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Register;
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [success, setSuccess] = useState(
    location.state?.registered
      ? "Registration successful. Please sign in."
      : ""
  );

  // =========================
  // HANDLE INPUT CHANGE
  // =========================
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

  // =========================
  // HANDLE LOGIN
  // =========================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    // =========================
    // VALIDATION
    // =========================
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      // =========================
      // LOGIN API
      // =========================
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        /*
          Important:
          Backend stores JWT inside an HttpOnly cookie.
          credentials: "include" allows the browser
          to receive and send that cookie.
        */
        credentials: "include",

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      // =========================
      // API ERROR
      // =========================
      if (!response.ok) {
        throw new Error(
          data?.message || "Login failed. Please try again."
        );
      }

      // =========================
      // RESPONSE VALIDATION
      // =========================
      /*
        JWT is NOT returned in JSON anymore.

        Backend response contains:
        {
          success: true,
          message: "Login successful",
          user: {...}
        }

        JWT is stored securely in the HttpOnly cookie.
      */
      if (!data?.user) {
        throw new Error(
          "Login response is incomplete. Please try again."
        );
      }

      // Admin accounts must use the dedicated /admin/login portal
      if (data.user.role === "admin") {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        setError("Admin accounts cannot log in through the customer website. Please access the secure Admin Portal at /admin/login.");
        return;
      }

      // =========================
      // UPDATE AUTH CONTEXT
      // =========================
      login(data.user);

      // =========================
      // REDIRECT
      // =========================
      const redirectPath = location.state?.from || "/";

      navigate(redirectPath, {
        replace: true,
      });
    } catch (loginError) {
      console.error("Login Error:", loginError);

      setError(
        loginError?.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-purple" />
      <div className="auth-glow auth-glow-blue" />

      <section className="auth-container">
        {/* =========================
            INTRO
        ========================== */}
        <div className="auth-intro">
          <span className="auth-eyebrow">
            Welcome back
          </span>

          <h1>
            Get back on the
            <span> road.</span>
          </h1>

          <p>
            Sign in to manage your bookings, view your
            profile and continue planning your next
            journey.
          </p>

          <div className="auth-benefits">
            <div className="auth-benefit">
              <span className="auth-benefit-icon">
                🚗
              </span>

              <div>
                <strong>
                  Manage your bookings
                </strong>

                <p>
                  View and track your rental
                  reservations.
                </p>
              </div>
            </div>

            <div className="auth-benefit">
              <span className="auth-benefit-icon">
                📅
              </span>

              <div>
                <strong>
                  Plan your next trip
                </strong>

                <p>
                  Choose your dates and find the
                  right car.
                </p>
              </div>
            </div>

            <div className="auth-benefit">
              <span className="auth-benefit-icon">
                🔒
              </span>

              <div>
                <strong>
                  Secure account
                </strong>

                <p>
                  Your account information stays
                  protected.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            LOGIN CARD
        ========================== */}
        <div className="auth-card glass-card">
          <div className="auth-card-header">
            <span className="auth-card-label">
              Account
            </span>

            <h2>Sign in</h2>

            <p>
              Enter your registered details to
              continue.
            </p>
          </div>

          {/* =========================
              ERROR MESSAGE
          ========================== */}
          {error && (
            <div
              className="auth-message auth-message-error"
              role="alert"
            >
              <span>!</span>

              <p>{error}</p>
            </div>
          )}

          {/* =========================
              SUCCESS MESSAGE
          ========================== */}
          {success && (
            <div
              className="auth-message auth-message-success"
              role="status"
            >
              <span>✓</span>

              <p>{success}</p>
            </div>
          )}

          {/* =========================
              LOGIN FORM
          ========================== */}
          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {/* EMAIL */}
            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
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

            {/* PASSWORD */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                className="glass-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            {/* REMEMBER ME */}
            <label className="remember-row">
              <input
                type="checkbox"
                name="remember"
                disabled={loading}
              />

              <span>
                Remember me
              </span>
            </label>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="shiny-button auth-submit"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>
          </form>

          {/* =========================
              REGISTER DIVIDER
          ========================== */}
          <div className="auth-divider">
            <span />

            <small>
              New to RideOn?
            </small>

            <span />
          </div>

          {/* REGISTER */}
          <Link
            to="/register"
            className="auth-register-btn"
          >
            Create an account
          </Link>

          {/* BACK HOME */}
          <Link
            to="/"
            className="auth-back-home"
          >
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Login;
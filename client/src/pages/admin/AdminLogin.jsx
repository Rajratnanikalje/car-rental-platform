import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLogin.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, login, logout, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const destination = location.state?.from || "/admin/dashboard";

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      if (user?.role === "admin") {
        navigate(destination, { replace: true });
      }
    }
  }, [authLoading, isLoggedIn, user, navigate, destination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Invalid credentials. Please try again.");
      }

      if (data?.user?.role !== "admin") {
        await logout();
        setError("Access Denied: This portal is strictly for system administrators.");
        return;
      }

      login(data.user);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-glow admin-login-glow-1" />
      <div className="admin-login-glow admin-login-glow-2" />

      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-brand-icon">R</span>
          <div className="admin-brand-text">
            <h2>Ride<span>On</span></h2>
            <span className="admin-brand-badge">CONTROL CENTER</span>
          </div>
        </div>

        <div className="admin-login-header">
          <h1>Admin Portal Login</h1>
          <p>Sign in with your administrative credentials to manage fleet, drivers, and finances.</p>
        </div>

        {error && (
          <div className="admin-login-error" role="alert">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              placeholder="admin@rideon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={submitting || authLoading}
          >
            {submitting ? "Authenticating..." : "Sign In to Control Center →"}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link to="/" className="admin-back-link">
            ← Return to Customer Website
          </Link>
          <div className="admin-security-note">
            🔒 Secure 256-bit encrypted administrative session
          </div>
        </div>
      </div>
    </div>
  );
}

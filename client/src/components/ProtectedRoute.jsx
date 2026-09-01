import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const {
    isLoggedIn,
    loading,
  } = useAuth();

  // =========================
  // AUTH CHECK LOADING
  // =========================
  if (loading) {
    return (
      <main className="auth-page">
        <div className="book-loading">
          <div className="book-spinner" />

          <p>
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // NOT LOGGED IN
  // =========================
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }

  // =========================
  // AUTHENTICATED
  // =========================
  return children;
}

export default ProtectedRoute;
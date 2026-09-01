import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const location = useLocation();
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return (
      <main className="auth-page">
        <div className="book-loading">
          <div className="book-spinner" />
          <p>Checking your account...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
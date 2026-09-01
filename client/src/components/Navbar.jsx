import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const { isLoggedIn, user, logout } = useAuth();

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      await logout();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Navbar Logout Error:", error);

      // Even if the backend request fails,
      // redirect the user to login.
      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar glass">
        {/* =========================
            BRAND
        ========================== */}
        <Link to="/" className="navbar-brand">
          <span className="brand-mark">R</span>

          <div className="brand-text">
            <strong>
              Ride<span>On</span>
            </strong>

            <small>Premium Car Rental</small>
          </div>
        </Link>

        {/* =========================
            NAVIGATION
        ========================== */}
        <div className="navbar-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/cars"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Cars
          </NavLink>

          <NavLink
            to="/seat-rides"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Shared Rides
          </NavLink>

          {isLoggedIn && (
            <>
              <NavLink
                to="/my-bookings"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                My Bookings
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Profile
              </NavLink>

              {user?.role === "driver" && (
                <>
                  <NavLink
                    to="/driver-dashboard"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    Driver Dashboard
                  </NavLink>

                  <NavLink
                    to="/driver-trips"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    My Trips
                  </NavLink>
                </>
              )}

              {isLoggedIn && user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  Admin Panel
                </NavLink>
              )}

              {user?.role !== "driver" && (
                <NavLink
                  to="/driver-register"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  Become Driver
                </NavLink>
              )}
            </>
          )}
        </div>

        {/* =========================
            AUTH ACTIONS
        ========================== */}
        <div className="navbar-actions">
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="navbar-login">
                Login
              </Link>

              <Link
                to="/register"
                className="shiny-button navbar-register"
              >
                Get Started
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="navbar-login"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>

        {/* =========================
            MOBILE MENU BUTTON
        ========================== */}
        <button
          className="mobile-menu-btn"
          type="button"
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
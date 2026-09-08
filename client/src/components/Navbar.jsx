import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCms } from "../hooks/useCms";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();
  const { cms } = useCms();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const branding = cms?.branding || {};

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    closeMobileMenu();
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
    <>
      {branding.announcementActive && branding.announcementText && (
        <div className="site-announcement-bar">
          <span>{branding.announcementText}</span>
        </div>
      )}
      <header className="navbar-wrapper">
        <nav className="navbar glass">
          {/* =========================
              BRAND
          ========================== */}
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
            <span className="brand-mark">{branding.brandMark || "R"}</span>

            <div className="brand-text">
              <strong>
                {branding.brandName ? (
                  branding.brandName.toLowerCase() === "rideon" ? (
                    <>
                      Ride<span>On</span>
                    </>
                  ) : (
                    branding.brandName
                  )
                ) : (
                  <>
                    Ride<span>On</span>
                  </>
                )}
              </strong>

              <small>{branding.brandTagline || "Premium Car Rental"}</small>
            </div>
          </Link>

        {/* =========================
            NAVIGATION (DESKTOP)
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
          className={`mobile-menu-btn ${mobileMenuOpen ? "open" : ""}`}
          type="button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* =========================
          MOBILE NAVIGATION DRAWER
      ========================== */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer glass">
          <div className="mobile-drawer-links">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "mobile-nav-link active" : "mobile-nav-link"
              }
              onClick={closeMobileMenu}
            >
              Home
            </NavLink>

            <NavLink
              to="/cars"
              className={({ isActive }) =>
                isActive ? "mobile-nav-link active" : "mobile-nav-link"
              }
              onClick={closeMobileMenu}
            >
              Cars
            </NavLink>

            <NavLink
              to="/seat-rides"
              className={({ isActive }) =>
                isActive ? "mobile-nav-link active" : "mobile-nav-link"
              }
              onClick={closeMobileMenu}
            >
              Shared Rides
            </NavLink>

            {isLoggedIn && (
              <>
                <NavLink
                  to="/my-bookings"
                  className={({ isActive }) =>
                    isActive ? "mobile-nav-link active" : "mobile-nav-link"
                  }
                  onClick={closeMobileMenu}
                >
                  My Bookings
                </NavLink>

                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    isActive ? "mobile-nav-link active" : "mobile-nav-link"
                  }
                  onClick={closeMobileMenu}
                >
                  Profile
                </NavLink>

                {user?.role === "driver" && (
                  <>
                    <NavLink
                      to="/driver-dashboard"
                      className={({ isActive }) =>
                        isActive ? "mobile-nav-link active" : "mobile-nav-link"
                      }
                      onClick={closeMobileMenu}
                    >
                      Driver Dashboard
                    </NavLink>

                    <NavLink
                      to="/driver-trips"
                      className={({ isActive }) =>
                        isActive ? "mobile-nav-link active" : "mobile-nav-link"
                      }
                      onClick={closeMobileMenu}
                    >
                      My Trips
                    </NavLink>
                  </>
                )}

                {user?.role !== "driver" && (
                  <NavLink
                    to="/driver-register"
                    className={({ isActive }) =>
                      isActive ? "mobile-nav-link active" : "mobile-nav-link"
                    }
                    onClick={closeMobileMenu}
                  >
                    Become Driver
                  </NavLink>
                )}
              </>
            )}
          </div>

          <div className="mobile-drawer-actions">
            {!isLoggedIn ? (
              <div className="mobile-auth-row">
                <Link
                  to="/login"
                  className="navbar-login mobile-login-btn"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="shiny-button navbar-register mobile-register-btn"
                  onClick={closeMobileMenu}
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <button
                type="button"
                className="shiny-button mobile-logout-btn"
                onClick={handleLogout}
              >
                Logout ({user?.name || "Account"})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  </>
  );
}

export default Navbar;
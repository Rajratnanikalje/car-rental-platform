import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCms } from "../hooks/useCms";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();
  const { cms } = useCms();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const branding = cms?.branding || {};

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    closeMobileMenu();
    setUserDropdownOpen(false);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Navbar Logout Error:", error);
      navigate("/login", { replace: true });
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
        <nav className="navbar">
          {/* =========================
              BRAND LOGO (PIN + RIDEON)
          ========================== */}
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
            <div className="brand-pin-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
                  fill="#2563eb"
                />
                <circle cx="12" cy="9" r="3.2" fill="#ffffff" />
              </svg>
            </div>
            <div className="brand-title">
              Ride<span>On</span>
            </div>
          </Link>

          {/* =========================
              NAVIGATION (DESKTOP)
          ========================== */}
          <div className="navbar-links">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Home
            </NavLink>

            <NavLink
              to="/cars"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Cars
            </NavLink>

            <NavLink
              to="/seat-rides"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Seat Rides
            </NavLink>

            <a href="/#about" className="nav-link">
              About
            </a>

            <a href="/#contact" className="nav-link">
              Contact
            </a>
          </div>

          {/* =========================
              RIGHT SIDE ACTIONS
          ========================== */}
          <div className="navbar-actions">
            {/* Search Icon button */}
            <Link
              to="/cars"
              className="navbar-search-btn"
              title="Search available cars & rides"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>

            {!isLoggedIn ? (
              <div className="navbar-auth-buttons">
                <Link to="/login" className="nav-btn-login">
                  Login
                </Link>

                <Link to="/register" className="nav-btn-signup">
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="navbar-user-menu" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-profile-trigger"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                >
                  <div className="user-avatar-badge">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="user-name-text">{user?.name?.split(" ")[0] || "Account"}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ transform: userDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-card shadow-lg">
                    <div className="user-dropdown-header">
                      <strong>{user?.name || "User"}</strong>
                      <small>{user?.email}</small>
                      {user?.role && <span className="user-role-tag">{user.role.toUpperCase()}</span>}
                    </div>

                    <div className="user-dropdown-divider" />

                    <Link
                      to="/my-bookings"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <span>📋</span> My Bookings
                    </Link>

                    <Link
                      to="/profile"
                      className="user-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <span>👤</span> My Profile
                    </Link>

                    {user?.role === "driver" ? (
                      <Link
                        to="/driver-dashboard"
                        className="user-dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span>🚗</span> Driver Portal
                      </Link>
                    ) : (
                      <Link
                        to="/driver-register"
                        className="user-dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span>💼</span> Become a Driver
                      </Link>
                    )}

                    <div className="user-dropdown-divider" />

                    <button
                      type="button"
                      className="user-dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu hamburger */}
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
          </div>
        </nav>

        {/* =========================
            MOBILE DRAWER
        ========================== */}
        {mobileMenuOpen && (
          <div className="navbar-mobile-drawer">
            <div className="mobile-drawer-links">
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
                onClick={closeMobileMenu}
              >
                Home
              </NavLink>

              <NavLink
                to="/cars"
                className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
                onClick={closeMobileMenu}
              >
                Cars
              </NavLink>

              <NavLink
                to="/seat-rides"
                className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
                onClick={closeMobileMenu}
              >
                Seat Rides
              </NavLink>

              <a href="/#about" className="mobile-nav-link" onClick={closeMobileMenu}>
                About
              </a>

              <a href="/#contact" className="mobile-nav-link" onClick={closeMobileMenu}>
                Contact
              </a>

              {isLoggedIn && (
                <>
                  <div className="mobile-divider" />
                  <NavLink
                    to="/my-bookings"
                    className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
                    onClick={closeMobileMenu}
                  >
                    My Bookings
                  </NavLink>

                  <NavLink
                    to="/profile"
                    className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </NavLink>

                  {user?.role === "driver" ? (
                    <NavLink
                      to="/driver-dashboard"
                      className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
                      onClick={closeMobileMenu}
                    >
                      Driver Portal
                    </NavLink>
                  ) : (
                    <NavLink
                      to="/driver-register"
                      className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
                      onClick={closeMobileMenu}
                    >
                      Become a Driver
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
                    className="nav-btn-login mobile-full-btn"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="nav-btn-signup mobile-full-btn"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  className="mobile-logout-btn"
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
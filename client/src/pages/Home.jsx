import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import CarCard from "../components/CarCard";
import { useCms } from "../hooks/useCms";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [searchTab, setSearchTab] = useState("private"); // "private" | "seat"
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");

  const { cms } = useCms();
  const heroCms = cms?.hero || {};

  useEffect(() => {
    const controller = new AbortController();

    const fetchFeaturedCars = async () => {
      try {
        setCarsLoading(true);
        const res = await fetch(`${API_URL}/cars`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.cars)) {
            // Show up to 3 available cars
            const available = data.cars.filter((c) => c.available !== false);
            setCars(available.length > 0 ? available.slice(0, 3) : data.cars.slice(0, 3));
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch featured cars error:", err);
        }
      } finally {
        setCarsLoading(false);
      }
    };

    fetchFeaturedCars();
    return () => controller.abort();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTab === "seat") {
      const params = new URLSearchParams({
        pickupPoint: pickup.trim(),
        destination: drop.trim(),
        date: travelDate,
        time: travelTime,
      });
      navigate(`/seat-rides?${params.toString()}`);
    } else {
      // The fleet endpoint does not price a trip until a car is selected. Keep
      // the journey details in the URL so the booking form can prefill them.
      const params = new URLSearchParams({
        pickup,
        destination: drop,
        date: travelDate,
        time: travelTime,
      });
      navigate(`/cars?${params.toString()}`);
    }
  };

  return (
    <main className="rideon-home">
      {/* ====================================================
          1. HERO SECTION WITH CITY SKYLINE & FLOATING SEARCH
      ===================================================== */}
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-pill-badge">
            {heroCms.badgeText || "Smart Rides. Better Journeys."}
          </span>
          <h1 className="hero-title">
            Your Ride, <span className="hero-highlight">Our Priority</span>
          </h1>
          <p className="hero-subtitle">
            {heroCms.description ||
              "Fast, reliable and comfortable car rental & intercity seat ride service."}
          </p>

          {/* FLOATING BOOKING SEARCH BOX */}
          <div className="floating-search-card">
            {/* TABS */}
            <div className="search-tabs">
              <button
                type="button"
                className={`search-tab-pill ${searchTab === "private" ? "active" : ""}`}
                onClick={() => setSearchTab("private")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.8 2 12.3V16c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
                Private Car
              </button>
              <button
                type="button"
                className={`search-tab-pill ${searchTab === "seat" ? "active" : ""}`}
                onClick={() => setSearchTab("seat")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Seat Ride
              </button>
            </div>

            {/* INPUTS ROW */}
            <form className="search-form-row" onSubmit={handleSearchSubmit}>
              <div className="form-input-group">
                <label>Pickup Location</label>
                <div className="input-with-icon">
                  <span className="input-icon">📍</span>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup city"
                    required
                  />
                </div>
              </div>

              <div className="form-input-group">
                <label>Drop Location</label>
                <div className="input-with-icon">
                  <span className="input-icon">🏁</span>
                  <input
                    type="text"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    placeholder="Enter drop city"
                    required
                  />
                </div>
              </div>

              <div className="form-input-group">
                <label>Date &amp; Time</label>
                <div className="input-with-icon">
                  <span className="input-icon">📅</span>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    required
                  />
                </div>
                <input
                  className="travel-time-input"
                  type="time"
                  value={travelTime}
                  onChange={(e) => setTravelTime(e.target.value)}
                  aria-label="Pickup time"
                  required
                />
              </div>

              <div className="form-button-group">
                <button type="submit" className="search-action-btn">
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="home-canvas-body">
        {/* ====================================================
            2. POPULAR CARS SECTION
        ===================================================== */}
        <section className="home-section popular-cars-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-main-heading">Popular Cars</h2>
              <p className="section-sub-heading">
                Choose from our wide range of well-maintained vehicles
              </p>
            </div>
            <Link to="/cars" className="section-view-all-link">
              View All →
            </Link>
          </div>

          {carsLoading ? (
            <div className="cars-loading-row">
              <div className="loading-spinner" />
              <span>Loading fleet...</span>
            </div>
          ) : cars.length > 0 ? (
            <div className="popular-cars-grid">
              {cars.map((car) => (
                <CarCard key={car._id} car={car} />
              ))}
            </div>
          ) : (
            <div className="no-cars-card">
              <p>Vehicles are being prepared. Browse our full catalog.</p>
              <Link to="/cars" className="browse-cars-btn">Browse Cars</Link>
            </div>
          )}
        </section>

        {/* ====================================================
            3. OUR SERVICES (4 CLEAN CARDS)
        ===================================================== */}
        <section className="home-section services-section">
          <div className="section-center-heading">
            <h2 className="section-main-heading">Our Services</h2>
            <p className="section-sub-heading">
              Comprehensive travel solutions tailored to your journey needs
            </p>
          </div>

          <div className="services-four-grid">
            {/* Service 1 */}
            <Link to="/cars" className="service-card-white">
              <div className="service-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.8 2 12.3V16c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <h3 className="service-title">Car Rental</h3>
              <p className="service-desc">
                Wide range of self-drive and chauffeur-driven cars for personal, family and corporate trips.
              </p>
            </Link>

            {/* Service 2 */}
            <Link to="/cars" className="service-card-white">
              <div className="service-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
              </div>
              <h3 className="service-title">Intercity Rides</h3>
              <p className="service-desc">
                Comfortable point-to-point travel between Maharashtra cities with fixed, transparent pricing.
              </p>
            </Link>

            {/* Service 3 */}
            <Link to="/seat-rides" className="service-card-white">
              <div className="service-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="service-title">Seat Booking</h3>
              <p className="service-desc">
                Share your ride and split travel costs with verified commuters on popular routes.
              </p>
            </Link>

            {/* Service 4 */}
            <Link to="/driver-register" className="service-card-white">
              <div className="service-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="9" />
                  <line x1="12" y1="15" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="9.88" y2="9.88" />
                  <line x1="14.12" y1="14.12" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <h3 className="service-title">Driver Partner</h3>
              <p className="service-desc">
                Partner with RideOn to earn guaranteed payouts with flexible driving schedules.
              </p>
            </Link>
          </div>
        </section>

        {/* ====================================================
            4. DRIVER PARTNER BANNER (REFERENCE DESIGN)
        ===================================================== */}
        <section className="home-section driver-banner-section">
          <div className="driver-partner-banner">
            <div className="driver-banner-text">
              <span className="driver-pill-tag">Driver Network</span>
              <h3 className="driver-banner-title">
                Become a RideOn Driver Partner
              </h3>
              <p className="driver-banner-desc">
                Earn up to ₹40,000/month with flexible hours, verified riders, and instant weekly payouts directly to your bank account.
              </p>
              <Link to="/driver-register" className="driver-join-btn">
                Join Now →
              </Link>
            </div>
            <div className="driver-banner-visual">
              <div className="driver-graphic-badge">
                <span className="driver-car-icon">🚘</span>
                <strong>Verified RideOn Partner</strong>
                <small>Flexible Schedules • Weekly Payouts</small>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            5. WHY CHOOSE RIDEON? (4 TRUST BADGES)
        ===================================================== */}
        <section className="home-section why-choose-section">
          <div className="section-center-heading">
            <h2 className="section-main-heading">Why Choose RideOn?</h2>
            <p className="section-sub-heading">
              Experience seamless mobility built on trust, transparency, and passenger safety
            </p>
          </div>

          <div className="why-four-grid">
            <div className="why-trust-card">
              <div className="why-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4>Safe &amp; Secure</h4>
              <p>Verified rides, 24/7 emergency SOS support, and thoroughly inspected vehicles.</p>
            </div>

            <div className="why-trust-card">
              <div className="why-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <h4>Affordable Rates</h4>
              <p>Transparent pricing with zero hidden surcharges and guaranteed best market rates.</p>
            </div>

            <div className="why-trust-card">
              <div className="why-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h4>Verified Drivers</h4>
              <p>Experienced chauffeurs thoroughly vetted with identity and commercial background checks.</p>
            </div>

            <div className="why-trust-card">
              <div className="why-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <h4>24/7 Support</h4>
              <p>Round-the-clock dedicated customer assistance and roadside support whenever you need it.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import CarCard from "../components/CarCard";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function Home() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFeaturedCars = async () => {
      try {
        const response = await fetch(`${API_URL}/cars`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data?.cars)) {
          setCars(data.cars.filter((car) => car.available).slice(0, 3));
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Fetch featured cars error:", error);
        }
      }
    };

    fetchFeaturedCars();
    return () => controller.abort();
  }, []);

  return (
    <main className="home-page">

      {/* =========================
          HERO
      ========================== */}
      <section className="home-hero">
        <div className="hero-glow hero-glow-purple" />
        <div className="hero-glow hero-glow-blue" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Premium Car Rental Experience
          </div>

          <h1>
            Drive Your Journey
            <span>Your Way.</span>
          </h1>

          <p className="hero-description">
            Rent reliable cars at transparent prices with a smooth booking
            experience. Choose your car, pick your dates, and hit the road.
          </p>

          <div className="hero-actions">
            <Link to="/cars" className="shiny-button hero-primary-btn">
              Explore Cars
            </Link>

            <Link to="/register" className="hero-secondary-btn">
              Get Started
              <span>→</span>
            </Link>
          </div>

          <div className="hero-trust">
            <div className="trust-item">
              <strong>Flexible</strong>
              <span>Vehicle plans</span>
            </div>

            <div className="trust-divider" />

            <div className="trust-item">
              <strong>24/7</strong>
              <span>Booking Access</span>
            </div>

            <div className="trust-divider" />

            <div className="trust-item">
              <strong>Clear</strong>
              <span>Pricing</span>
            </div>
          </div>
        </div>

        {/* =========================
            HERO CAR VISUAL
        ========================== */}
        <div className="hero-visual">
          <div className="hero-visual-glow" />

          <div className="hero-car-card glass-card">
            <div className="hero-car-top">
              <span>RideOn Vehicle</span>

              <span className="hero-car-status">
                <span />
                Available
              </span>
            </div>

            <div className="hero-car-image">
              <div className="car-placeholder">
                <span className="car-placeholder-icon">🚗</span>
                <span>Premium Car</span>
              </div>
            </div>

            <div className="hero-car-info">
              <div>
                <h2>Premium Drive</h2>
                <p>Comfort • Style • Performance</p>
              </div>

              <div className="hero-car-price">
                <strong>Live</strong>
                <span>pricing</span>
              </div>
            </div>
          </div>

          <div className="floating-card floating-card-top glass-card">
            <span className="floating-icon">⚡</span>

            <div>
              <strong>Fast Booking</strong>
              <span>Simple & secure</span>
            </div>
          </div>

          <div className="floating-card floating-card-bottom glass-card">
            <span className="floating-icon">✓</span>

            <div>
              <strong>Trusted Rentals</strong>
              <span>Transparent pricing</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          QUICK BOOKING
      ========================== */}
      <section className="quick-booking-section section">
        <div className="quick-booking glass-card">
          <div className="quick-booking-heading">
            <span>Start your trip</span>
            <h2>Find your perfect car</h2>
          </div>

          <div className="quick-booking-fields">
            <div className="booking-field">
              <span className="booking-field-label">Pick-up Date</span>
              <strong>Select date</strong>
            </div>

            <div className="booking-field">
              <span className="booking-field-label">Return Date</span>
              <strong>Select date</strong>
            </div>

            <Link to="/cars" className="shiny-button booking-search-btn">
              Search Cars
            </Link>
          </div>
        </div>
      </section>

      {/* =========================
          POPULAR CARS
      ========================== */}
      <section className="popular-cars section">
        <div className="section-heading">
          <span>Our fleet</span>

          <h2>Popular cars for your next journey.</h2>

          <p>
            Choose from comfortable and reliable vehicles designed for
            different kinds of trips.
          </p>
        </div>

        <div className="popular-cars-grid">
          {cars.map((car) => (
            <CarCard key={car._id} car={car} />
          ))}
        </div>

        <div className="popular-cars-footer">
          <Link to="/cars" className="shiny-button">
            View All Cars →
          </Link>
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================== */}
      <section className="how-it-works section">
        <div className="section-heading">
          <span>Simple process</span>

          <h2>Rent a car in three easy steps.</h2>

          <p>
            From choosing your car to starting your journey, we keep the
            entire rental process simple and transparent.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card glass-card">
            <div className="step-number">01</div>

            <div className="step-icon">🚗</div>

            <h3>Choose Your Car</h3>

            <p>
              Browse our available cars and choose the vehicle that fits
              your journey and budget.
            </p>
          </div>

          <div className="step-card glass-card">
            <div className="step-number">02</div>

            <div className="step-icon">📅</div>

            <h3>Book Your Ride</h3>

            <p>
              Select your rental dates, review the pricing and confirm
              your booking securely.
            </p>
          </div>

          <div className="step-card glass-card">
            <div className="step-number">03</div>

            <div className="step-icon">🛣️</div>

            <h3>Enjoy Your Journey</h3>

            <p>
              Pick up your car and enjoy your trip with transparent rental
              terms and reliable support.
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          WHY CHOOSE US
      ========================== */}
      <section className="why-choose section">
        <div className="why-choose-content">

          <div className="why-choose-heading">
            <span>Why RideOn</span>

            <h2>
              Everything you need for a
              <strong> better journey.</strong>
            </h2>

            <p>
              We make car rentals simple with transparent pricing, reliable
              vehicles and a booking experience designed around your
              convenience.
            </p>

            <Link to="/cars" className="shiny-button why-choose-btn">
              Find Your Car →
            </Link>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card glass-card">
              <div className="benefit-icon">💰</div>

              <h3>Transparent Pricing</h3>

              <p>
                Know your rental cost upfront with clear pricing and no
                unexpected surprises.
              </p>
            </div>

            <div className="benefit-card glass-card">
              <div className="benefit-icon">🛡️</div>

              <h3>Reliable Cars</h3>

              <p>
                Choose from well-maintained vehicles suitable for city
                drives, family trips and long journeys.
              </p>
            </div>

            <div className="benefit-card glass-card">
              <div className="benefit-icon">⚡</div>

              <h3>Easy Booking</h3>

              <p>
                Select your dates, choose your car and complete your
                booking without unnecessary steps.
              </p>
            </div>

            <div className="benefit-card glass-card">
              <div className="benefit-icon">📍</div>

              <h3>Flexible Travel</h3>

              <p>
                Enjoy the freedom to travel on your schedule with
                convenient rental options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FINAL CTA
      ========================== */}
      <section className="final-cta section">
        <div className="final-cta-card glass-card">
          <div className="cta-glow cta-glow-purple" />
          <div className="cta-glow cta-glow-blue" />

          <div className="cta-content">
            <span className="cta-label">
              Ready to hit the road?
            </span>

            <h2>
              Your next journey
              <span> starts here.</span>
            </h2>

            <p>
              Choose your car, select your dates and get ready for a
              comfortable journey with RideOn.
            </p>

            <div className="cta-actions">
              <Link to="/cars" className="shiny-button">
                Browse Cars →
              </Link>

              <Link to="/register" className="cta-secondary-btn">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

export default Home;

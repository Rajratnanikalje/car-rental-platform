import { API_URL } from "../config/api";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import CarCard from "../components/CarCard";
import { useCms } from "../hooks/useCms";


function Home() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [seatRides, setSeatRides] = useState([]);
  const [searchTab, setSearchTab] = useState("private");
  const [searchFrom, setSearchFrom] = useState("Chikhli");
  const [searchTo, setSearchTo] = useState("Aurangabad");
  const [searchDate, setSearchDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  const { cms } = useCms();
  const hero = cms.hero || {};
  const about = cms.about || {};
  const fleet = cms.fleet || {};
  const gallery = cms.gallery || {};
  const testimonials = cms.testimonials || {};

  useEffect(() => {
    const controller = new AbortController();

    const fetchHomeData = async () => {
      try {
        const [carsRes, ridesRes] = await Promise.all([
          fetch(`${API_URL}/cars`, { signal: controller.signal }),
          fetch(`${API_URL}/seat-rides`, { signal: controller.signal }),
        ]);

        if (carsRes.ok) {
          const carsData = await carsRes.json();
          if (Array.isArray(carsData?.cars)) {
            setCars(carsData.cars.filter((car) => car.available).slice(0, 3));
          }
        }

        if (ridesRes.ok) {
          const ridesData = await ridesRes.json();
          if (Array.isArray(ridesData?.rides)) {
            setSeatRides(ridesData.rides.slice(0, 3));
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Home data fetch error:", error);
        }
      }
    };

    fetchHomeData();
    return () => controller.abort();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchTab === "seat") {
      navigate(`/seat-rides?pickupPoint=${encodeURIComponent(searchFrom)}&destination=${encodeURIComponent(searchTo)}`);
    } else {
      navigate(`/cars?location=${encodeURIComponent(searchFrom)}`);
    }
  };

  return (
    <main className="home-page">
      {/* 1. HERO SECTION (REFERENCE IMAGE 1 TILE 1 & IMAGE 2 LEFT) */}
      <section
        className="home-hero-banner"
        style={
          hero.heroBgImage
            ? {
                backgroundImage: `linear-gradient(rgba(10, 15, 29, 0.72), rgba(10, 15, 29, 0.9)), url(${hero.heroBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="hero-banner-overlay" />
        <div className="hero-banner-content">
          <span className="hero-tag-pill">
            {hero.badgeText || "Smart Rides. Better Journeys."}
          </span>

          <h1 className="hero-headline">
            {hero.headingMain || "Your Ride,"}
            <span className="hero-headline-gold">
              {" "}
              {hero.headingHighlight || "Our Priority"}
            </span>
          </h1>

          <p className="hero-subheadline">
            {hero.description ||
              "Private car rentals, intercity rides, and scheduled seat bookings — all in one place."}
          </p>

          {/* TABBED SEARCH WIDGET */}
          <div className="hero-search-container glass-card">
            <div className="search-tab-bar">
              <button
                type="button"
                className={`search-tab-btn ${searchTab === "private" ? "active" : ""}`}
                onClick={() => setSearchTab("private")}
              >
                Private Car
              </button>
              <button
                type="button"
                className={`search-tab-btn ${searchTab === "seat" ? "active" : ""}`}
                onClick={() => setSearchTab("seat")}
              >
                Seat Ride
              </button>
              <button
                type="button"
                className={`search-tab-btn ${searchTab === "intercity" ? "active" : ""}`}
                onClick={() => setSearchTab("intercity")}
              >
                Intercity
              </button>
            </div>

            <form className="search-inputs-grid" onSubmit={handleHeroSearch}>
              <div className="search-input-field">
                <label>From</label>
                <input
                  type="text"
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  placeholder="e.g. Chikhli"
                  required
                />
              </div>

              <div className="search-input-field">
                <label>To</label>
                <input
                  type="text"
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  placeholder="e.g. Aurangabad"
                  required
                />
              </div>

              <div className="search-input-field">
                <label>Date</label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. OUR SERVICES (5 CARDS - IMAGE 1 TILE 1 & IMAGE 2) */}
      <section className="section services-section-clean">
        <div className="section-header-centered">
          <span className="section-eyebrow">What We Offer</span>
          <h2>Our Services</h2>
        </div>

        <div className="services-grid-five">
          <Link to="/cars" className="service-card-clean glass-card">
            <div className="service-icon-clean">🚗</div>
            <h3>Private Car Rental</h3>
            <p>Comfortable & safe travel for you and your family.</p>
          </Link>

          <Link to="/cars" className="service-card-clean glass-card">
            <div className="service-icon-clean">⛽</div>
            <h3>Intercity Rides</h3>
            <p>Long distance rides across Maharashtra cities.</p>
          </Link>

          <Link to="/seat-rides" className="service-card-clean glass-card">
            <div className="service-icon-clean">🚌</div>
            <h3>Seat Booking</h3>
            <p>Share the ride, share the cost with verified commuters.</p>
          </Link>

          <Link to="/driver-register" className="service-card-clean glass-card">
            <div className="service-icon-clean">👨‍✈️</div>
            <h3>Driver Partner</h3>
            <p>Become a driver partner with us and earn steady daily payouts.</p>
          </Link>

          <Link to="/cars" className="service-card-clean glass-card">
            <div className="service-icon-clean">✈️</div>
            <h3>Airport/Local Travel</h3>
            <p>Hassle-free airport transfers and seamless local trips.</p>
          </Link>
        </div>
      </section>

      {/* 3. WHY CHOOSE RIDEON (4 CARDS - IMAGE 1 TILE 1 & IMAGE 2) */}
      <section className="section why-choose-clean">
        <div className="section-header-centered">
          <span className="section-eyebrow">Trust & Value</span>
          <h2>Why Choose RideOn</h2>
        </div>

        <div className="why-grid-four">
          <div className="why-card glass-card">
            <div className="why-icon">🛡️</div>
            <h3>Safe & Reliable</h3>
            <p>Verified drivers & vehicles thoroughly inspected for long journeys.</p>
          </div>

          <div className="why-card glass-card">
            <div className="why-icon">💰</div>
            <h3>Affordable Pricing</h3>
            <p>Best transparent prices in the market with zero hidden surcharges.</p>
          </div>

          <div className="why-card glass-card">
            <div className="why-icon">📞</div>
            <h3>24/7 Support</h3>
            <p>We are always here to assist your trips and emergency travel needs.</p>
          </div>

          <div className="why-card glass-card">
            <div className="why-icon">⚡</div>
            <h3>Easy Booking</h3>
            <p>Fast & simple process — book in under 60 seconds with instant confirmation.</p>
          </div>
        </div>
      </section>

      {/* 4. PROMO BANNERS: APP DOWNLOAD & BOOK PRIVATE CAR (IMAGE 2 LEFT) */}
      <section className="section promo-banners-section">
        <div className="promo-banners-grid">
          {/* Download App Banner */}
          <div className="promo-card app-download-card glass-card">
            <div className="promo-text-content">
              <span className="promo-tag">Mobile Experience</span>
              <h3>Download RideOn App</h3>
              <p>Book rides faster, track your driver live, and get exclusive discounts.</p>
              <div className="store-buttons-row">
                <div className="store-badge-mockup">
                  <span>▶</span> Google Play
                </div>
                <div className="store-badge-mockup">
                  <span></span> App Store
                </div>
              </div>
            </div>
            <div className="app-mockup-phone">
              <div className="phone-screen-frame">
                <span className="phone-notch" />
                <div className="phone-mockup-inner">
                  <strong>RideOn</strong>
                  <small>Smart Rides</small>
                </div>
              </div>
            </div>
          </div>

          {/* Book Private Car Banner */}
          <div className="promo-card private-car-promo-card glass-card">
            <div className="promo-text-content">
              <span className="promo-tag">Premium Fleet</span>
              <h3>Book Your Private Car</h3>
              <p>Comfortable, premium & safe rides for your special journeys and corporate trips.</p>
              <Link to="/cars" className="shiny-button promo-cta-btn">
                Book Now →
              </Link>
            </div>
            <div className="promo-car-visual">
              <span className="promo-car-emoji">🚘</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AVAILABLE SEAT RIDES (IMAGE 2 LEFT & IMAGE 1 TILE 4) */}
      {seatRides.length > 0 && (
        <section className="section seat-rides-section">
          <div className="section-header-flex">
            <div>
              <span className="section-eyebrow">Shared Travel</span>
              <h2>Available Seat Rides</h2>
            </div>
            <Link to="/seat-rides" className="view-all-link">
              View All →
            </Link>
          </div>

          <div className="seat-rides-grid">
            {seatRides.map((ride) => (
              <div key={ride._id} className="seat-ride-preview-card glass-card">
                <div className="route-header-row">
                  <span className="route-endpoints">
                    {ride.pickupPoint?.split(",")[0]} ➔ {ride.destination?.split(",")[0]}
                  </span>
                  <span className="seats-remaining-pill">
                    {ride.availableSeats} seats left
                  </span>
                </div>

                <div className="ride-meta-row">
                  <span className="ride-date-time">
                    📅 {new Date(ride.departureAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} •{" "}
                    {new Date(ride.departureAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="ride-vehicle-name">
                    🚗 {ride.car?.brand} {ride.car?.model}
                  </span>
                </div>

                <div className="ride-action-row">
                  <div className="ride-price-wrap">
                    <span className="ride-price-figure">₹{ride.pricePerSeat}</span>
                    <span className="ride-price-per">/ seat</span>
                  </div>
                  <Link to="/seat-rides" className="seat-book-btn">
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. POPULAR CARS / FLEET (IMAGE 1 TILE 2) */}
      <section className="popular-cars section">
        <div className="section-header-flex">
          <div>
            <span className="section-eyebrow">{fleet.sectionTag || "Featured Fleet"}</span>
            <h2>{fleet.title || "Popular cars for your next journey."}</h2>
          </div>
          <Link to="/cars" className="view-all-link">
            {fleet.viewAllText || "View All Cars →"}
          </Link>
        </div>

        <div className="popular-cars-grid">
          {cars.map((car) => (
            <CarCard key={car._id} car={car} />
          ))}
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section className="how-it-works section">
        <div className="section-header-centered">
          <span className="section-eyebrow">{about.stepsTag || "Simple Process"}</span>
          <h2>{about.stepsTitle || "Rent a car in three easy steps."}</h2>
          <p>
            {about.stepsDescription ||
              "From choosing your car to starting your journey, we keep the entire rental process simple and transparent."}
          </p>
        </div>

        <div className="steps-grid">
          {(about.steps && about.steps.length > 0
            ? about.steps
            : [
                {
                  number: "01",
                  icon: "🚗",
                  title: "Choose Your Car",
                  description:
                    "Browse our available cars and choose the vehicle that fits your journey and budget.",
                },
                {
                  number: "02",
                  icon: "📅",
                  title: "Book Your Ride",
                  description:
                    "Select your rental dates, review the pricing and confirm your booking securely.",
                },
                {
                  number: "03",
                  icon: "🛣️",
                  title: "Enjoy Your Journey",
                  description:
                    "Pick up your car and enjoy your trip with transparent rental terms and reliable support.",
                },
              ]
          ).map((step, idx) => (
            <div key={idx} className="step-card glass-card">
              <div className="step-number">{step.number || `0${idx + 1}`}</div>
              <div className="step-icon">{step.icon || "🚗"}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      {testimonials.items && testimonials.items.length > 0 && (
        <section className="testimonials-section section">
          <div className="section-header-centered">
            <span className="section-eyebrow">{testimonials.sectionTag || "Renter Stories"}</span>
            <h2>{testimonials.title || "Loved by thousands of happy travelers."}</h2>
            <p>
              {testimonials.description ||
                "Read what verified renters and regular road-trippers have to say about their RideOn journey."}
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.items.map((item, idx) => (
              <div key={idx} className="testimonial-card glass-card">
                <div className="testimonial-rating">
                  {"★".repeat(item.rating || 5)}
                </div>
                <p className="testimonial-comment">“{item.comment}”</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{item.initials || "RO"}</div>
                  <div className="author-info">
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. GALLERY */}
      {gallery.items && gallery.items.length > 0 && (
        <section className="gallery-section section">
          <div className="section-header-centered">
            <span className="section-eyebrow">{gallery.sectionTag || "Fleet in Action"}</span>
            <h2>{gallery.title || "Explore the RideOn experience."}</h2>
          </div>

          <div className="gallery-grid">
            {gallery.items.map((img, idx) => (
              <div key={idx} className="gallery-card">
                <img
                  src={img.image}
                  alt={img.title || "RideOn vehicle"}
                  className="gallery-image"
                  loading="lazy"
                />
                <div className="gallery-overlay">
                  <span className="gallery-tag">{img.category || "Vehicle"}</span>
                  <h4>{img.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. FINAL CTA SECTION */}
      <section className="final-cta section">
        <div className="final-cta-card glass-card">
          <div className="cta-content">
            <span className="cta-label">
              {fleet.ctaTag || "Ready to hit the road?"}
            </span>

            <h2>{fleet.ctaTitle || "Your next journey starts here."}</h2>

            <p>
              {fleet.ctaDescription ||
                "Choose your car, select your dates and get ready for a comfortable journey with RideOn."}
            </p>

            <div className="cta-actions">
              <Link to="/cars" className="shiny-button">
                {fleet.ctaPrimaryText || "Browse Cars →"}
              </Link>

              <Link to="/register" className="cta-secondary-btn">
                {fleet.ctaSecondaryText || "Create Account"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;

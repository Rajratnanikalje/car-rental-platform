import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import "./CarDetails.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function CarDetails() {
  const { id } = useParams();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // =========================
  // FETCH REAL CAR
  // =========================
  useEffect(() => {
    const fetchCar = async () => {
      try {
        setLoading(true);
        setError("");
        setNotFound(false);

        if (!id) {
          throw new Error("Car ID is missing.");
        }

        const response = await fetch(
          `${API_URL}/cars/${id}`
        );

        const data = await response.json();

        if (response.status === 404) {
          setNotFound(true);
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load car details."
          );
        }

        if (!data?.car) {
          throw new Error("Unable to load car details. Please try again.");
        }

        setCar(data.car);
      } catch (fetchError) {
        console.error(
          "Fetch Car Details Error:",
          fetchError
        );

        setError(
          fetchError?.message ||
            "Unable to load car details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="car-details-page">
        <div className="car-details-container">
          <div className="car-details-loading">
            <div className="book-spinner" />
            <p>
              Loading car details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (notFound) {
    return (
      <main className="car-details-page">
        <div className="car-details-container">
          <section className="car-details-error glass-card">
            <div className="car-details-error-icon">
              🚗
            </div>

            <h1>Car not found</h1>

            <p>We could not find the requested car.</p>

            <Link
              to="/cars"
              className="shiny-button"
            >
              Browse Cars
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="car-details-page">
        <div className="car-details-container">
          <section className="car-details-error glass-card">
            <div className="car-details-error-icon">!</div>
            <h1>Unable to load car details</h1>
            <p>{error || "Please try again."}</p>
            <Link to="/cars" className="shiny-button">Browse Cars</Link>
          </section>
        </div>
      </main>
    );
  }

  const pricePerDay = Number(
    car.pricePerDay || 0
  );

  const includedKm = Number(
    car.includedKm ?? 300
  );

  const pricePerKm = Number(
    car.pricePerKm ?? 0
  );

  return (
    <main className="car-details-page">
      <div className="car-details-container">

        {/* =========================
            BREADCRUMB
        ========================== */}
        <div className="car-breadcrumb">
          <Link to="/">Home</Link>

          <span>/</span>

          <Link to="/cars">Cars</Link>

          <span>/</span>

          <span>{car.name}</span>
        </div>

        {/* =========================
            MAIN DETAILS
        ========================== */}
        <section className="car-details-main">

          {/* IMAGE */}
          <div className="car-details-gallery glass-card">
            <div className="car-main-image">

              {car.image ? (
                <img
                  src={car.image}
                  alt={car.name}
                />
              ) : (
                <div className="car-details-placeholder">
                  <span>🚗</span>
                  <small>
                    Vehicle Image
                  </small>
                </div>
              )}

              <div className="car-image-badge">
                <span
                  className={
                    car.available
                      ? ""
                      : "unavailable"
                  }
                />

                {car.available
                  ? "Available"
                  : "Currently Unavailable"}
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className="car-details-info">

            <div className="car-details-eyebrow">
              {car.brand} Vehicle
            </div>

            <h1>{car.name}</h1>

            <p className="car-details-description">
              {car.description ||
                "A comfortable and reliable vehicle for your journey."}
            </p>

            <div className="car-details-price">
              <strong>
                ₹
                {pricePerDay.toLocaleString(
                  "en-IN"
                )}
              </strong>

              <span>/ day</span>
            </div>

            <div className="car-details-specs">

              <div className="detail-spec">
                <span className="detail-spec-icon">
                  👥
                </span>

                <div>
                  <small>Seats</small>

                  <strong>
                    {car.seats} People
                  </strong>
                </div>
              </div>

              <div className="detail-spec">
                <span className="detail-spec-icon">
                  ⚙️
                </span>

                <div>
                  <small>
                    Transmission
                  </small>

                  <strong>
                    {car.transmission}
                  </strong>
                </div>
              </div>

              <div className="detail-spec">
                <span className="detail-spec-icon">
                  ⛽
                </span>

                <div>
                  <small>Fuel Type</small>

                  <strong>
                    {car.fuelType}
                  </strong>
                </div>
              </div>

              <div className="detail-spec">
                <span className="detail-spec-icon">
                  🏷️
                </span>

                <div>
                  <small>Category</small>

                  <strong>
                    {car.category}
                  </strong>
                </div>
              </div>

            </div>

            <div className="car-details-actions">

              {car.available ? (
                <Link
                  to={`/book/${car._id}`}
                  className="shiny-button car-details-book-btn"
                >
                  Book This Car →
                </Link>
              ) : (
                <button
                  type="button"
                  className="shiny-button car-details-book-btn"
                  disabled
                >
                  Currently Unavailable
                </button>
              )}

              <Link
                to="/cars"
                className="car-back-btn"
              >
                ← Back to Cars
              </Link>

            </div>
          </div>
        </section>

        {/* =========================
            RENTAL INFORMATION
        ========================== */}
        <section className="rental-details-section">

          <div className="section-heading">
            <span>
              Rental information
            </span>

            <h2>
              Know your rental terms.
            </h2>

            <p>
              Keep the important pricing
              information in mind before
              confirming your booking.
            </p>
          </div>

          <div className="rental-details-grid">

            <div className="rental-detail-card glass-card">
              <div className="rental-detail-icon">
                🛣️
              </div>

              <span>
                Included Distance
              </span>

              <strong>
                {includedKm} KM
              </strong>

              <p>
                Distance included in the
                rental plan before extra
                kilometre charges apply.
              </p>
            </div>

            <div className="rental-detail-card glass-card">
              <div className="rental-detail-icon">
                ₹
              </div>

              <span>
                Extra Distance
              </span>

              <strong>
                ₹{pricePerKm}/KM
              </strong>

              <p>
                Additional kilometre charges
                are calculated according to
                the active rental pricing.
              </p>
            </div>

            <div className="rental-detail-card glass-card">
              <div className="rental-detail-icon">
                📅
              </div>

              <span>Booking</span>

              <strong>
                Flexible Dates
              </strong>

              <p>
                Select your pickup and return
                dates during the booking
                process.
              </p>
            </div>

            <div className="rental-detail-card glass-card">
              <div className="rental-detail-icon">
                🔒
              </div>

              <span>
                Booking Safety
              </span>

              <strong>Secure</strong>

              <p>
                Booking availability is
                checked before creating your
                reservation.
              </p>
            </div>

          </div>
        </section>

        {/* =========================
            IMPORTANT NOTE
        ========================== */}
        <section className="car-details-note">
          <div className="note-card glass-card">

            <div className="note-icon">
              ℹ️
            </div>

            <div>
              <h3>
                Before booking
              </h3>

              <p>
                Please review the car
                details, rental dates and
                pricing information before
                confirming your reservation.
              </p>
            </div>

          </div>
        </section>

        {/* =========================
            CTA
        ========================== */}
        <section className="car-details-cta">

          <div className="car-details-cta-card glass-card">

            <div>
              <span>
                Ready for the journey?
              </span>

              <h2>
                Book your {car.name} today.
              </h2>

              <p>
                Select your rental dates
                and continue to the booking
                process.
              </p>
            </div>

            {car.available && (
              <Link
                to={`/book/${car._id}`}
                className="shiny-button"
              >
                Continue to Booking →
              </Link>
            )}

          </div>

        </section>

      </div>
    </main>
  );
}

export default CarDetails;

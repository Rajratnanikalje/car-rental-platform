import { API_URL } from "../config/api";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./BookCar.css";


function BookCar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    user,
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    pickupDate: "",
    returnDate: "",
    pickupLocation: "",
    paymentMethod: "cash",
  });

  // =========================
  // FETCH CAR
  // =========================
  useEffect(() => {
    const fetchCar = async () => {
      try {
        setLoading(true);
        setError("");
        setNotFound(false);

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
          "Fetch Car Error:",
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

    if (id) {
      fetchCar();
    } else {
      const timer = window.setTimeout(() => {
        setLoading(false);
        setError("Car ID is missing.");
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [id]);

  // =========================
  // TODAY
  // =========================
  const today = useMemo(() => {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================
  // TOTAL DAYS
  // =========================
  const totalDays = useMemo(() => {
    if (
      !formData.pickupDate ||
      !formData.returnDate
    ) {
      return 0;
    }

    const start = new Date(
      `${formData.pickupDate}T00:00:00`
    );

    const end = new Date(
      `${formData.returnDate}T00:00:00`
    );

    const difference =
      end.getTime() - start.getTime();

    if (difference <= 0) {
      return 0;
    }

    return Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );
  }, [
    formData.pickupDate,
    formData.returnDate,
  ]);

  // =========================
  // RENTAL AMOUNT
  // =========================
  const rentalAmount = useMemo(() => {
    if (!car || !totalDays) {
      return 0;
    }

    return (
      totalDays *
      Number(car.pricePerDay || 0)
    );
  }, [car, totalDays]);

  // =========================
  // KM PRICING
  // =========================
  const includedKm = Number(
    car?.includedKm ?? 300
  );

  const pricePerKm = Number(
    car?.pricePerKm ?? 0
  );

  // =========================
  // CURRENCY
  // =========================
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // =========================
  // SUBMIT BOOKING
  // =========================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Authentication
    if (!isLoggedIn || !user) {
      navigate("/login", {
        state: {
          from: `/book/${id}`,
        },
      });

      return;
    }

    if (car && car.available === false) {
      setError("This car is currently not available for booking.");
      return;
    }

    // =========================
    // VALIDATION
    // =========================
    if (
      !formData.pickupDate ||
      !formData.returnDate ||
      !formData.pickupLocation.trim()
    ) {
      setError(
        "Please provide pickup date, return date and pickup location."
      );

      return;
    }

    if (formData.pickupDate < today) {
      setError(
        "Pickup date cannot be in the past."
      );

      return;
    }

    if (
      formData.returnDate <=
      formData.pickupDate
    ) {
      setError(
        "Return date must be after pickup date."
      );

      return;
    }

    if (!car) {
      setError(
        "Car details are unavailable."
      );

      return;
    }

    if (!car.available) {
      setError(
        "This car is currently not available."
      );

      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/bookings`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          // IMPORTANT:
          // JWT is stored in HttpOnly cookie
          credentials: "include",

          body: JSON.stringify({
            car: car._id,
            pickupDate: formData.pickupDate,
            returnDate: formData.returnDate,
            pickupLocation: formData.pickupLocation.trim(),
            paymentMethod: formData.paymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Booking could not be created."
        );
      }

      if (!data?.booking) {
        throw new Error(
          "Booking response is incomplete."
        );
      }

      setSuccess(
        "Booking created successfully!"
      );

      // Redirect to payment page
      setTimeout(() => {
        navigate(`/payment/${data.booking._id}`, {
          replace: true,
        });
      }, 800);
    } catch (bookingError) {
      console.error(
        "Create Booking Error:",
        bookingError
      );

      setError(
        bookingError?.message ||
          "Unable to create booking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // AUTH LOADING
  // =========================
  if (authLoading) {
    return (
      <main className="book-page">
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
  // CAR LOADING
  // =========================
  if (loading) {
    return (
      <main className="book-page">
        <div className="book-loading">
          <div className="book-spinner" />

          <p>
            Loading car details...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // CAR NOT FOUND
  // =========================
  if (notFound) {
    return (
      <main className="book-page">
        <section className="book-error-card glass-card">
          <div className="book-error-icon">
            🚗
          </div>

          <h1>Car not found</h1>

          <p>
              We could not find the car you are trying to book.
          </p>

          <Link
            to="/cars"
            className="shiny-button"
          >
            Browse Cars
          </Link>
        </section>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="book-page">
        <section className="book-error-card glass-card">
          <div className="book-error-icon">!</div>
          <h1>Unable to load car details</h1>
          <p>{error || "Please try again."}</p>
          <Link to="/cars" className="shiny-button">Browse Cars</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="book-page">
      <div className="book-glow book-glow-purple" />
      <div className="book-glow book-glow-blue" />

      <section className="book-container">

        {/* =========================
            HEADER
        ========================== */}
                {/* ==========================================
            6-STEP STEPPER (REFERENCE IMAGE 1 TILE 3)
        =========================================== */}
        <div className="booking-stepper glass-card">
          <div className="stepper-step completed">
            <span className="step-circle">✓</span>
            <span>Search</span>
          </div>
          <span className="stepper-arrow">→</span>
          <div className="stepper-step completed">
            <span className="step-circle">✓</span>
            <span>Select</span>
          </div>
          <span className="stepper-arrow">→</span>
          <div className="stepper-step completed">
            <span className="step-circle">✓</span>
            <span>Details</span>
          </div>
          <span className="stepper-arrow">→</span>
          <div className="stepper-step completed">
            <span className="step-circle">✓</span>
            <span>Login</span>
          </div>
          <span className="stepper-arrow">→</span>
          <div className="stepper-step active">
            <span className="step-circle">5</span>
            <span>Confirm</span>
          </div>
          <span className="stepper-arrow">→</span>
          <div className="stepper-step">
            <span className="step-circle">6</span>
            <span>Payment</span>
          </div>
        </div>

<div className="book-header">
          <div>
            <span className="book-eyebrow">
              Reserve your ride
            </span>

            <h1>
              Book your{" "}
              <span>{car.name}</span>
            </h1>

            <p>
              Select your dates and pickup
              location to reserve this vehicle.
            </p>
          </div>

          <Link
            to={`/cars/${car._id}`}
            className="book-back-link"
          >
            ← Back to car
          </Link>
        </div>

        {/* =========================
            CONTENT
        ========================== */}
        <div className="book-grid">

          {/* =========================
              CAR SUMMARY
          ========================== */}
          <aside className="book-car-card glass-card">

            <div className="book-car-image">
              {car.image ? (
                <img
                  src={car.image}
                  alt={car.name}
                />
              ) : (
                <div className="book-car-placeholder">
                  🚗
                </div>
              )}
            </div>

            <div className="book-car-content">

              <span className="book-car-category">
                {car.category}
              </span>

              <h2>{car.name}</h2>

              <p className="book-car-brand">
                {car.brand} {car.model}
              </p>

              <div className="book-car-specs">
                <span>
                  ⚙️ {car.transmission}
                </span>

                <span>
                  ⛽ {car.fuelType}
                </span>

                <span>
                  👥 {car.seats} Seats
                </span>
              </div>

              <div className="book-price">
                <strong>
                  {formatCurrency(
                    car.pricePerDay
                  )}
                </strong>

                <span>/ day</span>
              </div>

              <div className="book-km-info">

                <div>
                  <span>
                    Included KM
                  </span>

                  <strong>
                    {includedKm} KM
                  </strong>
                </div>

                <div>
                  <span>
                    Extra KM
                  </span>

                  <strong>
                    {formatCurrency(
                      pricePerKm
                    )}
                    /KM
                  </strong>
                </div>

              </div>
            </div>
          </aside>

          {/* =========================
              BOOKING FORM
          ========================== */}
          <section className="book-form-card glass-card">

            <div className="book-form-header">

              <span className="book-card-label">
                Booking Details
              </span>

              <h2>
                Plan your rental
              </h2>

              <p>
                Choose when and where you want
                to pick up the car.
              </p>

            </div>

            {/* ERROR */}
            {error && (
              <div
                className="book-message book-message-error"
                role="alert"
              >
                <span>!</span>

                <p>{error}</p>
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div
                className="book-message book-message-success"
                role="status"
              >
                <span>✓</span>

                <p>{success}</p>
              </div>
            )}

            <form
              className="book-form"
              onSubmit={handleSubmit}
            >

              {/* =========================
                  DATES
              ========================== */}
              <div className="book-date-grid">

                <div className="book-form-group">
                  <label htmlFor="pickupDate">
                    Pickup date
                  </label>

                  <input
                    id="pickupDate"
                    name="pickupDate"
                    type="date"
                    min={today}
                    value={
                      formData.pickupDate
                    }
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="book-form-group">
                  <label htmlFor="returnDate">
                    Return date
                  </label>

                  <input
                    id="returnDate"
                    name="returnDate"
                    type="date"
                    min={
                      formData.pickupDate ||
                      today
                    }
                    value={
                      formData.returnDate
                    }
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>

              </div>

              {/* =========================
                  PICKUP LOCATION
              ========================== */}
              <div className="book-form-group">

                <label htmlFor="pickupLocation">
                  Pickup location
                </label>

                <input
                  id="pickupLocation"
                  name="pickupLocation"
                  type="text"
                  placeholder="Enter pickup location"
                  value={
                    formData.pickupLocation
                  }
                  onChange={handleChange}
                  disabled={submitting}
                  maxLength={200}
                  required
                />

                <small>
                  Example: Chikhli, Buldana
                </small>

              </div>

              {/* =========================
                  PAYMENT METHOD
              ========================== */}
              <div className="book-form-group">
                <label>Payment method</label>
                <div className="book-payment-options">
                  <label className={`book-payment-option ${formData.paymentMethod === "cash" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === "cash"}
                      onChange={handleChange}
                    />
                    <span className="book-payment-icon">💵</span>
                    <span className="book-payment-label">
                      <strong>Pay with Cash</strong>
                      <small>Pay driver at pickup</small>
                    </span>
                  </label>
                  <label className={`book-payment-option ${formData.paymentMethod === "online" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === "online"}
                      onChange={handleChange}
                    />
                    <span className="book-payment-icon">💳</span>
                    <span className="book-payment-label">
                      <strong>Pay Online</strong>
                      <small>Secure payment now</small>
                    </span>
                  </label>
                </div>
              </div>

              {/* =========================
                  SUMMARY
              ========================== */}
              <div className="book-summary">

                <div className="book-summary-title">
                  <h3>
                    Booking Summary
                  </h3>
                </div>

                <div className="book-summary-row">
                  <span>Car</span>

                  <strong>
                    {car.name}
                  </strong>
                </div>

                <div className="book-summary-row">
                  <span>
                    Rental days
                  </span>

                  <strong>
                    {totalDays || "—"}
                  </strong>
                </div>

                <div className="book-summary-row">
                  <span>
                    Price per day
                  </span>

                  <strong>
                    {formatCurrency(
                      car.pricePerDay
                    )}
                  </strong>
                </div>

                <div className="book-summary-row">
                  <span>
                    Included KM
                  </span>

                  <strong>
                    {includedKm} KM
                  </strong>
                </div>

                <div className="book-summary-divider" />

                <div className="book-summary-total">

                  <span>
                    Estimated rental
                  </span>

                  <strong>
                    {formatCurrency(
                      rentalAmount
                    )}
                  </strong>

                </div>

                <p className="book-summary-note">
                  Extra KM charges, if
                  applicable, are calculated
                  after the actual KM is recorded.
                </p>

              </div>

              {/* =========================
                  SUBMIT
              ========================== */}
              <button
                type="submit"
                className="shiny-button book-submit"
                disabled={
                  submitting ||
                  !car.available
                }
              >
                {submitting
                  ? "Creating Booking..."
                  : `Confirm Booking • ${formatCurrency(
                      rentalAmount
                    )}`}
              </button>

            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

export default BookCar;

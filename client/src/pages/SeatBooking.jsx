import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./SeatBooking.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function SeatBooking() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rides, setRides] = useState([]);

  const [filters, setFilters] = useState({
    pickupPoint: "",
    destination: "",
  });

  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    seats: 1,
    pickupLocation: "",
    destination: "",
    paymentMethod: "cash",
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // =========================
  // FETCH RIDES
  // =========================
  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        setError("");

        let url = `${API_URL}/seat-rides`;

        // Add filters
        const params = new URLSearchParams();
        if (filters.pickupPoint.trim()) {
          params.append("pickupPoint", filters.pickupPoint.trim());
        }
        if (filters.destination.trim()) {
          params.append("destination", filters.destination.trim());
        }

        if (params.toString()) {
          url += "?" + params.toString();
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load rides");
        }

        setRides(Array.isArray(data?.rides) ? data.rides : []);
      } catch (err) {
        console.error("Fetch Rides Error:", err);
        setError(err.message || "Failed to load rides");
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [filters]);

  // =========================
  // FILTER CHANGE
  // =========================
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // BOOKING FORM CHANGE
  // =========================
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: name === "seats" ? Number(value) : value,
    }));
  };

  // =========================
  // HANDLE BOOKING
  // =========================
  const handleBooking = async (ride) => {
    if (!isLoggedIn) {
      return navigate("/login");
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      if (
        !bookingForm.pickupLocation.trim() ||
        !bookingForm.destination.trim() ||
        bookingForm.seats < 1
      ) {
        setBookingError("Please provide all required booking details");
        return;
      }

      const payload = {
        seats: bookingForm.seats,
        pickupLocation: bookingForm.pickupLocation.trim(),
        destination: bookingForm.destination.trim(),
        paymentMethod: bookingForm.paymentMethod,
      };

      const response = await fetch(`${API_URL}/seat-rides/${ride._id}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Booking failed");
      }

      alert("Booking confirmed! Check-in code: " + data.booking?.checkInOtp);
      setSelectedRide(null);
      setBookingForm({
        seats: 1,
        pickupLocation: "",
        destination: "",
        paymentMethod: "cash",
      });

      // Refresh rides
      setRides((prev) =>
        prev.map((r) =>
          r._id === ride._id
            ? { ...r, availableSeats: r.availableSeats - bookingForm.seats }
            : r
        )
      );
    } catch (err) {
      setBookingError(err.message || "Failed to book seats");
    } finally {
      setBookingLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="seat-booking-page">
        <section className="seat-listing section">
          <div className="seat-listing-header">
            <span className="seat-listing-label">Shared Rides</span>
            <h2>Book a seat on a shared ride</h2>
          </div>

          <div className="seat-loading">
            <div className="book-spinner" />
            <p>Loading available rides...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="seat-booking-page">
      {/* =========================
          HERO SECTION
      ========================== */}
      <section className="seat-hero">
        <div className="seat-hero-glow seat-hero-glow-1" />
        <div className="seat-hero-glow seat-hero-glow-2" />

        <div className="seat-hero-content">
          <h1>🚌 Shared Ride Bookings</h1>
          <p>Travel affordably by sharing rides with others</p>
        </div>
      </section>

      {/* =========================
          FILTERS
      ========================== */}
      <section className="seat-filters section">
        <div className="filters-container">
          <input
            type="text"
            name="pickupPoint"
            placeholder="Pickup location"
            value={filters.pickupPoint}
            onChange={handleFilterChange}
            className="filter-input"
          />

          <input
            type="text"
            name="destination"
            placeholder="Destination"
            value={filters.destination}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
      </section>

      {/* =========================
          ERROR
      ========================== */}
      {error && (
        <section className="section">
          <div className="alert alert-error">{error}</div>
        </section>
      )}

      {/* =========================
          RIDES LISTING
      ========================== */}
      <section className="seat-listing section">
        <div className="seat-listing-header">
          <span className="seat-listing-label">Available Rides</span>
          <h2>Found {rides.length} ride(s)</h2>
        </div>

        {rides.length === 0 ? (
          <div className="no-rides">
            <p>No rides available for your search</p>
          </div>
        ) : (
          <div className="rides-grid">
            {rides.map((ride) => (
              <div key={ride._id} className="ride-card glass-card">
                <div className="ride-header">
                  <h3>
                    {ride.pickupPoint} → {ride.destination}
                  </h3>
                  <span
                    className={`availability ${
                      ride.availableSeats === 0 ? "full" : "available"
                    }`}
                  >
                    {ride.availableSeats === 0
                      ? "Full"
                      : `${ride.availableSeats} seats`}
                  </span>
                </div>

                <div className="ride-details">
                  <div className="detail">
                    <span className="detail-label">Vehicle</span>
                    <span className="detail-value">
                      {ride.car?.brand} {ride.car?.model}
                    </span>
                  </div>

                  <div className="detail">
                    <span className="detail-label">Departure</span>
                    <span className="detail-value">
                      {new Date(ride.departureAt).toLocaleDateString()} at{" "}
                      {new Date(ride.departureAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="detail">
                    <span className="detail-label">Price per Seat</span>
                    <span className="detail-value">₹{ride.pricePerSeat}</span>
                  </div>

                  <div className="detail">
                    <span className="detail-label">Total Capacity</span>
                    <span className="detail-value">{ride.totalSeats} passengers</span>
                  </div>
                </div>

                {ride.availableSeats > 0 && (
                  <button
                    onClick={() => setSelectedRide(ride._id)}
                    className="shiny-button"
                    style={{ width: "100%" }}
                  >
                    Book Now
                  </button>
                )}

                {ride.availableSeats === 0 && (
                  <button className="shiny-button" disabled style={{ width: "100%" }}>
                    Ride Full
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================
          BOOKING MODAL
      ========================== */}
      {selectedRide && (
        <div className="booking-modal-overlay" onClick={() => setSelectedRide(null)}>
          <div
            className="booking-modal glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Book Your Seats</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedRide(null)}
              >
                ✕
              </button>
            </div>

            {bookingError && <div className="alert alert-error">{bookingError}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const ride = rides.find((r) => r._id === selectedRide);
                if (ride) {
                  handleBooking(ride);
                }
              }}
            >
              <div className="form-group">
                <label htmlFor="seats">Number of Seats *</label>
                <select
                  id="seats"
                  name="seats"
                  value={bookingForm.seats}
                  onChange={handleBookingChange}
                  required
                >
                  {Array.from(
                    {
                      length: rides.find((r) => r._id === selectedRide)
                        ?.availableSeats || 1,
                    },
                    (_, i) => i + 1
                  ).map((num) => (
                    <option key={num} value={num}>
                      {num} seat{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pickupLocation">Pickup Location *</label>
                <input
                  type="text"
                  id="pickupLocation"
                  name="pickupLocation"
                  placeholder="Where will you board?"
                  value={bookingForm.pickupLocation}
                  onChange={handleBookingChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="destination">Destination *</label>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  placeholder="Where will you get down?"
                  value={bookingForm.destination}
                  onChange={handleBookingChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method *</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={bookingForm.paymentMethod}
                  onChange={handleBookingChange}
                  required
                >
                  <option value="cash">Cash (Pay Driver)</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>

              {(() => {
                const ride = rides.find((r) => r._id === selectedRide);
                const totalFare =
                  (ride?.pricePerSeat || 0) * bookingForm.seats;
                return (
                  <div className="fare-summary">
                    <div className="fare-line">
                      <span>₹{ride?.pricePerSeat} × {bookingForm.seats} seats</span>
                      <span>₹{totalFare}</span>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="shiny-button"
                disabled={bookingLoading}
                style={{ width: "100%" }}
              >
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default SeatBooking;

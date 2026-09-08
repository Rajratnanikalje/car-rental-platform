import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./SeatBooking.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function SeatBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rides, setRides] = useState([]);

  const [filters, setFilters] = useState({
    pickupPoint: searchParams.get("pickupPoint") || "",
    destination: searchParams.get("destination") || "",
  });

  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [passengerName, setPassengerName] = useState(user?.name || "");
  const [passengerPhone, setPassengerPhone] = useState(user?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch Rides
  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        setError("");

        let url = `${API_URL}/seat-rides`;
        const params = new URLSearchParams();
        if (filters.pickupPoint.trim()) params.append("pickupPoint", filters.pickupPoint.trim());
        if (filters.destination.trim()) params.append("destination", filters.destination.trim());
        if (params.toString()) url += "?" + params.toString();

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) throw new Error(data?.message || "Failed to load rides");
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

  const activeRide = rides.find((r) => r._id === selectedRide);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!activeRide) return;

    try {
      setBookingLoading(true);
      setBookingError("");

      const payload = {
        seats: selectedSeats,
        pickupLocation: activeRide.pickupPoint,
        destination: activeRide.destination,
        paymentMethod,
      };

      const response = await fetch(`${API_URL}/seat-rides/${activeRide._id}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to confirm seat booking");
      }

      setBookingSuccess({
        booking: data.booking,
        checkInOtp: data.checkInOtp,
        ride: activeRide,
      });

      // Update remaining seats in local list
      setRides((prev) =>
        prev.map((r) =>
          r._id === activeRide._id
            ? { ...r, availableSeats: Math.max(0, r.availableSeats - selectedSeats) }
            : r
        )
      );
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <main className="seat-booking-page">
      <div className="seat-hero-section">
        <span className="seat-eyebrow">Smart Intercity Travel</span>
        <h1>Shared <span>Seat Rides</span></h1>
        <p>Book single or multiple seats on scheduled verified routes. Save money, travel safely.</p>
      </div>

      {/* Filter Bar */}
      <div className="seat-filter-container glass-card">
        <div className="seat-filter-inputs">
          <div className="filter-field">
            <label>Pickup Point</label>
            <input
              type="text"
              placeholder="e.g. Pune"
              value={filters.pickupPoint}
              onChange={(e) => setFilters((p) => ({ ...p, pickupPoint: e.target.value }))}
            />
          </div>
          <div className="filter-field">
            <label>Destination</label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              value={filters.destination}
              onChange={(e) => setFilters((p) => ({ ...p, destination: e.target.value }))}
            />
          </div>
          <button
            type="button"
            className="filter-reset-btn"
            onClick={() => setFilters({ pickupPoint: "", destination: "" })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Rides Listing */}
      <div className="seat-rides-list-container">
        {loading ? (
          <div className="seat-loading-state">
            <div className="seat-spinner" />
            <p>Loading available scheduled rides...</p>
          </div>
        ) : error ? (
          <div className="seat-error-box glass-card">{error}</div>
        ) : rides.length === 0 ? (
          <div className="seat-empty-box glass-card">
            <h3>No Scheduled Rides Found</h3>
            <p>Try searching for a different pickup point or destination.</p>
          </div>
        ) : (
          <div className="seat-cards-grid">
            {rides.map((ride) => (
              <div key={ride._id} className="seat-card-item glass-card">
                <div className="seat-card-header">
                  <div className="route-title">
                    <h3>{ride.pickupPoint?.split(",")[0]} ➔ {ride.destination?.split(",")[0]}</h3>
                    <span className="route-full-path">
                      {ride.pickupPoint} to {ride.destination}
                    </span>
                  </div>
                  <span className={`seat-avail-tag ${ride.availableSeats === 0 ? "full" : ""}`}>
                    {ride.availableSeats === 0 ? "Full" : `${ride.availableSeats} seats left`}
                  </span>
                </div>

                <div className="seat-card-details">
                  <div className="detail-row">
                    <span>📅 Departure:</span>
                    <strong>
                      {new Date(ride.departureAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} |{" "}
                      {new Date(ride.departureAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>🚗 Vehicle:</span>
                    <strong>{ride.car?.brand} {ride.car?.model} ({ride.totalSeats} Seats)</strong>
                  </div>
                  <div className="detail-row">
                    <span>💰 Price per seat:</span>
                    <strong className="seat-price-highlight">₹{ride.pricePerSeat}</strong>
                  </div>
                </div>

                {ride.availableSeats > 0 ? (
                  <button
                    type="button"
                    className="shiny-button seat-select-action"
                    onClick={() => {
                      setSelectedRide(ride._id);
                      setSelectedSeats(1);
                      setBookingError("");
                      setBookingSuccess(null);
                    }}
                  >
                    Select & Book →
                  </button>
                ) : (
                  <button type="button" className="seat-select-action disabled" disabled>
                    Ride Full
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          BOOKING MODAL (REFERENCE IMAGE 1 TILE 4)
      =========================================== */}
      {selectedRide && activeRide && (
        <div className="seat-modal-backdrop" onClick={() => setSelectedRide(null)}>
          <div className="seat-booking-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h2>{activeRide.pickupPoint?.split(",")[0]} ➔ {activeRide.destination?.split(",")[0]}</h2>
                <span className="modal-subhead">
                  {new Date(activeRide.departureAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} |{" "}
                  {new Date(activeRide.departureAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedRide(null)}>✕</button>
            </div>

            {bookingSuccess ? (
              <div className="booking-success-view">
                <div className="success-badge-icon">✓</div>
                <h3>Seat Booking Confirmed!</h3>
                <p>Your seats are securely reserved. Present your OTP to the driver at boarding.</p>

                <div className="check-in-otp-display">
                  <span className="otp-label">BOARDING CHECK-IN OTP</span>
                  <strong className="otp-digits">{bookingSuccess.checkInOtp}</strong>
                  <small>Share this code with your driver when boarding</small>
                </div>

                <button
                  type="button"
                  className="shiny-button modal-done-btn"
                  onClick={() => {
                    setSelectedRide(null);
                    setBookingSuccess(null);
                  }}
                >
                  Close & View Rides
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="seat-booking-form">
                {/* Vehicle info card */}
                <div className="modal-vehicle-banner">
                  <div>
                    <strong>{activeRide.car?.brand} {activeRide.car?.model}</strong>
                    <span>{activeRide.totalSeats} Seater AC Vehicle</span>
                  </div>
                  <div className="price-badge-wrap">
                    <span className="seat-price-val">₹{activeRide.pricePerSeat}</span>
                    <small>/ seat</small>
                  </div>
                </div>

                {/* SELECT SEATS (INTERACTIVE BUTTONS 1-6) */}
                <div className="seat-selector-group">
                  <label>Select Seats (Max available: {activeRide.availableSeats})</label>
                  <div className="seat-number-buttons">
                    {Array.from({ length: Math.min(activeRide.availableSeats, 6) }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`seat-num-btn ${selectedSeats === num ? "selected" : ""}`}
                        onClick={() => setSelectedSeats(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PASSENGER DETAILS */}
                <div className="passenger-inputs-section">
                  <label>Passenger Details</label>
                  <div className="passenger-row">
                    <input
                      type="text"
                      placeholder="Passenger Name"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* PAYMENT METHOD */}
                <div className="seat-payment-method">
                  <label>Payment Method</label>
                  <div className="payment-options-row">
                    <label className={`pay-choice ${paymentMethod === "cash" ? "active" : ""}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={() => setPaymentMethod("cash")}
                      />
                      💵 Cash to Driver
                    </label>
                    <label className={`pay-choice ${paymentMethod === "online" ? "active" : ""}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === "online"}
                        onChange={() => setPaymentMethod("online")}
                      />
                      💳 Online Payment
                    </label>
                  </div>
                </div>

                {/* TOTAL FARE & SUBMIT */}
                <div className="modal-fare-footer">
                  <div className="fare-summary-left">
                    <span>Total Fare</span>
                    <strong>₹{selectedSeats * activeRide.pricePerSeat}</strong>
                  </div>
                  <button type="submit" className="shiny-button seat-confirm-btn" disabled={bookingLoading}>
                    {bookingLoading ? "Confirming..." : "Book Seats →"}
                  </button>
                </div>

                {bookingError && <div className="modal-error-alert">{bookingError}</div>}
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default SeatBooking;

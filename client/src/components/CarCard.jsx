import { Link } from "react-router-dom";
import "./CarCard.css";

function CarCard({ car, bookingQuery = "" }) {
  const {
    _id,
    name,
    brand,
    image,
    pricePerDay,
    seats = 5,
    transmission = "Automatic",
    fuelType = "Petrol",
  } = car;

  const isAvailable = car.available !== false;

  return (
    <article className="rideon-car-card">
      <div className="rideon-car-image-box">
        {image ? (
          <img
            src={image}
            alt={`${brand || ""} ${name}`}
            loading="lazy"
          />
        ) : (
          <div className="rideon-car-placeholder">
            <span>🚗</span>
            <small>Vehicle Image</small>
          </div>
        )}

        <span className={`rideon-car-status ${isAvailable ? "status-avail" : "status-unavail"}`}>
          <span className="status-dot" />
          {isAvailable ? "Available" : "Booked"}
        </span>
      </div>

      <div className="rideon-car-body">
        <div className="rideon-car-header">
          <span className="rideon-car-brand">{brand || "Premium Fleet"}</span>
          <h3 className="rideon-car-title">{name}</h3>
        </div>

        <div className="rideon-car-specs">
          <span className="spec-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {seats} Seats
          </span>
          <span className="spec-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
              <path d="M15 10h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4" />
            </svg>
            {fuelType}
          </span>
          <span className="spec-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {transmission}
          </span>
        </div>

        <div className="rideon-car-pricing">
          <div className="price-amount">
            <strong>₹{pricePerDay?.toLocaleString("en-IN") || "—"}</strong>
            <span className="price-unit">/ day</span>
          </div>
        </div>

        <div className="rideon-car-actions">
          <Link to={`/cars/${_id}`} className="rideon-btn-details">
            View Details
          </Link>

          {isAvailable ? (
            <Link to={`/book/${_id}${bookingQuery ? `?${bookingQuery}` : ""}`} className="rideon-btn-book">
              Book Now
            </Link>
          ) : (
            <button type="button" className="rideon-btn-disabled" disabled>
              Unavailable
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default CarCard;

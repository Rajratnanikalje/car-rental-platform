import { Link } from "react-router-dom";
import "./CarCard.css";

function CarCard({ car }) {
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
    <article className="car-card glass-card">
      <div className="car-card-image">
        {image ? (
          <img src={image} alt={`${brand || ""} ${name}`} />
        ) : (
          <div className="car-image-placeholder">
            <span>🚗</span>
            <small>Car Image</small>
          </div>
        )}

        <div className={`car-availability ${isAvailable ? "available" : "unavailable"}`}>
          <span />
          {isAvailable ? "Available" : "Unavailable"}
        </div>
      </div>

      <div className="car-card-content">
        <div className="car-card-title">
          <div>
            <span className="car-brand">{brand || "Premium"}</span>
            <h3>{name}</h3>
          </div>

          <div className="car-price">
            <strong>₹{pricePerDay?.toLocaleString("en-IN") || "—"}</strong>
            <span>/ day</span>
          </div>
        </div>

        <div className="car-specs">
          <span>👤 {seats} Seats</span>
          <span>⚙ {transmission}</span>
          <span>⛽ {fuelType}</span>
        </div>

        <div className="car-card-actions">
          <Link to={`/cars/${_id}`} className="car-details-btn">
            View Details
          </Link>

          {isAvailable ? (
            <Link to={`/book/${_id}`} className="shiny-button car-book-btn">
              Book Now
            </Link>
          ) : (
            <button
              type="button"
              className="car-book-btn disabled"
              disabled
              title="This vehicle is currently unavailable"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default CarCard;
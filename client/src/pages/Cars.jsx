import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CarCard from "../components/CarCard";
import "./Cars.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [fuelType, setFuelType] = useState("all");
  const [seats, setSeats] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  // =========================
  // FETCH CARS
  // =========================
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/cars`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to load cars."
          );
        }

        setCars(Array.isArray(data?.cars) ? data.cars : []);
      } catch (fetchError) {
        console.error("Fetch Cars Error:", fetchError);

        setError(
          fetchError?.message ||
            "Unable to load cars. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  // =========================
  // FILTER + SEARCH + SORT
  // =========================
  const filteredCars = useMemo(() => {
    let result = [...cars];

    // Search
    if (search.trim()) {
      const searchValue = search.trim().toLowerCase();

      result = result.filter((car) => {
        return (
          car.name?.toLowerCase().includes(searchValue) ||
          car.brand?.toLowerCase().includes(searchValue) ||
          car.model?.toLowerCase().includes(searchValue) ||
          car.category?.toLowerCase().includes(searchValue)
        );
      });
    }

    // Fuel
    if (fuelType !== "all") {
      result = result.filter(
        (car) =>
          car.fuelType?.toLowerCase() ===
          fuelType.toLowerCase()
      );
    }

    // Seats
    if (seats !== "all") {
      result = result.filter(
        (car) => Number(car.seats) === Number(seats)
      );
    }

    // Sort
    if (sortBy === "low-high") {
      result.sort(
        (a, b) =>
          Number(a.pricePerDay || 0) -
          Number(b.pricePerDay || 0)
      );
    }

    if (sortBy === "high-low") {
      result.sort(
        (a, b) =>
          Number(b.pricePerDay || 0) -
          Number(a.pricePerDay || 0)
      );
    }

    if (sortBy === "name") {
      result.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    }

    return result;
  }, [cars, search, fuelType, seats, sortBy]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="cars-page">
        <section className="cars-listing section">
          <div className="cars-listing-header">
            <div>
              <span className="cars-listing-label">
                Available Cars
              </span>

              <h2>Choose your ride</h2>
            </div>
          </div>

          <div className="cars-loading">
            <div className="book-spinner" />
            <p>Loading available cars...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="cars-page">
      {/* =========================
          PAGE HERO
      ========================== */}
      <section className="cars-hero">
        <div className="cars-hero-glow cars-hero-glow-purple" />
        <div className="cars-hero-glow cars-hero-glow-blue" />

        <div className="cars-hero-content">
          <span className="cars-eyebrow">
            Our Fleet
          </span>

          <h1>
            Find the right car
            <span> for your journey.</span>
          </h1>

          <p>
            Explore our available vehicles and choose
            a car that matches your trip, comfort and
            budget.
          </p>

          <div className="cars-hero-stats">
            <div>
              <strong>Premium</strong>
              <span>Vehicles</span>
            </div>

            <div className="cars-stat-divider" />

            <div>
              <strong>Transparent</strong>
              <span>Pricing</span>
            </div>

            <div className="cars-stat-divider" />

            <div>
              <strong>Easy</strong>
              <span>Booking</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          SEARCH + FILTERS
      ========================== */}
      <section className="cars-controls section">
        <div className="cars-search-bar glass-card">
          <div className="cars-search-input-wrapper">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              className="glass-input"
              placeholder="Search by car name or brand..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="cars-filter-group">
            <select
              className="cars-select"
              value={fuelType}
              onChange={(event) =>
                setFuelType(event.target.value)
              }
            >
              <option value="all">
                All Fuel Types
              </option>

              <option value="petrol">
                Petrol
              </option>

              <option value="diesel">
                Diesel
              </option>

              <option value="cng">
                CNG
              </option>

              <option value="electric">
                Electric
              </option>

              <option value="hybrid">
                Hybrid
              </option>
            </select>

            <select
              className="cars-select"
              value={seats}
              onChange={(event) =>
                setSeats(event.target.value)
              }
            >
              <option value="all">
                All Seats
              </option>

              <option value="4">4 Seats</option>
              <option value="5">5 Seats</option>
              <option value="6">6 Seats</option>
              <option value="7">7 Seats</option>
            </select>

            <select
              className="cars-select"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
            >
              <option value="default">
                Sort By
              </option>

              <option value="low-high">
                Price: Low to High
              </option>

              <option value="high-low">
                Price: High to Low
              </option>

              <option value="name">
                Name
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* =========================
          CARS LISTING
      ========================== */}
      <section className="cars-listing section">
        <div className="cars-listing-header">
          <div>
            <span className="cars-listing-label">
              Available Cars
            </span>

            <h2>Choose your ride</h2>
          </div>

          <span className="cars-count">
            {filteredCars.length} Vehicles
          </span>
        </div>

        {/* ERROR */}
        {error && (
          <div className="cars-error glass-card">
            <span>!</span>

            <div>
              <strong>
                Unable to load cars
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {!error && filteredCars.length === 0 && (
          <div className="cars-empty glass-card">
            <div>🚗</div>

            <h3>No cars found</h3>

            <p>
              Try changing your search or filter
              options.
            </p>
          </div>
        )}

        {/* CARS */}
        {filteredCars.length > 0 && (
          <div className="cars-grid">
            {filteredCars.map((car) => (
              <CarCard
                key={car._id}
                car={car}
              />
            ))}
          </div>
        )}
      </section>

      {/* =========================
          RENTAL INFO
      ========================== */}
      <section className="cars-rental-info section">
        <div className="rental-info-card glass-card">
          <div className="rental-info-content">
            <span>Know before you book</span>

            <h2>Simple rental pricing.</h2>

            <p>
              Our rental plans are designed to keep
              pricing clear and easy to understand.
              Check the vehicle details and booking
              terms before confirming your journey.
            </p>
          </div>

          <div className="rental-info-items">
            <div className="rental-info-item">
              <strong>Vehicle-specific</strong>
              <span>Included KM</span>
            </div>

            <div className="rental-info-item">
              <strong>Configured</strong>
              <span>Extra KM pricing</span>
            </div>

            <div className="rental-info-item">
              <strong>Easy</strong>
              <span>Online Booking</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          CTA
      ========================== */}
      <section className="cars-cta section">
        <div className="cars-cta-card glass-card">
          <div>
            <span>Need help choosing?</span>

            <h2>
              Find the car that fits your trip.
            </h2>

            <p>
              Compare the available vehicles and
              choose the one that works best for
              your journey.
            </p>
          </div>

          <Link
            to="/"
            className="shiny-button"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Cars;

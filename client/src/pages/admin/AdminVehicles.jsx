import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import AdminImageUpload from "../../components/admin/AdminImageUpload";
import "./AdminPages.css";


export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    category: "Sedan",
    transmission: "Automatic",
    fuelType: "Petrol",
    seats: 5,
    pricePerDay: 2500,
    pricePerKm: 15,
    includedKm: 300,
    location: "Mumbai",
    image: "",
    description: "",
  });

  const fetchVehicles = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      setError("");
      const response = await fetch(`${API_URL}/cars`);
      const data = await response.json();
      if (response.ok && data.success) {
        setVehicles(Array.isArray(data.cars) ? data.cars : []);
      } else {
        throw new Error(data?.message || "Failed to load vehicles");
      }
    } catch (err) {
      console.error("Fetch vehicles error:", err);
      setError(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchVehicles, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["year", "seats", "pricePerDay", "pricePerKm", "includedKm"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const resetForm = () => {
    setEditingVehicle(null);
    setForm({
      name: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      category: "Sedan",
      transmission: "Automatic",
      fuelType: "Petrol",
      seats: 5,
      pricePerDay: 2500,
      pricePerKm: 15,
      includedKm: 300,
      location: "Mumbai",
      image: "",
      description: "",
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (car) => {
    setEditingVehicle(car);
    setForm({
      name: car.name || "",
      brand: car.brand || "",
      model: car.model || "",
      year: car.year || new Date().getFullYear(),
      category: car.category || "Sedan",
      transmission: car.transmission || "Automatic",
      fuelType: car.fuelType || "Petrol",
      seats: car.seats || 5,
      pricePerDay: car.pricePerDay || 2500,
      pricePerKm: car.pricePerKm || 15,
      includedKm: car.includedKm || 300,
      location: car.location || "Mumbai",
      image: car.image || "",
      description: car.description || "",
    });
    setShowAddModal(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand || !form.pricePerDay) {
      alert("Please fill in the required fields: Name, Brand, Price/Day.");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingVehicle ? `${API_URL}/cars/${editingVehicle._id}` : `${API_URL}/cars`;
      const method = editingVehicle ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || (editingVehicle ? "Failed to update vehicle" : "Failed to create vehicle"));
      }

      alert(editingVehicle ? "✅ Vehicle updated successfully!" : "✅ Vehicle added to fleet successfully!");
      setShowAddModal(false);
      resetForm();
      fetchVehicles();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (vehicleId, currentAvailable) => {
    try {
      const response = await fetch(`${API_URL}/cars/${vehicleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ available: !currentAvailable }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to update availability");
      }

      fetchVehicles();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (vehicleId, vehicleName) => {
    if (!window.confirm(`Are you sure you want to remove "${vehicleName}" from the fleet?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/cars/${vehicleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to delete vehicle");
      }

      alert("Vehicle removed from fleet.");
      fetchVehicles();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Fleet & Vehicle Management</h1>
          <p>Register new vehicles, manage availability, and set daily and extra-kilometer pricing.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-primary" onClick={handleOpenAdd}>
            + Add Vehicle
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", padding: "14px 18px", borderRadius: "10px" }}>
          {error}
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Registered Fleet ({vehicles.length})</h2>
          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={fetchVehicles}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Loading vehicle fleet...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="admin-empty-box">
            <div className="admin-empty-icon">🚗</div>
            <h3>No vehicles in fleet</h3>
            <p>Click "+ Add Vehicle" to register the first rental car.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Seats</th>
                  <th>Price / Day</th>
                  <th>Extra KM Rate</th>
                  <th>Included KM</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((car) => (
                  <tr key={car._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {car.image ? (
                          <img
                            src={car.image}
                            alt={car.name}
                            style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "6px" }}
                          />
                        ) : (
                          <div style={{ width: "48px", height: "36px", background: "#1e293b", borderRadius: "6px", display: "grid", placeItems: "center" }}>🚗</div>
                        )}
                        <div>
                          <strong style={{ color: "#f8fafc", display: "block" }}>{car.name}</strong>
                          <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>{car.brand} {car.model ? `• ${car.model}` : ""} ({car.transmission || "Auto"})</span>
                        </div>
                      </div>
                    </td>
                    <td>{car.category || "Sedan"}</td>
                    <td>{car.seats || 5} seats</td>
                    <td><strong>₹{Number(car.pricePerDay || 0).toLocaleString("en-IN")}</strong></td>
                    <td>₹{car.pricePerKm || 0}/km</td>
                    <td>{car.includedKm || 300} km</td>
                    <td>
                      <span className={`admin-badge ${car.available !== false ? "badge-green" : "badge-red"}`}>
                        {car.available !== false ? "● Available" : "○ Unavailable"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                          onClick={() => handleOpenEdit(car)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className={`admin-btn admin-btn-sm ${car.available !== false ? "admin-btn-secondary" : "admin-btn-success"}`}
                          onClick={() => toggleAvailability(car._id, car.available !== false)}
                        >
                          {car.available !== false ? "Mark Unavailable" : "Mark Available"}
                        </button>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => handleDelete(car._id, car.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingVehicle ? "✏️ Edit Fleet Vehicle" : "+ Register New Fleet Vehicle"}</h3>
              <button className="admin-modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>✕</button>
            </div>
            <form onSubmit={handleSaveVehicle}>
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label>Vehicle Name *</label>
                    <input type="text" name="name" placeholder="e.g. Honda City ZX" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Brand *</label>
                    <input type="text" name="brand" placeholder="e.g. Honda" value={form.brand} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Model</label>
                    <input type="text" name="model" placeholder="e.g. ZX 2024" value={form.model} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleChange}>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Luxury">Luxury</option>
                      <option value="EV">EV</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Transmission</label>
                    <select name="transmission" value={form.transmission} onChange={handleChange}>
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Fuel Type</label>
                    <select name="fuelType" value={form.fuelType} onChange={handleChange}>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Seats</label>
                    <input type="number" name="seats" min="2" max="10" value={form.seats} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Base Price / Day (₹) *</label>
                    <input type="number" name="pricePerDay" min="0" value={form.pricePerDay} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Extra KM Price (₹/km) *</label>
                    <input type="number" name="pricePerKm" min="0" value={form.pricePerKm} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Included KM / Day *</label>
                    <input type="number" name="includedKm" min="0" value={form.includedKm} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group full-width">
                    <AdminImageUpload
                      value={form.image}
                      onChange={(img) => setForm((prev) => ({ ...prev, image: img }))}
                      label="Vehicle Photo (Upload from Gallery / Files)"
                      helpText="Choose photo directly from phone or computer gallery (JPG, PNG, WEBP)"
                      previewHeight="190px"
                    />
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Description / Features</label>
                    <textarea name="description" rows="3" placeholder="Features, accessories, guidelines..." value={form.description} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : editingVehicle ? "Update Vehicle" : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

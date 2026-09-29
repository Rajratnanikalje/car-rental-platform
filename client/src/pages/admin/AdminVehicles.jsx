import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import AdminImageUpload from "../../components/admin/AdminImageUpload";
import "./AdminPages.css";


export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cleanupPlan, setCleanupPlan] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    category: "Sedan",
    transmission: "Automatic",
    fuelType: "Petrol",
    seats: 5,
    pricePerDay: "",
    pricePerKm: "",
    includedKm: 300,
    location: "",
    serviceAreas: [],
    image: "",
    description: "",
    registrationNumber: "",
  });

  const fetchVehicles = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      setError("");
      const response = await fetch(`${API_URL}/cars/admin/all`, { credentials: "include" });
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
    fetch(`${API_URL}/service-areas`).then((response) => response.json()).then((data) => setServiceAreas(data.areas || [])).catch(() => setServiceAreas([]));
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
      pricePerDay: "",
      pricePerKm: "",
      includedKm: 300,
      location: "",
      serviceAreas: [],
      image: "",
      description: "",
      registrationNumber: "",
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
      pricePerDay: car.pricePerDay ?? "",
      pricePerKm: car.pricePerKm ?? "",
      includedKm: car.includedKm || 300,
      location: car.location || "",
      serviceAreas: (car.serviceAreas || []).map((area) => String(area?._id || area)),
      image: car.image || "",
      description: car.description || "",
      registrationNumber: car.registrationNumber || "",
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

  const updateVerification = async (vehicleId, verificationStatus) => {
    const label = verificationStatus === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this vehicle? This action is recorded in the audit log.`)) return;
    const verificationReviewNote = verificationStatus === "rejected" ? window.prompt("Reason for rejection (shown to the driver):") || "" : "";
    try {
      const response = await fetch(`${API_URL}/cars/${vehicleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verificationStatus, verificationReviewNote }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data?.message || "Failed to update verification");
      fetchVehicles();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const adoptLegacyVehicle = async (car) => {
    if (!window.confirm(`Confirm that “${car.name}” is a real company vehicle and its ownership/details were checked. This enables eligibility for public listing after approval and availability are confirmed.`)) return;
    try {
      const response = await fetch(`${API_URL}/cars/${car._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ dataOrigin: "admin" }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not verify legacy vehicle");
      fetchVehicles();
    } catch (err) { alert(`Error: ${err.message}`); }
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

  const previewDemoCleanup = async () => {
    setCleanupLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/demo-cleanup/preview`, { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not preview demo records");
      setCleanupPlan(data.plan);
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setCleanupLoading(false); }
  };

  const deleteDemoCleanup = async () => {
    const confirmation = window.prompt('Only explicitly identified demo/test records will be deleted. Real production records are preserved. Type "DELETE DEMO DATA" to continue.');
    if (confirmation !== "DELETE DEMO DATA") return;
    setCleanupLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/demo-cleanup/delete`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ confirmation }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Demo data cleanup failed");
      setCleanupPlan(data.plan);
      alert("Explicitly tagged demo records were deleted. Review the remaining conflicts below.");
      fetchVehicles();
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setCleanupLoading(false); }
  };

  const cleanupLabels = { demoUsers: "Demo users", demoDrivers: "Demo drivers", demoVehicles: "Demo vehicles", demoBookings: "Demo bookings", demoTrips: "Demo trips", demoPayments: "Demo payments", demoLedgerEntries: "Demo ledger entries", demoRides: "Demo scheduled rides", demoSeatBookings: "Demo seat bookings", demoAuditRecords: "Demo audit records", manualReview: "Possible seed matches (kept)" };

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

      <section className="admin-card" style={{ marginBottom: 20, border: "1px solid rgba(239,68,68,.45)" }}>
        <div className="admin-card-header"><div><h2>Demo / Test Data Cleanup</h2><p>Only records explicitly identified as demo/test data will be deleted. Real production records will not be removed.</p></div><button className="admin-btn admin-btn-secondary" onClick={previewDemoCleanup} disabled={cleanupLoading}>{cleanupLoading ? "Working…" : "Preview Demo Data"}</button></div>
        {cleanupPlan && <div>
          <p>Preview generated: {new Date(cleanupPlan.generatedAt).toLocaleString()}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 12 }}>{Object.entries(cleanupLabels).map(([key, label]) => <div className="admin-stat-card" key={key}><span>{label}</span><strong>{cleanupPlan.counts[key] || 0}</strong></div>)}</div>
          <details style={{ marginTop: 12 }}><summary>Review candidate record IDs and details</summary>{Object.entries(cleanupPlan.groups).map(([key, records]) => <div key={key}><h4>{cleanupLabels[key]} ({records.length})</h4>{records.length ? <ul>{records.map((record) => <li key={record.id}><code>{record.id}</code> — {record.label}</li>)}</ul> : <p>None</p>}</div>)}</details>
          <details style={{ marginTop: 12 }}><summary>Records preserved for manual review ({cleanupPlan.conflicts.length + (cleanupPlan.groups.manualReview?.length || 0)})</summary>{cleanupPlan.groups.manualReview?.length > 0 && <ul>{cleanupPlan.groups.manualReview.map((item) => <li key={item.id}><code>{item.id}</code> — {item.label}. {item.reason}</li>)}</ul>}{cleanupPlan.conflicts.length > 0 && <ul>{cleanupPlan.conflicts.map((item, index) => <li key={`${item.id}-${index}`}>{item.id}: {item.reason}</li>)}</ul>}{cleanupPlan.conflicts.length === 0 && !cleanupPlan.groups.manualReview?.length && <p>No cross-links need manual review.</p>}</details>
          <p role="note"><strong>Warning:</strong> Review the preview and preserved-record list before deletion. Legacy records without explicit demo provenance are kept.</p>
          <button className="admin-btn admin-btn-danger" onClick={deleteDemoCleanup} disabled={cleanupLoading}>Delete Demo/Test Data</button>
        </div>}
      </section>

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
                  <th>Owner / Driver</th>
                  <th>Record source</th>
                  <th>Registration</th>
                  <th>Submitted</th>
                  <th>Category</th>
                  <th>Seats</th>
                  <th>Price / Day</th>
                  <th>Extra KM Rate</th>
                  <th>Included KM</th>
                  <th>Verification</th>
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
                    <td>{car.driver?.user?.name || (car.ownershipType === "company" ? "Company fleet" : "Driver account")}</td>
                    <td>{car.dataOrigin || "legacy"}</td>
                    <td>{car.registrationNumber || "—"}</td>
                    <td>{car.createdAt ? new Date(car.createdAt).toLocaleDateString() : "—"}</td>
                    <td>{car.category || "Sedan"}</td>
                    <td>{car.seats || 5} seats</td>
                    <td><strong>₹{Number(car.pricePerDay || 0).toLocaleString("en-IN")}</strong></td>
                    <td>₹{car.pricePerKm || 0}/km</td>
                    <td>{car.includedKm || 300} km</td>
                    <td>
                      <span className={`admin-badge ${car.verificationStatus === "approved" ? "badge-green" : car.verificationStatus === "rejected" ? "badge-red" : "badge-yellow"}`}>
                        {car.verificationStatus || "approved"}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${car.available !== false ? "badge-green" : "badge-red"}`}>
                        {car.available !== false ? "● Available" : "○ Unavailable"}
                      </span>
                      {car.documents?.length > 0 && <div>{car.documents.map((doc, index) => <a key={`${doc.documentType}-${index}`} href={doc.documentUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>{doc.documentType}: {doc.status}</a>)}</div>}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                          onClick={() => handleOpenEdit(car)}
                        >
                          ✏️ Edit
                        </button>
                        {car.dataOrigin === "legacy" && !car.driver && <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => adoptLegacyVehicle(car)}>Verify record</button>}
                        <button
                          className={`admin-btn admin-btn-sm ${car.available !== false ? "admin-btn-secondary" : "admin-btn-success"}`}
                          onClick={() => toggleAvailability(car._id, car.available !== false)}
                        >
                          {car.available !== false ? "Mark Unavailable" : "Mark Available"}
                        </button>
                        {car.verificationStatus !== "approved" && (
                          <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => updateVerification(car._id, "approved")}>
                            Approve
                          </button>
                        )}
                        {car.verificationStatus === "pending" && (
                          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => updateVerification(car._id, "rejected")}>
                            Reject
                          </button>
                        )}
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
                    <label>Registration Number</label>
                    <input type="text" name="registrationNumber" value={form.registrationNumber} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label>Primary Location *</label>
                    <input type="text" name="location" value={form.location} onChange={handleChange} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Supported Service Areas</label>
                    <select multiple name="serviceAreas" value={(form.serviceAreas || []).map(String)} onChange={(e) => setForm((prev) => ({ ...prev, serviceAreas: Array.from(e.target.selectedOptions, (option) => option.value) }))}>
                      {serviceAreas.map((area) => <option key={area._id} value={area._id}>{area.name}</option>)}
                    </select>
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

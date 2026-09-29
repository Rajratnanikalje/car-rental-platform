import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import "./AdminPages.css";

export default function AdminServiceAreas() {
  const [areas, setAreas] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const response = await fetch(`${API_URL}/service-areas/admin`, { credentials: "include" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load service areas");
    setAreas(data.areas || []);
  };
  useEffect(() => { const timer = window.setTimeout(() => load().catch((e) => setError(e.message)), 0); return () => window.clearTimeout(timer); }, []);
  const create = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API_URL}/service-areas`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to create area");
      setName(""); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const toggle = async (area) => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/service-areas/${area._id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !area.active }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to update area");
      await load();
    } catch (e) { setError(e.message); }
  };
  const save = async (area) => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/service-areas/${area._id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: area.name, supportsLocal: area.supportsLocal, supportsOutstation: area.supportsOutstation }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to update area");
      await load();
    } catch (e) { setError(e.message); }
  };
  const updateArea = (id, field, value) => setAreas((current) => current.map((area) => area._id === id ? { ...area, [field]: value } : area));
  return <section className="admin-page">
    <header className="admin-page-header"><div><h1>Service Areas</h1><p>Manage the areas customers can select for local vehicle searches.</p></div></header>
    {error && <div role="alert" style={{ color: "#b42318", padding: 12 }}>{error}</div>}
    <form className="admin-card" onSubmit={create} style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
      <label style={{ flex: "1 1 260px" }}>Area name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required placeholder="Add an area" /></label>
      <button className="admin-btn-primary" disabled={busy}>{busy ? "Adding…" : "Add area"}</button>
    </form>
    <div className="admin-card"><h2>Configured areas</h2>{areas.length === 0 ? <p>No service areas configured yet.</p> : <div className="admin-table-container"><table className="admin-table"><thead><tr><th>Area</th><th>Local</th><th>Outstation</th><th>Status</th><th>Action</th></tr></thead><tbody>{areas.map((area) => <tr key={area._id}><td><input aria-label={`Edit ${area.name}`} value={area.name} onChange={(e) => updateArea(area._id, "name", e.target.value)} maxLength={100} /></td><td><input type="checkbox" checked={area.supportsLocal} onChange={(e) => updateArea(area._id, "supportsLocal", e.target.checked)} aria-label="Local availability" /></td><td><input type="checkbox" checked={area.supportsOutstation} onChange={(e) => updateArea(area._id, "supportsOutstation", e.target.checked)} aria-label="Outstation availability" /></td><td>{area.active ? "Active" : "Inactive"}</td><td style={{ display: "flex", gap: 8 }}><button type="button" className="admin-btn-primary" onClick={() => save(area)}>Save</button><button type="button" className="admin-btn-secondary" onClick={() => toggle(area)}>{area.active ? "Disable" : "Enable"}</button></td></tr>)}</tbody></table></div>}</div>
  </section>;
}

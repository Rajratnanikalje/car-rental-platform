import { API_URL } from "../../config/api";
import { useState, useEffect } from "react";
import "./AdminPages.css";


export default function AdminSettings() {
  const [settings, setSettings] = useState({
    commissionPercentage: 10,
    fixedCommission: 200,
    platformFee: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSettings = async () => {
    try {
      setTimeout(() => setLoading(true), 0);
      setError("");
      const response = await fetch(`${API_URL}/finance/settings`, { credentials: "include" });
      const data = await response.json();
      if (response.ok && data.success && data.settings) {
        setSettings({
          commissionPercentage: data.settings.commissionPercentage ?? 10,
          fixedCommission: data.settings.fixedCommission ?? 200,
          platformFee: data.settings.platformFee ?? 50,
        });
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
      setError("Unable to load current settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchSettings, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");

      const response = await fetch(`${API_URL}/finance/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to update financial settings");
      }

      setSuccessMsg("Platform financial parameters updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Platform Financial Rules & Rates</h1>
          <p>Configure server-side commission derivation formulas and automated settlement deductions.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", padding: "14px 18px", borderRadius: "10px" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: "rgba(34, 197, 94, 0.15)", color: "#86efac", padding: "14px 18px", borderRadius: "10px", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
          ✓ {successMsg}
        </div>
      )}

      <div className="admin-card" style={{ maxWidth: "680px" }}>
        <div className="admin-card-header">
          <h2>⚙️ Commission Formula Configuration</h2>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Loading platform rules...
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="admin-form-group">
              <label>RideOn Commission Percentage (%)</label>
              <input
                type="number"
                name="commissionPercentage"
                min="0"
                max="100"
                step="0.5"
                value={settings.commissionPercentage}
                onChange={handleChange}
                required
              />
              <small style={{ color: "#94a3b8", fontSize: "11.5px" }}>
                Percentage deducted from the gross fare upon trip completion.
              </small>
            </div>

            <div className="admin-form-group">
              <label>Fixed Commission Surcharge (₹)</label>
              <input
                type="number"
                name="fixedCommission"
                min="0"
                value={settings.fixedCommission}
                onChange={handleChange}
                required
              />
              <small style={{ color: "#94a3b8", fontSize: "11.5px" }}>
                Fixed per-trip booking fee added to the platform share.
              </small>
            </div>

            <div className="admin-form-group">
              <label>Platform & Technology Fee (₹)</label>
              <input
                type="number"
                name="platformFee"
                min="0"
                value={settings.platformFee}
                onChange={handleChange}
                required
              />
              <small style={{ color: "#94a3b8", fontSize: "11.5px" }}>
                Infrastructure and payment gateway facilitation charge.
              </small>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "13px" }}>
              <strong style={{ color: "#818cf8" }}>🧮 Example Fare Calculation:</strong>
              <div style={{ marginTop: "6px", color: "#cbd5e1" }}>
                On a ₹3,000 trip with current settings:
                <br />
                • Platform Share: ₹{((3000 * settings.commissionPercentage) / 100) + settings.fixedCommission + settings.platformFee}
                <br />
                • Driver Earnings: ₹{3000 - (((3000 * settings.commissionPercentage) / 100) + settings.fixedCommission + settings.platformFee)}
              </div>
            </div>

            <div>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? "Saving Changes..." : "Save Financial Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

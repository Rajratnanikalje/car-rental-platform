import { useState, useEffect } from "react";
import "./AdminPages.css";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/cms/audit/logs`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load audit logs");
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchLogs, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === "all" || log.action?.toLowerCase().includes(filterAction.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadgeClass = (action = "") => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("APPROVE") || act.includes("PASS")) return "confirmed";
    if (act.includes("DELETE") || act.includes("REJECT") || act.includes("CANCEL")) return "cancelled";
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("ASSIGN")) return "pending";
    return "completed";
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>System Audit & Security Logs</h1>
          <p>Real-time immutable log of administrator actions, entity modifications, and security events.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={fetchLogs} disabled={loading}>
            🔄 Refresh Logs
          </button>
        </div>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}

      <div className="admin-filter-bar glass-card" style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          className="admin-input"
          placeholder="Search by admin name, email, action or entity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: "240px" }}
        />
        <select
          className="admin-select"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{ width: "200px" }}
        >
          <option value="all">All Actions</option>
          <option value="UPDATE">Updates / Edits</option>
          <option value="CREATE">Creations</option>
          <option value="APPROVE">Approvals</option>
          <option value="CMS">CMS Changes</option>
          <option value="SETTLEMENT">Settlements</option>
        </select>
      </div>

      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrator</th>
              <th>Action</th>
              <th>Resource / Entity</th>
              <th>Changes / Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">Loading audit trail...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  {logs.length === 0 ? "No audit logs recorded yet." : "No logs match current search/filter."}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: "12px", color: "#94a3b8" }}>
                    <strong>{new Date(log.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                    <div>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                  </td>
                  <td>
                    <strong>{log.actor?.name || "System Admin"}</strong>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>{log.actor?.email || "system@rideon.com"}</div>
                  </td>
                  <td>
                    <span className={`admin-status-pill ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#f8fafc" }}>{log.entityType}</span>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>ID: #{log.entityId?.slice(-6) || "N/A"}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px", maxWidth: "340px", wordBreak: "break-word" }}>
                      {log.newValue ? (
                        typeof log.newValue === "object" ? (
                          <pre style={{ margin: 0, fontSize: "11px", background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "4px", color: "#e2e8f0" }}>
                            {JSON.stringify(log.newValue, null, 2).slice(0, 150)}
                            {JSON.stringify(log.newValue).length > 150 ? "..." : ""}
                          </pre>
                        ) : (
                          String(log.newValue)
                        )
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Action completed successfully</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

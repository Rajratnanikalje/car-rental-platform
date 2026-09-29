/**
 * Centralized API URL resolution and fetch helper.
 * Automatically points to localhost during local development,
 * and falls back to the live deployed backend in production if VITE_API_URL is missing.
 */
export const API_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== "undefined" && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // Automatic environment detection
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
  }

  // Live deployed backend on Render
  return "https://car-rental-platform-fcsu.onrender.com/api";
})();

/** Cookie sessions are sent with credentials: include; never persist access tokens in JS storage. */
export const getAuthHeaders = (extraHeaders = {}) => {
  return {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
};

/** Remove tokens persisted by older builds; current sessions use HttpOnly cookies. */
export const clearLegacyAuthToken = () => {
  try {
    localStorage.removeItem("token");
  } catch { /* Storage can be unavailable in restricted browsers. */ }
};

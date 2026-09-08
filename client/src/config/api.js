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

/**
 * Returns headers with Authorization Bearer token if stored in localStorage.
 */
export const getAuthHeaders = (extraHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Could not read auth token from localStorage", err);
  }

  return headers;
};

/**
 * Save auth token to localStorage
 */
export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  } catch (err) {
    console.warn("Could not set auth token in localStorage", err);
  }
};

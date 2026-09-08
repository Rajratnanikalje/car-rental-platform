import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext(null);

const API_URL = `${import.meta.env.VITE_API_URL}`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // TRACKS WHETHER `login()` WAS JUST CALLED
  // =========================
  // Prevents the initial `fetchCurrentUser` call (scheduled on mount)
  // from overwriting the user set by an explicit login when both
  // resolve around the same time (race condition).
  const justLoggedIn = useRef(false);

  // =========================
  // GET CURRENT USER
  // =========================
  const fetchCurrentUser = async () => {
    // Skip this run if the user just logged in explicitly -
    // the user state is already correct and authoritative.
    if (justLoggedIn.current) {
      justLoggedIn.current = false;
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data?.success || !data?.user) {
        setUser(null);
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error("Auth Check Error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // INITIAL AUTH CHECK
  // =========================
  useEffect(() => {
    const timer = window.setTimeout(fetchCurrentUser, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // =========================
  // LOGIN
  // =========================
  const login = (userData) => {
    if (!userData) {
      console.error("Login failed: user data missing.");
      return;
    }

    justLoggedIn.current = true;
    setUser(userData);
  };

  // =========================
  // UPDATE USER
  // =========================
  const updateUser = (userData) => {
    if (!userData) return;
    setUser((prev) => (prev ? { ...prev, ...userData } : userData));
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Logout request failed.");
      }
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setUser(null);
    }
  };

  // =========================
  // AUTH STATE
  // =========================
  const isLoggedIn = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        loading,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================
// USE AUTH
// =========================
// This hook is intentionally colocated with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

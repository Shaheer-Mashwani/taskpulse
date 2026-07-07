import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axiosInstance from "../api/axiosInstance";
import { subscribeToPush, unsubscribeFromPush } from "../utils/pushNotifications";

const AuthContext = createContext(null);

// Decode JWT payload without a library
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Returns true if token is expired or will expire in next 60 seconds
function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now() + 60_000;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wipe everything and reset to logged-out state
  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Called after a successful Google sign-in
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    // Subscribe to push notifications after a short delay
    // so the service worker has time to register first
    setTimeout(() => subscribeToPush(axiosInstance), 2000);
  }, []);

  // Called when user explicitly clicks logout
  const logout = useCallback(async () => {
    try {
      await unsubscribeFromPush(axiosInstance);
    } catch {
      // Don't block logout if push unsubscribe fails
    }
    clearSession();
  }, [clearSession]);

  // On every page load/refresh — try to restore the session
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("token");

      // No token at all — user has never logged in or already logged out
      if (!token) {
        setLoading(false);
        return;
      }

      // Token exists but is already expired — clear it and send to login
      if (isTokenExpired(token)) {
        clearSession();
        setLoading(false);
        return;
      }

      // Token looks valid locally — confirm with the server
      // This also gets the latest user data (role, company, etc.)
      try {
        const res = await axiosInstance.get("/api/auth/me");
        const freshUser = res.data.user;

        // Keep localStorage in sync with server
        localStorage.setItem("user", JSON.stringify(freshUser));
        setUser(freshUser);

        // Re-subscribe to push notifications
        setTimeout(() => subscribeToPush(axiosInstance), 2000);
      } catch {
        // Server rejected the token
        // Could be expired, tampered, or user deleted
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [clearSession]);

  // Global 401 handler — if any API call gets rejected mid-session
  // (token expired while user was active), log them out automatically
  useEffect(() => {
    const id = axiosInstance.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          clearSession();
        }
        return Promise.reject(err);
      }
    );
    return () => axiosInstance.interceptors.response.eject(id);
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
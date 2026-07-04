import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

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

function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  // exp is in seconds; give a 60-second buffer before actual expiry
  return payload.exp * 1000 < Date.now() + 60_000;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Called on every app load — verify the stored token is still valid
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      // Nothing stored — definitely not logged in
      if (!token || !storedUser) {
        setLoading(false);
        return;
      }

      // Token already expired client-side — no point hitting the server
      if (isTokenExpired(token)) {
        clearSession();
        setLoading(false);
        return;
      }

      // Token looks valid locally — confirm with the server
      try {
        const res = await axiosInstance.get("/api/auth/me");
        const freshUser = res.data.user;
        // Keep localStorage in sync with whatever the server returns
        localStorage.setItem("user", JSON.stringify(freshUser));
        setUser(freshUser);
      } catch (err) {
        // Server rejected the token (expired, tampered, user deleted, etc.)
        clearSession();
        setError("Your session expired. Please sign in again.");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [clearSession]);

  // Intercept 401 responses anywhere in the app
  // (e.g. token expired mid-session while user was active)
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (err) => {
        if (err.response?.status === 401) {
          clearSession();
        }
        return Promise.reject(err);
      }
    );
    return () => axiosInstance.interceptors.response.eject(interceptor);
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
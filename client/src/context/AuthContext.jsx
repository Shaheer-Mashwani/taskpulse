import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axiosInstance from "../api/axiosInstance";
import {
  subscribeToPush,
  unsubscribeFromPush,
} from "../utils/pushNotifications";

const AuthContext = createContext(null);

/**
 * ================================
 * JWT HELPERS
 * ================================
 */

// Decode JWT
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

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

// Check if token expired (or about to expire)
function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 < Date.now() + 60_000;
}

/**
 * ================================
 * AUTH PROVIDER
 * ================================
 */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Clear session completely
   */
  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  /**
   * LOGIN (called after Google success)
   */
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);

    // Subscribe to push notifications (delay for SW ready)
    setTimeout(() => {
      subscribeToPush(axiosInstance);
    }, 2000);
  }, []);

  /**
   * LOGOUT
   */
  const logout = useCallback(async () => {
    try {
      await unsubscribeFromPush(axiosInstance);
    } catch {
      // ignore errors
    }

    clearSession();
  }, [clearSession]);

  /**
   * ================================
   * RESTORE SESSION (IMPORTANT)
   * ================================
   */
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      // ✅ STEP 1: Instant UI restore (NO LOGIN FLASH)
      if (token && storedUser) {
        try {
          const cached = JSON.parse(storedUser);
          setUser(cached); // ⚡ instant dashboard
        } catch {
          localStorage.removeItem("user");
        }
      }

      // ❌ No token
      if (!token) {
        setLoading(false);
        return;
      }

      // ❌ Token expired
      if (isTokenExpired(token)) {
        clearSession();
        setLoading(false);
        return;
      }

      // ✅ STEP 2: Verify with backend
      try {
        const res = await axiosInstance.get("/api/auth/me");
        const freshUser = res.data.user;

        localStorage.setItem("user", JSON.stringify(freshUser));
        setUser(freshUser);

        // Re-subscribe push
        setTimeout(() => {
          subscribeToPush(axiosInstance);
        }, 2000);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [clearSession]);

  /**
   * ================================
   * GLOBAL 401 HANDLER
   * ================================
   */
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          clearSession();
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axiosInstance.interceptors.response.eject(interceptor);
    };
  }, [clearSession]);

  /**
   * ================================
   * CONTEXT VALUE
   * ================================
   */
  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user, // 🔥 helpful
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * ================================
 * CUSTOM HOOK
 * ================================
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Optimization: Pre-populate user state if it already exists in localStorage
  // This reduces layout shifts while waiting for the API response.
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Fix/Best Practice: Ensure axios instance has the bearer token for this initial check
    // (Ideally handled by an axios request interceptor, but safe to explicitly attach here too)
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Verify token is still valid by hitting /api/auth/me
    axiosInstance
      .get("/api/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user)); // Sync any profile updates
      })
      .catch((err) => {
        console.error("Session verification failed:", err);
        // Token expired or invalid — clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        delete axiosInstance.defaults.headers.common["Authorization"];
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Explicitly set the token headers for subsequent requests immediately after login
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Remove header configuration upon logout
    delete axiosInstance.defaults.headers.common["Authorization"];
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children} 
      {/* Or pass loading state down so protected routes can handle a loading spinner */}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
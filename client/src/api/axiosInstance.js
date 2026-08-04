import axios from "axios";

const instance = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://taskpulse-production-aeb5.up.railway.app", // 🔥 fallback
  withCredentials: true, // ✅ IMPORTANT for CORS + auth
});

/**
 * ============================
 * REQUEST INTERCEPTOR
 * ============================
 */
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ============================
 * RESPONSE INTERCEPTOR (OPTIONAL BUT GOOD)
 * ============================
 */
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto logout handled in AuthContext
    return Promise.reject(error);
  }
);

export default instance;
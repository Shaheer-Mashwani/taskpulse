import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    try {
      setError(null); // Reset error state on new attempt
      const res = await axiosInstance.post("/api/auth/google", {
        credential: credentialResponse.credential,
      });

      login(res.data.token, res.data.user);

      // Safe check if user object exists before checking role
      if (res.data.isNewUser || res.data.user?.role === "pending") {
        navigate("/select-role");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg)" }}>
      <div className="card" style={{ padding: "48px 40px", textAlign: "center", width: "360px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "6px" }}>
          <span className="pulse-dot" style={{ background: "var(--brand)", position: "relative" }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--brand)" }} />
          </span>
          <h1 style={{ fontSize: "28px", color: "var(--brand)" }}>TaskPulse</h1>
        </div>
        <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "32px" }}>
          Tasks, conversations, and progress — all in one thread.
        </p>

        {error && (
          <p style={{ color: "red", fontSize: "12px", marginBottom: "16px" }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError("Google Authentication failed")}
            useOneTap={false}
            cancel_on_tap_outside={false}
          />
        </div>
      </div> {/* <-- Fixed the missing card closing div */}
    </div>
  );
}
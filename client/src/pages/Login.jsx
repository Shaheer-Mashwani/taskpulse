import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse) => {
  try {
    const res = await axiosInstance.post("/api/auth/google", {
      credential: credentialResponse.credential,
    });
    login(res.data.token, res.data.user);

    // Skip role selection — go straight to company setup or dashboard
    if (!res.data.user.company) {
      navigate("/company-setup");
    } else {
      navigate("/dashboard");
    }
  } catch (err) {
    console.error("Login failed:", err);
  }
};

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: "420px", padding: "20px" }}>
        <div className="card-elevated" style={{ padding: "48px 40px", textAlign: "center", borderRadius: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="pulse-dot" style={{ background: "white" }} />
            </div>
            <h1 className="gradient-text" style={{ fontSize: "30px" }}>TaskPulse</h1>
          </div>

          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "36px", lineHeight: 1.6 }}>
            Tasks, conversations, and progress — all in one thread.
          </p>

          <div style={{
            background: "var(--surface-sunken)",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "8px" }}>
              {[
                { dot: "var(--status-pending-dot)", label: "Pending" },
                { dot: "var(--status-working-dot)", label: "Working" },
                { dot: "var(--status-done-dot)", label: "Done" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.dot, display: "inline-block" }} />
                  <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log("Login Failed")}
              useOneTap={false}
              auto_select={false}
            />
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "var(--ink-soft)" }}>
          Sign in with your Google account to get started
        </p>
      </div>
    </div>
  );
}
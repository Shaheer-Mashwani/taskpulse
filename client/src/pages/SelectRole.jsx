import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function SelectRole() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSelect = async (role) => {
    try {
      const res = await axiosInstance.post("/api/auth/select-role", { role });
      login(res.data.token, res.data.user);
      navigate("/company-setup");
    } catch (err) {
      console.error("Role selection failed:", err);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: "480px", padding: "20px" }}>
        <div className="card-elevated" style={{ padding: "44px 40px", textAlign: "center", borderRadius: "24px" }}>
          <h1 style={{ fontSize: "26px", marginBottom: "8px" }}>Welcome to TaskPulse</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "36px" }}>
            How will you be using it?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <button
              onClick={() => handleSelect("admin")}
              style={{
                width: "100%", padding: "18px 20px", borderRadius: "14px",
                display: "flex", alignItems: "center", gap: "16px", textAlign: "left",
              }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", flexShrink: 0,
              }}>🛡️</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>Admin / Project Manager</div>
                <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "2px" }}>Create tasks, manage team, oversee progress</div>
              </div>
            </button>

            <button
              onClick={() => handleSelect("member")}
              className="secondary"
              style={{
                width: "100%", padding: "18px 20px", borderRadius: "14px",
                display: "flex", alignItems: "center", gap: "16px", textAlign: "left",
              }}
            >
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "var(--brand-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", flexShrink: 0,
              }}>👤</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>Team Member</div>
                <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: "2px" }}>Receive tasks, collaborate, update progress</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
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
    navigate("/company-setup"); // Always go to company setup after picking role
  } catch (err) {
    console.error("Role selection failed:", err);
  }
};

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg)" }}>
      <div className="card" style={{ padding: "44px 40px", textAlign: "center", width: "420px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Welcome to TaskPulse</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "28px" }}>
          How will you be using it?
        </p>

        <button
          onClick={() => handleSelect("admin")}
          style={{ width: "100%", padding: "14px", marginBottom: "10px", fontSize: "15px" }}
        >
          Continue as Admin / Project Manager
        </button>

        <button
          onClick={() => handleSelect("member")}
          className="secondary"
          style={{ width: "100%", padding: "14px", fontSize: "15px" }}
        >
          Continue as Team Member
        </button>
      </div>
    </div>
  );
}
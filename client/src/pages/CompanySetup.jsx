import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function CompanySetup() {
  const [mode, setMode] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/company/create", { name: companyName });
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/company/join", { inviteCode });
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid invite code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: "460px", padding: "20px" }}>
        <div className="card-elevated" style={{ padding: "44px 40px", borderRadius: "24px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 16px",
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
            }}>🏢</div>
            <h1 style={{ fontSize: "22px", marginBottom: "6px" }}>Set up your workspace</h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>
              Create a new company or join an existing one.
            </p>
          </div>

          {!mode && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button onClick={() => setMode("create")} style={{ width: "100%", padding: "16px", borderRadius: "12px" }}>
                🚀 Create a Company
              </button>
              <button className="secondary" onClick={() => setMode("join")} style={{ width: "100%", padding: "16px", borderRadius: "12px" }}>
                🔗 Join with Invite Code
              </button>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreate}>
              {error && <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
              <label style={{ fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Company name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                required
                style={{ width: "100%", marginBottom: "16px" }}
              />
              <button type="submit" style={{ width: "100%", marginBottom: "10px" }} disabled={loading}>
                {loading ? "Creating..." : "Create Company"}
              </button>
              <button type="button" className="secondary" onClick={() => setMode(null)} style={{ width: "100%" }}>
                Back
              </button>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={handleJoin}>
              {error && <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
              <label style={{ fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Invite code</label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD34"
                required
                style={{ width: "100%", marginBottom: "16px", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", fontSize: "16px" }}
              />
              <button type="submit" style={{ width: "100%", marginBottom: "10px" }} disabled={loading}>
                {loading ? "Joining..." : "Join Company"}
              </button>
              <button type="button" className="secondary" onClick={() => setMode(null)} style={{ width: "100%" }}>
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
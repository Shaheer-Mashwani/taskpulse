import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function CompanySetup() {
  const [mode, setMode] = useState(null); // "create" | "join"
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
      <div className="card" style={{ padding: "40px", width: "420px", textAlign: "center" }}>
        <h1 style={{ fontSize: "22px", marginBottom: "8px" }}>Set up your workspace</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "28px" }}>
          Create a new company or join an existing one.
        </p>

        {!mode && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => setMode("create")}>Create a Company</button>
            <button className="secondary" onClick={() => setMode("join")}>Join with Invite Code</button>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} style={{ textAlign: "left" }}>
            {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}
            <label style={{ fontSize: "13px", fontWeight: 500 }}>Company name</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
              style={{ width: "100%", marginTop: "6px", marginBottom: "14px" }}
            />
            <button type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Creating..." : "Create Company"}
            </button>
            <button type="button" className="secondary" onClick={() => setMode(null)} style={{ width: "100%", marginTop: "8px" }}>
              Back
            </button>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} style={{ textAlign: "left" }}>
            {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}
            <label style={{ fontSize: "13px", fontWeight: 500 }}>Invite code</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB12CD34"
              required
              style={{ width: "100%", marginTop: "6px", marginBottom: "14px", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
            />
            <button type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Joining..." : "Join Company"}
            </button>
            <button type="button" className="secondary" onClick={() => setMode(null)} style={{ width: "100%", marginTop: "8px" }}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
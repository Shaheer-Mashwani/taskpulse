import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [clearing, setClearing] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axiosInstance.get("/api/company/me").then((res) => setCompany(res.data.company));
    axiosInstance.get("/api/tasks").then((res) => setTasks(res.data.tasks));
  }, []);

  const handleClearChat = async (taskId) => {
    if (!window.confirm("Clear all messages in this task chat? This cannot be undone.")) return;
    setClearing(taskId);
    try {
      await axiosInstance.delete(`/api/messages/${taskId}`);
      alert("Chat cleared successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to clear chat");
    } finally {
      setClearing(null);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(company?.inviteCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <button className="secondary" onClick={() => navigate("/dashboard")} style={{ padding: "6px 12px", fontSize: "13px" }}>
          ← Back
        </button>
        <h2 style={{ fontSize: "20px" }}>Settings</h2>
      </div>

      {/* Company Info */}
      {company && (
        <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
          <p style={{ fontWeight: 600, marginBottom: "12px" }}>Workspace</p>
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>{company.name}</p>
          <p className="meta-text" style={{ marginBottom: "12px" }}>{company.members?.length} member{company.members?.length !== 1 ? "s" : ""}</p>

          {user?.role === "admin" && (
            <div style={{ background: "var(--surface-sunken)", borderRadius: "8px", padding: "12px" }}>
              <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "6px" }}>Invite code — share this with team members:</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 600, letterSpacing: "0.15em", color: "var(--brand)" }}>
                  {company.inviteCode}
                </code>
                <button onClick={handleCopyCode} className="secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin: Clear chat logs */}
      {user?.role === "admin" && tasks.length > 0 && (
        <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
          <p style={{ fontWeight: 600, marginBottom: "12px" }}>Clear Chat Logs</p>
          <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "14px" }}>
            Permanently delete all messages from a task chat.
          </p>
          {tasks.map((task) => (
            <div key={task._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "14px" }}>{task.title}</span>
              <button
                onClick={() => handleClearChat(task._id)}
                disabled={clearing === task._id}
                style={{ background: "var(--danger)", padding: "6px 12px", fontSize: "12px" }}
              >
                {clearing === task._id ? "Clearing..." : "Clear chat"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Account */}
      <div className="card" style={{ padding: "20px" }}>
        <p style={{ fontWeight: 600, marginBottom: "12px" }}>Account</p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          {user?.avatar && <img src={user.avatar} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />}
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>{user?.name}</p>
            <p className="meta-text">{user?.email} · {user?.role}</p>
          </div>
        </div>
        <button onClick={logout} style={{ background: "var(--danger)" }}>
          Log out
        </button>
      </div>
    </div>
  );
}
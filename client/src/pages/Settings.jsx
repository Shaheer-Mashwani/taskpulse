import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { applyTheme, getSavedTheme } from "../utils/useTheme";

export default function Settings() {
  // Added 'login' to the destructured properties from useAuth
  const { user, logout, login } = useAuth(); 
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [clearing, setClearing] = useState(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(getSavedTheme);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    axiosInstance.get("/api/company/me")
      .then((res) => setCompany(res.data.company))
      .catch((err) => console.error("Error fetching company:", err));
      
    axiosInstance.get("/api/tasks")
      .then((res) => setTasks(res.data.tasks))
      .catch((err) => console.error("Error fetching tasks:", err));
  }, []);

  const handleToggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
  };

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

  const handleLeaveWorkspace = async () => {
    if (!window.confirm(
      "Are you sure you want to leave this workspace? You will lose access to all tasks and chats until you join again."
    )) return;

    setLeaving(true);
    try {
      const res = await axiosInstance.post("/api/company/leave");
      // This now works perfectly because login is extracted from useAuth()
      login(res.data.token, res.data.user); 
      navigate("/company-setup");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave workspace");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <button
          className="secondary"
          onClick={() => navigate("/dashboard")}
          style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "10px" }}
        >
          ← Back
        </button>
        <h2 style={{ fontSize: "20px" }}>Settings</h2>
      </div>

      {/* Appearance */}
      <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
        <p style={{ fontWeight: 600, marginBottom: "16px", fontSize: "15px" }}>Appearance</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: theme === "dark" ? "var(--brand-soft)" : "#FFF8E1",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px",
            }}>
              {theme === "dark" ? "🌙" : "☀️"}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "14px", margin: 0 }}>
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
              <p className="meta-text" style={{ margin: "3px 0 0" }}>
                {theme === "dark" ? "Easy on the eyes" : "Bright and clean"}
              </p>
            </div>
          </div>

          <div
            onClick={handleToggleTheme}
            style={{
              width: "54px", height: "30px", borderRadius: "15px",
              background: theme === "dark" ? "var(--brand)" : "var(--border)",
              cursor: "pointer", position: "relative",
              transition: "background 0.25s ease",
              flexShrink: 0,
              boxShadow: theme === "dark" ? "0 2px 8px rgba(79,70,229,0.4)" : "none",
            }}
          >
            <div style={{
              position: "absolute", top: "4px",
              left: theme === "dark" ? "28px" : "4px",
              width: "22px", height: "22px", borderRadius: "50%",
              background: "white",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px",
            }}>
              {theme === "dark" ? "🌙" : "☀️"}
            </div>
          </div>
        </div>
      </div>

      {/* Company Info */}
      {company && (
        <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
          <p style={{ fontWeight: 600, marginBottom: "12px", fontSize: "15px" }}>Workspace</p>
          <p style={{ fontSize: "15px", fontWeight: 500, marginBottom: "4px" }}>{company.name}</p>
          <p className="meta-text" style={{ marginBottom: "14px" }}>
            {company.members?.length} member{company.members?.length !== 1 ? "s" : ""}
          </p>

          {user?.role === "admin" && (
            <div style={{ background: "var(--surface-sunken)", borderRadius: "12px", padding: "14px" }}>
              <p style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
                INVITE CODE — share with team members
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <code style={{
                  fontFamily: "var(--font-mono)", fontSize: "22px",
                  fontWeight: 700, letterSpacing: "0.18em", color: "var(--brand)",
                  flex: 1,
                }}>
                  {company.inviteCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="secondary"
                  style={{ padding: "7px 14px", fontSize: "13px", borderRadius: "10px" }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Leave workspace block nested neatly inside the Workspace card */}
          <div style={{
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500, margin: 0 }}>Leave workspace</p>
              <p className="meta-text" style={{ margin: "2px 0 0" }}>
                You can rejoin later with the invite code
              </p>
            </div>
            <button
              onClick={handleLeaveWorkspace}
              disabled={leaving}
              style={{
                background: "var(--danger)",
                padding: "7px 14px",
                fontSize: "12px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
                color: "white",
                border: "none",
                cursor: "pointer"
              }}
            >
              {leaving ? "Leaving..." : "Leave"}
            </button>
          </div>
        </div>
      )}

      {/* Admin: Clear chat logs */}
      {user?.role === "admin" && tasks.length > 0 && (
        <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
          <p style={{ fontWeight: 600, marginBottom: "6px", fontSize: "15px" }}>Clear Chat Logs</p>
          <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "16px" }}>
            Permanently delete all messages from a task chat.
          </p>
          {tasks.map((task) => (
            <div key={task._id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0", borderTop: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{task.title}</span>
              <button
                onClick={() => handleClearChat(task._id)}
                disabled={clearing === task._id}
                style={{
                  background: "var(--danger)", padding: "7px 14px",
                  fontSize: "12px", borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
                  color: "white",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {clearing === task._id ? "Clearing..." : "Clear chat"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Account */}
      <div className="card" style={{ padding: "20px" }}>
        <p style={{ fontWeight: 600, marginBottom: "14px", fontSize: "15px" }}>Account</p>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              style={{ width: "46px", height: "46px", borderRadius: "12px", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "46px", height: "46px", borderRadius: "12px",
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "18px", color: "white",
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>{user?.name}</p>
            <p className="meta-text" style={{ margin: "3px 0 0" }}>
              {user?.email} · {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            background: "var(--danger)",
            boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
            borderRadius: "12px",
            padding: "10px 20px",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
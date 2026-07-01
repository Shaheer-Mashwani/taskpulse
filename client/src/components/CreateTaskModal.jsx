import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

export default function CreateTaskModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("moderate");
  const [emails, setEmails] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);

  useEffect(() => {
    axiosInstance.get("/api/company/members").then((res) => {
      setMembers(res.data.members);
    }).catch(() => {});
  }, []);

  const toggleMember = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const assigneeEmails = selectedEmails.length > 0
      ? selectedEmails
      : emails.split(",").map((e) => e.trim()).filter(Boolean);

    if (assigneeEmails.length === 0) {
      setError("Please select or enter at least one assignee");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("/api/tasks", {
        title, description, priority,
        assigneeEmails,
        deadline: deadline || null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const priorityOpts = [
    { value: "urgent", label: "🔴 Urgent" },
    { value: "moderate", label: "🟡 Moderate" },
    { value: "easy", label: "🟢 Easy" },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 1000, padding: "0",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--surface)", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: "600px", maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        animation: "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        <div style={{
          padding: "20px 24px 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", margin: 0 }}>
            New Task
          </h2>
          <button
            className="secondary"
            onClick={onClose}
            style={{ padding: "6px 12px", borderRadius: "10px", fontSize: "16px" }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: "var(--urgent-bg)", color: "var(--urgent)",
                padding: "10px 14px", borderRadius: "10px", fontSize: "13px",
                marginBottom: "16px", fontFamily: "var(--font-mono)",
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--ink-soft)" }}>
                TASK TITLE
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                style={{ width: "100%", fontSize: "15px", padding: "12px 14px" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--ink-soft)" }}>
                DESCRIPTION
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                required
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--ink-soft)" }}>
                  PRIORITY
                </label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: "100%" }}>
                  {priorityOpts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--ink-soft)" }}>
                  DEADLINE
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "10px", color: "var(--ink-soft)" }}>
                ASSIGN TO
              </label>

              {members.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
                  {members.map((m) => {
                    const selected = selectedEmails.includes(m.email);
                    return (
                      <div
                        key={m._id}
                        onClick={() => toggleMember(m.email)}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 12px", borderRadius: "12px", cursor: "pointer",
                          background: selected ? "var(--brand-soft)" : "var(--surface-sunken)",
                          border: `1.5px solid ${selected ? "var(--brand)" : "transparent"}`,
                          transition: "all 0.12s ease",
                        }}
                      >
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: selected
                            ? "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)"
                            : "var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "13px",
                          color: selected ? "white" : "var(--ink-soft)", flexShrink: 0,
                        }}>
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 500, margin: 0 }}>{m.name}</p>
                          <p className="meta-text" style={{ margin: 0 }}>{m.email}</p>
                        </div>
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%",
                          border: `2px solid ${selected ? "var(--brand)" : "var(--border)"}`,
                          background: selected ? "var(--brand)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all 0.12s ease",
                        }}>
                          {selected && <span style={{ color: "white", fontSize: "11px", lineHeight: 1 }}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <input
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Comma separated emails"
                  style={{ width: "100%" }}
                />
              )}

              {selectedEmails.length > 0 && (
                <p className="meta-text" style={{ marginTop: "8px" }}>
                  {selectedEmails.length} member{selectedEmails.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: "14px", fontSize: "15px",
                background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
                boxShadow: "0 4px 16px rgba(79,70,229,0.35)",
              }}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
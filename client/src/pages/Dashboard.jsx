import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const priorityStyle = {
  urgent: { bg: "var(--urgent-bg)", text: "var(--urgent)", border: "#FECACA" },
  moderate: { bg: "var(--moderate-bg)", text: "var(--moderate)", border: "#FDE68A" },
  easy: { bg: "var(--easy-bg)", text: "var(--easy)", border: "#A7F3D0" },
};

const statusStyle = {
  pending: { bg: "var(--status-pending-bg)", text: "var(--status-pending-text)", dot: "var(--status-pending-dot)" },
  working: { bg: "var(--status-working-bg)", text: "var(--status-working-text)", dot: "var(--status-working-dot)" },
  done: { bg: "var(--status-done-bg)", text: "var(--status-done-text)", dot: "var(--status-done-dot)" },
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("moderate");
  const [emails, setEmails] = useState("");
  const [error, setError] = useState("");
  const [deadline, setDeadline] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTasks = tasks.filter((task) =>
    filter === "all" ? true : task.status === filter
  );

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadTasks = async () => {
    const res = await axiosInstance.get("/api/tasks");
    setTasks(res.data.tasks);
  };

  useEffect(() => { loadTasks(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const assigneeEmails = emails.split(",").map((e) => e.trim()).filter(Boolean);
      await axiosInstance.post("/api/tasks", { title, description, priority, assigneeEmails, deadline: deadline || null });
      setShowForm(false);
      setTitle(""); setDescription(""); setEmails(""); setDeadline("");
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    working: tasks.filter(t => t.status === "working").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 8px rgba(79,70,229,0.06)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white", display: "block" }} />
            </div>
            <div>
              <span className="gradient-text" style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600 }}>TaskPulse</span>
              <span className="meta-text" style={{ marginLeft: "10px" }}>{user?.name}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {user?.role === "admin" && (
              <button onClick={() => setShowForm(!showForm)} style={{ padding: "8px 16px", fontSize: "13px" }}>
                + New Task
              </button>
            )}
            <button className="secondary" onClick={() => navigate("/settings")} style={{ padding: "8px 12px", fontSize: "13px" }}>
              ⚙️
            </button>
            <button className="secondary" onClick={logout} style={{ padding: "8px 12px", fontSize: "13px" }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "28px 20px" }}>
        {showForm && (
          <form onSubmit={handleCreate} className="card-elevated" style={{ padding: "24px", marginBottom: "24px", borderRadius: "20px" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "18px", marginBottom: "18px" }}>Create New Task</h3>
            {error && <p style={{ color: "var(--danger)", fontSize: "13px", marginTop: 0, marginBottom: "12px" }}>{error}</p>}
            <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: "100%", marginBottom: "10px" }} />
            <textarea placeholder="Description — what needs to be done?" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} style={{ width: "100%", marginBottom: "10px", resize: "vertical" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="urgent">🔴 Urgent</option>
                <option value="moderate">🟡 Moderate</option>
                <option value="easy">🟢 Easy</option>
              </select>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <input placeholder="Assignee emails, comma separated" value={emails} onChange={(e) => setEmails(e.target.value)} required style={{ width: "100%", marginBottom: "16px" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ flex: 1 }}>Create Task</button>
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {["all", "pending", "working", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? "" : "secondary"}
              style={{
                padding: "7px 16px",
                fontSize: "13px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {f === "pending" && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--status-pending-dot)", display: "inline-block" }} />}
              {f === "working" && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--status-working-dot)", display: "inline-block" }} />}
              {f === "done" && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--status-done-dot)", display: "inline-block" }} />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{
                background: filter === f ? "rgba(255,255,255,0.25)" : "var(--surface-sunken)",
                color: filter === f ? "white" : "var(--ink-soft)",
                fontSize: "11px", fontFamily: "var(--font-mono)",
                padding: "1px 7px", borderRadius: "10px", fontWeight: 500,
              }}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink-soft)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
            <p style={{ fontSize: "15px" }}>No tasks found</p>
          </div>
        )}

        {filteredTasks.map((task) => {
          const colors = priorityStyle[task.priority];
          const sStyle = statusStyle[task.status];
          const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";
          return (
            <div
              key={task._id}
              onClick={() => navigate(`/task/${task._id}`)}
              className="card"
              style={{
                borderLeft: `4px solid ${colors.text}`,
                padding: "16px 18px",
                marginBottom: "10px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: "14px",
                transition: "transform 0.12s ease, box-shadow 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: "600", margin: "0 0 8px", fontSize: "15px", color: "var(--ink)" }}>
                  {task.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span className="badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                    {task.priority}
                  </span>

                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    background: sStyle.bg, color: sStyle.text,
                    fontSize: "11px", fontFamily: "var(--font-mono)",
                    fontWeight: 500, padding: "3px 10px", borderRadius: "20px",
                  }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sStyle.dot, display: "inline-block" }} />
                    {task.status}
                  </span>

                  {task.deadline && (
                    <span className="meta-text" style={{
                      color: isOverdue ? "var(--urgent)" : "var(--ink-soft)",
                      background: isOverdue ? "var(--urgent-bg)" : "transparent",
                      padding: isOverdue ? "2px 8px" : "0",
                      borderRadius: "10px",
                    }}>
                      📅 {new Date(task.deadline).toLocaleDateString()}
                      {isOverdue && " · overdue"}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ marginLeft: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                {task.status === "working" && <span className="pulse-dot" />}
                <span style={{ color: "var(--ink-soft)", fontSize: "18px" }}>›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
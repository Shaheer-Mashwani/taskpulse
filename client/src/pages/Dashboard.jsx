import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const priorityStyle = {
  urgent: { bg: "var(--urgent-bg)", text: "var(--urgent)" },
  moderate: { bg: "var(--moderate-bg)", text: "var(--moderate)" },
  easy: { bg: "var(--easy-bg)", text: "var(--easy)" },
};

const statusLabel = { pending: "Pending", working: "Working", done: "Done" };

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("moderate");
  const [emails, setEmails] = useState("");
  const [error, setError] = useState("");
  const [deadline, setDeadline] = useState("");
  
  // New filter state and filtering logic
  const [filter, setFilter] = useState("all");
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadTasks = async () => {
    const res = await axiosInstance.get("/api/tasks");
    setTasks(res.data.tasks);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const assigneeEmails = emails.split(",").map((e) => e.trim()).filter(Boolean);
      
      // Fixed duplicate API post call bug here
      await axiosInstance.post("/api/tasks", { title, description, priority, assigneeEmails, deadline: deadline || null });
      
      setShowForm(false);
      setTitle("");
      setDescription("");
      setEmails("");
      setDeadline("");
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px" }}>
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h2 style={{ fontSize: "22px" }}>TaskPulse</h2>
          <p className="meta-text" style={{ marginTop: "2px" }}>{user?.name} · {user?.role}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {user?.role === "admin" && (
            <button onClick={() => setShowForm(!showForm)}>+ New Task</button>
          )}
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
        <button className="secondary" onClick={() => navigate("/settings")} style={{ padding: "8px 12px" }}>
        ⚙️ Settings
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ padding: "20px", marginBottom: "22px" }}>
          {error && <p style={{ color: "var(--danger)", fontSize: "13px", marginTop: 0 }}>{error}</p>}
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: "100%", marginBottom: "10px" }} />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} style={{ width: "100%", marginBottom: "10px", resize: "vertical" }} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: "100%", marginBottom: "10px" }}>
            <option value="urgent">Urgent</option>
            <option value="moderate">Moderate</option>
            <option value="easy">Easy</option>
          </select>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
            min={new Date().toISOString().split("T")[0]}
          />
          <input
            placeholder="Assignee emails, comma separated"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "14px" }}
          />
          <button type="submit">Create Task</button>
        </form>
      )}

      {/* Filter Tabs UI */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["all", "pending", "working", "done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? "" : "secondary"}
            style={{ padding: "6px 14px", fontSize: "13px", textTransform: "capitalize" }}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>No tasks found.</p>
      )}

      {/* Rendering list */}
      {filteredTasks.map((task) => {
        const colors = priorityStyle[task.priority];
        return (
          <div
            key={task._id}
            onClick={() => navigate(`/task/${task._id}`)}
            className="card"
            style={{
              borderLeft: `4px solid ${colors.text}`,
              padding: "14px 16px",
              marginBottom: "10px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontWeight: "500", margin: "0 0 8px", fontSize: "15px" }}>{task.title}</p>
              <span className="badge" style={{ background: colors.bg, color: colors.text }}>
                {task.priority}
              </span>
              <span className="meta-text" style={{ marginLeft: "8px" }}>{statusLabel[task.status]}</span>
              
              {/* Deadline rendering directly below status badge */}
              {task.deadline && (
                <span
                  className="meta-text"
                  style={{
                    marginLeft: "8px",
                    color: new Date(task.deadline) < new Date() && task.status !== "done"
                      ? "var(--urgent)"
                      : "var(--ink-soft)",
                  }}
                >
                  📅 {new Date(task.deadline).toLocaleDateString()}
                  {new Date(task.deadline) < new Date() && task.status !== "done" && " (overdue)"}
                </span>
              )}
            </div>
            {task.status === "working" && <span className="pulse-dot" />}
          </div>
        );
      })}
    </div>
  );
}
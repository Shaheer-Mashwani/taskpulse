import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import MembersModal from "../components/MembersModal";
import CreateTaskModal from "../components/CreateTaskModal";
import FAB from "../components/FAB";

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
  const [filter, setFilter] = useState("all");
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filteredTasks = tasks.filter((task) =>
    filter === "all" ? true : task.status === filter
  );

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    working: tasks.filter((t) => t.status === "working").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const loadTasks = async () => {
    try {
      const res = await axiosInstance.get("/api/tasks");
      setTasks(res.data.tasks);
    } catch (err) {
      console.error("Failed to load tasks");
    }
  };

  useEffect(() => { loadTasks(); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 2px 12px rgba(79,70,229,0.07)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "13px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "10px",
              background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "white" }} />
            </div>
            <div>
              <span
                className="gradient-text"
                style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600 }}
              >
                TaskPulse
              </span>
              <span className="meta-text" style={{ marginLeft: "8px" }}>{user?.name}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="secondary"
              onClick={() => setShowMembers(true)}
              style={{ padding: "8px 12px", borderRadius: "12px", fontSize: "18px", lineHeight: 1 }}
              title="Team members"
            >
              👥
            </button>
            <button
              className="secondary"
              onClick={() => navigate("/settings")}
              style={{ padding: "8px 12px", borderRadius: "12px", fontSize: "18px", lineHeight: 1 }}
              title="Settings"
            >
              ⚙️
            </button>
            <button
              className="secondary"
              onClick={logout}
              style={{ padding: "8px 12px", borderRadius: "12px", fontSize: "13px" }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 20px 100px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {["all", "pending", "working", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? "" : "secondary"}
              style={{ padding: "7px 16px", fontSize: "13px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}
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
              }}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            <p style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>No tasks here</p>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px" }}>
              Tap the + button to create your first task
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
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
                  borderRadius: "16px",
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, margin: "0 0 8px", fontSize: "15px" }}>
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

                  {task.currentAssignees?.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                      <div style={{ display: "flex" }}>
                        {task.currentAssignees.slice(0, 4).map((a, i) => (
                          <div key={a._id} style={{
                            width: "22px", height: "22px", borderRadius: "6px",
                            background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
                            border: "2px solid var(--surface)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "9px", fontWeight: 700, color: "white",
                            marginLeft: i > 0 ? "-6px" : "0",
                          }}>
                            {a.name?.[0]?.toUpperCase()}
                          </div>
                        ))}
                        {task.currentAssignees.length > 4 && (
                          <div style={{
                            width: "22px", height: "22px", borderRadius: "6px",
                            background: "var(--surface-sunken)",
                            border: "2px solid var(--surface)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "9px", fontWeight: 700, color: "var(--ink-soft)",
                            marginLeft: "-6px",
                          }}>
                            +{task.currentAssignees.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="meta-text">
                        {task.currentAssignees.map((a) => a.name.split(" ")[0]).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginLeft: "12px", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {task.status === "working" && <span className="pulse-dot" />}
                  <span style={{ color: "var(--ink-soft)", fontSize: "18px" }}>›</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <FAB onClick={() => setShowCreateTask(true)} />

      {showMembers && <MembersModal onClose={() => setShowMembers(false)} />}
      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreated={loadTasks}
        />
      )}
    </div>
  );
}
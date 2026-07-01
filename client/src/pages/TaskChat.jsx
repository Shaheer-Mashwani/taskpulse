import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import AudioRecorder from "../components/AudioRecorder";

const statusStyle = {
  pending: { bg: "var(--status-pending-bg)", text: "var(--status-pending-text)" },
  working: { bg: "var(--status-working-bg)", text: "var(--status-working-text)" },
  done: { bg: "var(--status-done-bg)", text: "var(--status-done-text)" },
};

export default function TaskChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [delegateEmail, setDelegateEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    try {
      const taskRes = await axiosInstance.get(`/api/tasks/${id}`);
      setTask(taskRes.data.task);
      const msgRes = await axiosInstance.get(`/api/messages/${id}`);
      setMessages(msgRes.data.messages);
    } catch (err) {
      console.error("Failed to load task context data:", err);
    }
  };

  useEffect(() => {
    loadData();
    socket.emit("join-task", id);

    const handleNewMessage = (msg) => {
      if (msg.task === id || msg.task?.toString() === id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (updatedTask._id === id) setTask(updatedTask);
    };

    socket.on("new-message", handleNewMessage);
    socket.on("task-updated", handleTaskUpdated);

    return () => {
      socket.emit("leave-task", id);
      socket.off("new-message", handleNewMessage);
      socket.off("task-updated", handleTaskUpdated);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    socket.emit("send-message", { taskId: id, senderId: user?._id, type: "text", content: text });
    setText("");
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      let type = "file";
      if (file.type.startsWith("audio/")) type = "audio";
      else if (file.type.startsWith("video/")) type = "video";
      socket.emit("send-message", { taskId: id, senderId: user?._id, type, content: res.data.url, fileName: res.data.fileName });
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await axiosInstance.patch(`/api/tasks/${id}/status`, { status });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDelegate = async () => {
    if (!delegateEmail.trim()) return;
    try {
      await axiosInstance.post(`/api/tasks/${id}/delegate`, { email: delegateEmail });
      setDelegateEmail("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delegate");
    }
  };

  const handleAddAssignee = async () => {
    if (!delegateEmail.trim()) return;
    try {
      await axiosInstance.post(`/api/tasks/${id}/add-assignee`, { email: delegateEmail });
      setDelegateEmail("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add");
    }
  };

  if (!task) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--ink-soft)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--brand)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Safe Fallback assignments to protect against undefined database fields
  const assignees = task.currentAssignees || [];
  const members = task.members || [];
  
  const isCurrentAssignee = assignees.some((a) => a._id === user?._id);
  const sStyle = statusStyle[task.status] || statusStyle.pending;
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

  return (
    <div className="task-chat-layout" style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="chat-header" style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(79,70,229,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <button className="secondary" onClick={() => navigate("/dashboard")} style={{ padding: "7px 12px", fontSize: "13px", flexShrink: 0 }}>
              ← Back
            </button>
            <div style={{ minWidth: 0 }}>
              <b style={{ fontFamily: "var(--font-display)", fontSize: "16px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {task.title}
              </b>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
                <span className="meta-text">
                  {assignees.map((a) => a.name).join(", ")}
                </span>
                {isOverdue && (
                  <span style={{ background: "var(--urgent-bg)", color: "var(--urgent)", fontSize: "11px", fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "10px" }}>
                    overdue
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                background: sStyle.bg,
                color: sStyle.text,
                fontWeight: 600,
                border: "none",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value="pending">⏳ Pending</option>
              <option value="working">⚡ Working</option>
              <option value="done">✅ Done</option>
            </select>
            <button
              className="secondary"
              onClick={() => setShowPanel(!showPanel)}
              style={{ padding: "7px 12px", fontSize: "13px" }}
            >
              {showPanel ? "Hide" : "Team"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          {messages.map((msg) => {
            if (msg.type === "system") {
              return (
                <div key={msg._id} style={{ display: "flex", alignItems: "center", gap: "10px", margin: "12px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span className="meta-text" style={{ whiteSpace: "nowrap", color: "var(--ink-soft)", fontSize: "11px" }}>
                    {msg.content}
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                </div>
              );
            }

            const isMe = msg.sender?._id === user?._id;
            return (
              <div key={msg._id} style={{ marginBottom: "6px", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                {!isMe && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", marginLeft: "4px" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 600, color: "white",
                    }}>
                      {msg.sender?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="meta-text">{msg.sender?.name}</span>
                  </div>
                )}

                {msg.type === "text" && (
                  <div style={{
                    background: isMe ? "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)" : "var(--surface)",
                    color: isMe ? "white" : "var(--ink)",
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    maxWidth: "70%",
                    border: isMe ? "none" : "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    lineHeight: 1.5,
                  }}>
                    {msg.content}
                  </div>
                )}

                {msg.type === "audio" && (
                  <div style={{ background: "var(--surface)", borderRadius: "12px", padding: "10px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                    <audio controls src={msg.content} style={{ display: "block", maxWidth: "280px" }} />
                  </div>
                )}

                {msg.type === "video" && (
                  <video controls src={msg.content} style={{ maxWidth: "300px", borderRadius: "12px", boxShadow: "var(--shadow-sm)" }} />
                )}

                {msg.type === "file" && (
                  <a // <-- Fixed the opening tag syntax here
                    href={msg.content}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                      color: "var(--brand)",
                      fontSize: "14px",
                      fontWeight: 500,
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    📄 {msg.fileName || "Download File"}
                  </a>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          boxShadow: "0 -2px 8px rgba(79,70,229,0.04)",
        }}>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} accept="audio/*,video/*,.pdf,.doc,.docx,.fig,.zip" />
          <button className="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: "9px 12px", borderRadius: "10px", flexShrink: 0 }}>
            📎
          </button>
          <AudioRecorder taskId={id} userId={user?._id} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Message..."
            style={{ flex: 1, borderRadius: "20px", background: "var(--surface-sunken)", padding: "8px 14px", border: "1px solid var(--border)" }}
          />
          <button onClick={handleSend} style={{ padding: "9px 18px", borderRadius: "20px", flexShrink: 0 }}>
            Send
          </button>
          {uploading && <span className="meta-text" style={{ flexShrink: 0 }}>Uploading...</span>}
        </div>
      </div>

      {showPanel && (
        <div className="members-panel" style={{
          width: "260px",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, var(--brand-soft) 0%, var(--surface) 100%)" }}>
            <p style={{ fontWeight: 600, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand)", margin: 0 }}>
              Team Members
            </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {members.map((m) => {
              const isCurrent = assignees.some((a) => a._id === m._id);
              const isAdmin = m._id === task.createdBy?._id;
              return (
                <div key={m._id} style={{
                  padding: "10px 12px",
                  background: isCurrent ? "var(--brand-soft)" : "transparent",
                  borderRadius: "12px",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  border: isCurrent ? "1px solid rgba(79,70,229,0.15)" : "1px solid transparent",
                }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
                    background: isCurrent
                      ? "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)"
                      : "var(--surface-sunken)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 600, fontSize: "13px",
                    color: isCurrent ? "white" : "var(--ink-soft)",
                  }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.name}
                    </p>
                    <p className="meta-text" style={{ margin: 0 }}>
                      {isAdmin ? "Admin" : isCurrent ? "Assignee" : "Member"}
                    </p>
                  </div>
                  {isCurrent && <span className="pulse-dot" style={{ flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          <div style={{ padding: "14px", borderTop: "1px solid var(--border)" }}>
            <input
              placeholder="Email address"
              value={delegateEmail}
              onChange={(e) => setDelegateEmail(e.target.value)}
              style={{ width: "100%", marginBottom: "8px", borderRadius: "10px", fontSize: "13px", padding: "6px 10px", border: "1px solid var(--border)" }}
            />
            <button onClick={handleAddAssignee} className="secondary" style={{ width: "100%", marginBottom: "8px", fontSize: "13px" }}>
              + Add Assignee
            </button>
            {isCurrentAssignee && (
              <button onClick={handleDelegate} style={{ width: "100%", fontSize: "13px", background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)" }}>
                Delegate Task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
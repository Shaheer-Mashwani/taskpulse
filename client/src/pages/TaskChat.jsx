import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import AudioRecorder from "../components/AudioRecorder";

const statusColor = {
  pending: { bg: "var(--surface-sunken)", text: "var(--ink-soft)" },
  working: { bg: "var(--brand-soft)", text: "var(--brand)" },
  done: { bg: "var(--easy-bg)", text: "var(--easy)" },
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
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    const taskRes = await axiosInstance.get(`/api/tasks/${id}`);
    setTask(taskRes.data.task);
    const msgRes = await axiosInstance.get(`/api/messages/${id}`);
    setMessages(msgRes.data.messages);
  };

  useEffect(() => {
    loadData();
    socket.emit("join-task", id);

    socket.on("new-message", (msg) => {
      if (msg.task === id || msg.task?.toString() === id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("task-updated", (updatedTask) => {
      if (updatedTask._id === id) setTask(updatedTask);
    });

    return () => {
      socket.emit("leave-task", id);
      socket.off("new-message");
      socket.off("task-updated");
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    socket.emit("send-message", { taskId: id, senderId: user._id, type: "text", content: text });
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

      socket.emit("send-message", {
        taskId: id,
        senderId: user._id,
        type,
        content: res.data.url,
        fileName: res.data.fileName,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleStatusChange = async (status) => {
    await axiosInstance.patch(`/api/tasks/${id}/status`, { status });
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

  if (!task) return <p style={{ padding: "20px", color: "var(--ink-soft)" }}>Loading...</p>;

  const isCurrentAssignee = task.currentAssignees.some((a) => a._id === user._id);
  const sColor = statusColor[task.status];

  return (
    <div className="task-chat-layout" style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="chat-header" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <button className="secondary" onClick={() => navigate("/dashboard")} style={{ marginRight: "12px", padding: "6px 12px", fontSize: "13px" }}>
              ← Back
            </button>
            <b style={{ fontFamily: "var(--font-display)", fontSize: "17px" }}>{task.title}</b>
            <p className="meta-text" style={{ margin: "4px 0 0" }}>
              Assigned to {task.currentAssignees.map((a) => a.name).join(", ")}
            </p>
            
            {/* Deadline conditionally shown here below the assignees list */}
            {task.deadline && (
              <p className="meta-text" style={{ margin: "2px 0 0", color: new Date(task.deadline) < new Date() && task.status !== "done" ? "var(--urgent)" : "var(--ink-soft)" }}>
                Deadline: {new Date(task.deadline).toLocaleDateString()}
                {new Date(task.deadline) < new Date() && task.status !== "done" && " — Overdue"}
              </p>
            )}
          </div>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ background: sColor.bg, color: sColor.text, fontWeight: 500, border: "none" }}
          >
            <option value="pending">Pending</option>
            <option value="working">Working</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
          {messages.map((msg) => {
            if (msg.type === "system") {
              return (
                <p key={msg._id} className="meta-text" style={{ textAlign: "center", margin: "10px 0" }}>
                  {msg.content}
                </p>
              );
            }

            return (
              <div key={msg._id} style={{ marginBottom: "14px" }}>
                <p className="meta-text" style={{ margin: "0 0 4px" }}>{msg.sender?.name}</p>

                {msg.type === "text" && (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "9px 13px", display: "inline-block", fontSize: "14px" }}>
                    {msg.content}
                  </div>
                )}

                {msg.type === "audio" && (
                  <audio controls src={msg.content} style={{ display: "block" }} />
                )}

                {msg.type === "video" && (
                  <video controls src={msg.content} style={{ maxWidth: "320px", display: "block", borderRadius: "10px" }} />
                )}

                {msg.type === "file" && (
                  <a
                    href={msg.content}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "9px 13px", display: "inline-block", textDecoration: "none", color: "var(--ink)", fontSize: "14px" }}
                  >
                    📄 {msg.fileName}
                  </a>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar Section */}
        <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "12px 20px", display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept="audio/*,video/*,.pdf,.doc,.docx,.fig,.zip"
          />
          <button className="secondary" onClick={() => fileInputRef.current.click()} disabled={uploading} style={{ padding: "10px 12px" }}>
            📎
          </button>
          
          {/* Audio Recorder placed right next to attachment button */}
          <AudioRecorder taskId={id} userId={user._id} />

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Message"
            style={{ flex: 1 }}
          />
          <button onClick={handleSend}>Send</button>
          {uploading && <span className="meta-text">Uploading...</span>}
        </div>
      </div>

      <div className="members-panel" style={{ width: "240px", background: "var(--surface)", borderLeft: "1px solid var(--border)", padding: "18px" }}>
        <p style={{ fontWeight: "500", marginBottom: "12px", fontSize: "13px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Members
        </p>
        {task.members.map((m) => {
          const isCurrent = task.currentAssignees.some((a) => a._id === m._id);
          return (
            <div
              key={m._id}
              style={{
                padding: "8px 10px",
                background: isCurrent ? "var(--brand-soft)" : "transparent",
                borderRadius: "8px",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              {isCurrent && <span className="pulse-dot" />}
              <span>
                {m.name} {m._id === task.createdBy._id && <span className="meta-text">(Admin)</span>}
              </span>
            </div>
          );
        })}

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />

        <input
          placeholder="Email"
          value={delegateEmail}
          onChange={(e) => setDelegateEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "8px" }}
        />
        <button className="secondary" onClick={handleAddAssignee} style={{ width: "100%", marginBottom: "8px" }}>
          Add Assignee
        </button>
        {isCurrentAssignee && (
          <button onClick={handleDelegate} style={{ width: "100%" }}>
            Delegate (hand off)
          </button>
        )}
      </div>
    </div>
  );
}
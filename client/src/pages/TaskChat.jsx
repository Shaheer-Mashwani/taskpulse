import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import AudioRecorder from "../components/AudioRecorder";

const statusConfig = {
  pending: { bg: "var(--status-pending-bg)", text: "var(--status-pending-text)", dot: "var(--status-pending-dot)", emoji: "⏳" },
  working: { bg: "var(--status-working-bg)", text: "var(--status-working-text)", dot: "var(--status-working-dot)", emoji: "⚡" },
  done: { bg: "var(--status-done-bg)", text: "var(--status-done-text)", dot: "var(--status-done-dot)", emoji: "✅" },
};

function DelegationPanel({ task, user, onClose }) {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState("add");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    axiosInstance.get("/api/company/members")
      .then((res) => {
        const filtered = res.data.members.filter((m) => m._id !== user._id);
        setMembers(filtered);
      })
      .catch(() => {});
  }, [user._id]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError("Please select at least one member");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = mode === "delegate" ? "delegate" : "add-assignee";
      const selectedMember = members.find((m) => selected.includes(m._id));
      if (!selectedMember) return;

      if (mode === "delegate") {
        await axiosInstance.post(`/api/tasks/${task._id}/delegate`, {
          email: selectedMember.email,
          note,
        });
      } else {
        for (const memberId of selected) {
          const member = members.find((m) => m._id === memberId);
          if (member) {
            await axiosInstance.post(`/api/tasks/${task._id}/add-assignee`, {
              email: member.email,
              note,
            });
          }
        }
      }
      setSuccess(mode === "delegate" ? "Task delegated!" : "Member(s) added!");
      setSelected([]);
      setNote("");
      setTimeout(() => { setSuccess(""); onClose(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const isCurrentAssignee = task.currentAssignees?.some((a) => a._id === user._id);

  return (
    <div style={{
      position: "absolute", top: "70px", right: "12px",
      background: "var(--surface)", borderRadius: "20px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      border: "1px solid var(--border)",
      width: "min(340px, calc(100vw - 24px))",
      zIndex: 200,
      animation: "fadeInDown 0.2s ease",
    }}>
      <style>{`@keyframes fadeInDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{
        padding: "16px 18px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(135deg, var(--brand-soft) 0%, var(--surface) 100%)",
        borderRadius: "20px 20px 0 0",
      }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontFamily: "var(--font-display)" }}>Assign Members</h3>
        <button className="secondary" onClick={onClose} style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "14px" }}>✕</button>
      </div>

      {isCurrentAssignee && (
        <div style={{ display: "flex", gap: "6px", padding: "12px 18px 0" }}>
          {["add", "delegate"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelected([]); }}
              className={mode === m ? "" : "secondary"}
              style={{ flex: 1, padding: "7px", borderRadius: "10px", fontSize: "12px" }}
            >
              {m === "add" ? "➕ Add" : "🔁 Hand Off"}
            </button>
          ))}
        </div>
      )}

      <p className="meta-text" style={{ margin: "10px 18px 6px", fontSize: "11px" }}>
        {mode === "delegate" ? "Select ONE person to hand off your part of this task to:" : "Select members to add to this task:"}
      </p>

      <div style={{ maxHeight: "200px", overflowY: "auto", padding: "0 18px" }}>
        {members.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>No other members in workspace</p>
        ) : members.map((m) => {
          const sel = selected.includes(m._id);
          const isAlreadyAssignee = task.currentAssignees?.some((a) => a._id === m._id);
          return (
            <div
              key={m._id}
              onClick={() => {
                if (isAlreadyAssignee) return;
                if (mode === "delegate") setSelected(sel ? [] : [m._id]);
                else toggle(m._id);
              }}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 10px", borderRadius: "12px", marginBottom: "5px",
                cursor: isAlreadyAssignee ? "not-allowed" : "pointer",
                background: sel ? "var(--brand-soft)" : isAlreadyAssignee ? "var(--surface-sunken)" : "transparent",
                border: `1.5px solid ${sel ? "var(--brand)" : "transparent"}`,
                opacity: isAlreadyAssignee ? 0.5 : 1,
                transition: "all 0.1s ease",
              }}
            >
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: sel ? "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)" : "var(--surface-sunken)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "13px", color: sel ? "white" : "var(--ink-soft)",
                flexShrink: 0,
              }}>
                {m.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 500, margin: 0 }}>{m.name}</p>
                <p className="meta-text" style={{ margin: 0, fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</p>
              </div>
              {isAlreadyAssignee && <span className="meta-text" style={{ fontSize: "10px" }}>assigned</span>}
              {!isAlreadyAssignee && (
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  border: `2px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                  background: sel ? "var(--brand)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.1s ease",
                }}>
                  {sel && <span style={{ color: "white", fontSize: "10px" }}>✓</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "10px 18px 16px" }}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note..."
          style={{ width: "100%", marginBottom: "10px", borderRadius: "10px", fontSize: "13px" }}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: "12px", margin: "0 0 8px", fontFamily: "var(--font-mono)" }}>{error}</p>}
        {success && <p style={{ color: "var(--easy)", fontSize: "12px", margin: "0 0 8px", fontFamily: "var(--font-mono)" }}>✓ {success}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading || selected.length === 0}
          style={{ width: "100%", borderRadius: "12px", padding: "10px", fontSize: "14px" }}
        >
          {loading ? "..." : mode === "delegate" ? "🔁 Delegate" : `➕ Add ${selected.length > 0 ? `(${selected.length})` : ""}`}
        </button>
      </div>
    </div>
  );
}

export default function TaskChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showDelegation, setShowDelegation] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    const [taskRes, msgRes] = await Promise.all([
      axiosInstance.get(`/api/tasks/${id}`),
      axiosInstance.get(`/api/messages/${id}`),
    ]);
    setTask(taskRes.data.task);
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
    socket.on("task-updated", (updated) => {
      if (updated._id === id) setTask(updated);
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
      socket.emit("send-message", { taskId: id, senderId: user._id, type, content: res.data.url, fileName: res.data.fileName });
    } catch { alert("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const handleStatusChange = async (status) => {
    await axiosInstance.patch(`/api/tasks/${id}/status`, { status });
  };

  if (!task) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--brand)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="meta-text">Loading task...</p>
      </div>
    </div>
  );

  const sStyle = statusConfig[task.status];
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .msg-in { background: var(--surface); border: 1px solid var(--border); border-radius: 4px 18px 18px 18px; }
        .msg-out { background: linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%); border-radius: 18px 4px 18px 18px; color: white; }
        .icon-btn { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.15s ease; color: var(--ink-soft); box-shadow: none; }
        .icon-btn:hover { background: var(--surface-sunken); transform: none; }
        .send-btn { width: 40px; height: 40px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 10px rgba(79,70,229,0.35); }
        .send-btn:hover { transform: scale(1.05); }
        @media (max-width: 640px) {
          .task-header { 
            padding: 12px !important; 
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .task-header-right-actions {
            width: 100% !important;
            justify-content: flex-start !important;
            gap: 8px !important;
          }
          .task-header-title { font-size: 15px !important; }
          .task-meta { display: none !important; }
          .chat-area { padding: 12px !important; }
          .input-bar { padding: 8px 10px !important; }
          .side-panel { position: fixed !important; inset: 0 !important; width: 100% !important; z-index: 300 !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* ── TOP HEADER ── */}
      <div
        className="task-header"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 2px 10px rgba(79,70,229,0.06)",
          position: "relative",
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        {/* Back icon */}
        <button
          className="icon-btn"
          onClick={() => navigate("/dashboard")}
          title="Back to dashboard"
          style={{ flexShrink: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Task info */}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <b className="task-header-title" style={{ fontFamily: "var(--font-display)", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "220px" }}>
              {task.title}
            </b>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: sStyle.bg, color: sStyle.text,
              fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600,
              padding: "2px 8px", borderRadius: "20px",
              flexShrink: 0,
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sStyle.dot, display: "inline-block" }} />
              {task.status}
            </span>
            {isOverdue && (
              <span style={{ background: "var(--urgent-bg)", color: "var(--urgent)", fontSize: "10px", fontFamily: "var(--font-mono)", padding: "2px 7px", borderRadius: "10px", flexShrink: 0 }}>
                overdue
              </span>
            )}
          </div>
          <p className="task-meta" style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.currentAssignees?.map((a) => a.name).join(", ")}
            {task.deadline && ` · 📅 ${new Date(task.deadline).toLocaleDateString()}`}
          </p>
        </div>

        {/* Right-side actions */}
        <div 
          className="task-header-right-actions"
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px", 
            flexShrink: 0,
            flexWrap: "nowrap"
          }}
        >
          {/* Status selector */}
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              background: sStyle.bg, color: sStyle.text,
              fontWeight: 600, border: "none", borderRadius: "20px",
              padding: "5px 12px", fontSize: "12px", cursor: "pointer",
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >
            <option value="pending">⏳ Pending</option>
            <option value="working">⚡ Working</option>
            <option value="done">✅ Done</option>
          </select>

          {/* Assign/Delegate button */}
          <button
            onClick={() => setShowDelegation((v) => !v)}
            style={{
              padding: "6px 12px", borderRadius: "20px",
              fontSize: "12px", fontWeight: 600,
              background: showDelegation ? "var(--brand)" : "var(--brand-soft)",
              color: showDelegation ? "white" : "var(--brand)",
              border: "none", cursor: "pointer", flexShrink: 0,
              boxShadow: showDelegation ? "0 2px 10px rgba(79,70,229,0.3)" : "none",
              transition: "all 0.15s ease",
            }}
            title="Assign or delegate task"
          >
            👥 Assign
          </button>

          {/* Members panel toggle */}
          <button
            className="icon-btn"
            onClick={() => setShowPanel((v) => !v)}
            title="View team"
            style={{ flexShrink: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          </button>
        </div>

        {/* Delegation dropdown */}
        {showDelegation && (
          <DelegationPanel
            task={task}
            user={user}
            onClose={() => setShowDelegation(false)}
          />
        )}
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            className="chat-area"
            style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "2px" }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: "center", margin: "auto", color: "var(--ink-soft)" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>💬</div>
                <p style={{ fontSize: "14px" }}>No messages yet. Say something!</p>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.type === "system") {
                return (
                  <div key={msg._id} style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
                    <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                    <span className="meta-text" style={{ whiteSpace: "nowrap", fontSize: "11px", padding: "3px 10px", background: "var(--surface-sunken)", borderRadius: "20px" }}>
                      {msg.content}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  </div>
                );
              }

              const isMe = msg.sender?._id === user._id;
              return (
                <div key={msg._id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: "4px" }}>
                  {!isMe && (
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px", marginLeft: "4px" }}>
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "6px",
                        background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: 700, color: "white",
                      }}>
                        {msg.sender?.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="meta-text" style={{ fontSize: "11px" }}>{msg.sender?.name}</span>
                    </div>
                  )}

                  {msg.type === "text" && (
                    <div
                      className={isMe ? "msg-out" : "msg-in"}
                      style={{
                        padding: "9px 13px", fontSize: "14px",
                        maxWidth: "min(70%, 360px)", lineHeight: 1.5,
                        wordBreak: "break-word",
                        boxShadow: isMe ? "0 2px 8px rgba(79,70,229,0.2)" : "var(--shadow-sm)",
                      }}
                    >
                      {msg.content}
                    </div>
                  )}

                  {msg.type === "audio" && (
                    <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "10px 12px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", maxWidth: "280px" }}>
                      <audio controls src={msg.content} style={{ width: "100%", height: "36px" }} />
                    </div>
                  )}

                  {msg.type === "video" && (
                    <video controls src={msg.content} style={{ maxWidth: "min(300px, 80vw)", borderRadius: "14px", boxShadow: "var(--shadow-sm)" }} />
                  )}

                  {msg.type === "file" && (
                    <a
                      href={msg.content}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: isMe ? "rgba(255,255,255,0.15)" : "var(--surface)",
                        border: `1px solid ${isMe ? "rgba(255,255,255,0.3)" : "var(--border)"}`,
                        borderRadius: "14px", padding: "10px 14px",
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        textDecoration: "none",
                        color: isMe ? "white" : "var(--brand)",
                        fontSize: "13px", fontWeight: 500,
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      📄 {msg.fileName}
                    </a>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div
            className="input-bar"
            style={{
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 -2px 10px rgba(79,70,229,0.04)",
              flexShrink: 0,
            }}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} accept="audio/*,video/*,.pdf,.doc,.docx,.zip" />

            <button
              className="icon-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              title="Attach file"
              style={{ flexShrink: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <AudioRecorder taskId={id} userId={user._id} />

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Message..."
              style={{
                flex: 1,
                borderRadius: "22px",
                background: "var(--surface-sunken)",
                border: "1.5px solid var(--border)",
                padding: "10px 16px",
                fontSize: "14px",
                minWidth: 0,
              }}
            />

            {/* Paper plane send button */}
            <button
              className="send-btn"
              onClick={handleSend}
              title="Send"
              style={{ flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>

            {uploading && <span className="meta-text" style={{ fontSize: "11px", flexShrink: 0 }}>⏳</span>}
          </div>
        </div>

        {/* Members side panel */}
        {showPanel && (
          <div
            className="side-panel"
            style={{
              width: "260px",
              background: "var(--surface)",
              borderLeft: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 20px rgba(79,70,229,0.06)",
            }}
          >
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              background: "linear-gradient(135deg, var(--brand-soft) 0%, var(--surface) 100%)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--brand)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Team
              </p>
              <button className="icon-btn" onClick={() => setShowPanel(false)} style={{ padding: "4px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
              {task.members?.map((m) => {
                const isCurrent = task.currentAssignees?.some((a) => a._id === m._id);
                const isAdmin = m._id === task.createdBy?._id;
                return (
                  <div key={m._id} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px", borderRadius: "14px", marginBottom: "5px",
                    background: isCurrent ? "var(--brand-soft)" : "var(--surface-sunken)",
                    border: `1.5px solid ${isCurrent ? "rgba(79,70,229,0.2)" : "transparent"}`,
                  }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                      background: isCurrent
                        ? "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)"
                        : "var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "14px",
                      color: isCurrent ? "white" : "var(--ink-soft)",
                    }}>
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.name}
                      </p>
                      <p className="meta-text" style={{ margin: "1px 0 0", fontSize: "10px" }}>
                        {isAdmin ? "🛡️ Admin" : isCurrent ? "⚡ Assignee" : "Member"}
                      </p>
                    </div>
                    {isCurrent && <span className="pulse-dot" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
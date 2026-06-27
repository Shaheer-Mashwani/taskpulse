import { useState, useEffect } from "react";
import socket from "../socket";
import axiosInstance from "../api/axiosInstance";

export default function ChatTest() {
  const [taskId, setTaskId] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    socket.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("new-message");
    };
  }, []);

  const handleJoin = async () => {
    if (!taskId) return;

    // Load existing history first
    const res = await axiosInstance.get(`/api/messages/${taskId}`);
    setMessages(res.data.messages);

    socket.emit("join-task", taskId);
    setJoined(true);
  };

  const handleSend = () => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      taskId,
      senderId: user._id,
      type: "text",
      content: text,
    });

    setText("");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Chat Test — logged in as {user?.name}</h2>

      {!joined ? (
        <div>
          <input
            placeholder="Paste a Task ID"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            style={{ width: "300px", marginRight: "10px" }}
          />
          <button onClick={handleJoin}>Join Task Room</button>
        </div>
      ) : (
        <div>
          <p>Joined room: {taskId}</p>

          <div style={{ border: "1px solid #ccc", height: "300px", overflowY: "auto", padding: "10px", marginBottom: "10px" }}>
            {messages.map((msg) => (
              <div key={msg._id} style={{ marginBottom: "8px" }}>
                <b>{msg.sender?.name || "Unknown"}:</b> {msg.content}
              </div>
            ))}
          </div>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message"
            style={{ width: "300px", marginRight: "10px" }}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      )}
    </div>
  );
}
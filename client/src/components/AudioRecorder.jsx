import { useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import socket from "../socket";

export default function AudioRecorder({ taskId, userId }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "voice-note.webm");

        try {
          const res = await axiosInstance.post("/api/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          socket.emit("send-message", {
            taskId,
            senderId: userId,
            type: "audio",
            content: res.data.url,
            fileName: "Voice note",
          });
        } catch (err) {
          console.error("Audio upload failed:", err);
          alert("Failed to send voice note");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setSeconds(0);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {recording ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="pulse-dot" />
          <span className="meta-text">{formatTime(seconds)}</span>
          <button
            onClick={stopRecording}
            style={{ background: "var(--danger)", padding: "8px 12px", fontSize: "12px" }}
          >
            Stop & Send
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="secondary"
          style={{ padding: "10px 12px" }}
          title="Record voice note"
        >
          🎙️
        </button>
      )}
    </div>
  );
}
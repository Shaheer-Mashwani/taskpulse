import { useState } from "react";

export default function FAB({ onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        width: hovered ? "auto" : "58px",
        height: "58px",
        borderRadius: "29px",
        background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
        color: "white",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: hovered ? "0 22px" : "0",
        fontSize: "15px",
        fontWeight: 600,
        boxShadow: "0 6px 24px rgba(79,70,229,0.4)",
        transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: 100,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
      aria-label="Create new task"
    >
      <span style={{ fontSize: "26px", lineHeight: 1, flexShrink: 0 }}>+</span>
      {hovered && <span>New Task</span>}
    </button>
  );
}
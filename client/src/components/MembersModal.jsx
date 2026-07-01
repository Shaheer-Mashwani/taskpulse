import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

export default function MembersModal({ onClose }) {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const loadMembers = async () => {
    try {
      const res = await axiosInstance.get("/api/company/members");
      setMembers(res.data.members);
    } catch (err) {
      console.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAdding(true);
    try {
      const res = await axiosInstance.post("/api/company/members/add", { email });
      setMembers(res.data.members);
      setEmail("");
      setSuccess("Member added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors = {
    admin: { bg: "rgba(79,70,229,0.1)", text: "var(--brand)" },
    member: { bg: "var(--surface-sunken)", text: "var(--ink-soft)" },
    pending: { bg: "#FFFBEB", text: "#92400E" },
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--surface)", borderRadius: "24px",
        width: "100%", maxWidth: "480px", maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 24px 16px",
          background: "linear-gradient(135deg, var(--brand-soft) 0%, var(--surface) 100%)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", margin: 0 }}>
              Team Members
            </h2>
            <p className="meta-text" style={{ margin: "4px 0 0" }}>
              {members.length} people in this workspace
            </p>
          </div>
          <button
            className="secondary"
            onClick={onClose}
            style={{ padding: "6px 12px", borderRadius: "10px", fontSize: "18px", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <form onSubmit={handleAdd} style={{ display: "flex", gap: "8px" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Add by email address"
              type="email"
              required
              style={{ flex: 1, borderRadius: "12px", fontSize: "13px" }}
            />
            <button type="submit" disabled={adding} style={{ borderRadius: "12px", padding: "10px 16px", fontSize: "13px", flexShrink: 0 }}>
              {adding ? "..." : "Add"}
            </button>
          </form>
          {error && (
            <p style={{ color: "var(--danger)", fontSize: "12px", margin: "8px 0 0", fontFamily: "var(--font-mono)" }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ color: "var(--easy)", fontSize: "12px", margin: "8px 0 0", fontFamily: "var(--font-mono)" }}>
              ✓ {success}
            </p>
          )}
        </div>

        <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            style={{ width: "100%", borderRadius: "20px", fontSize: "13px", background: "var(--surface-sunken)", border: "none" }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
          {loading ? (
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", textAlign: "center", padding: "24px" }}>
              Loading members...
            </p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", textAlign: "center", padding: "24px" }}>
              No members found
            </p>
          ) : (
            filtered.map((m) => {
              const rc = roleColors[m.role] || roleColors.member;
              return (
                <div key={m._id} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", borderRadius: "14px", marginBottom: "6px",
                  background: "var(--surface-sunken)",
                  transition: "background 0.1s ease",
                }}>
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "12px",
                    background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "16px", color: "white", flexShrink: 0,
                  }}>
                    {m.avatar
                      ? <img src={m.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "12px", objectFit: "cover" }} />
                      : m.name?.[0]?.toUpperCase()
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.name}
                    </p>
                    <p className="meta-text" style={{ margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.email}
                    </p>
                  </div>
                  <span style={{
                    background: rc.bg, color: rc.text,
                    fontSize: "11px", fontFamily: "var(--font-mono)",
                    padding: "3px 10px", borderRadius: "20px", fontWeight: 500, flexShrink: 0,
                  }}>
                    {m.role}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        // Exchange Google access token for user info
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        const userInfo = await userInfoRes.json();

        // Send to our backend
        const res = await axiosInstance.post("/api/auth/google-token", {
          access_token: tokenResponse.access_token,
          userInfo,
        });

        login(res.data.token, res.data.user);

        if (!res.data.user.company) {
          navigate("/company-setup");
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Login failed:", err);
        setError("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => {
      console.error("Google error:", err);
      setError("Google sign-in was cancelled or failed.");
      setLoading(false);
    },
    flow: "implicit",
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div
          className="card-elevated"
          style={{
            padding: "40px 32px",
            textAlign: "center",
            borderRadius: "24px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(79,70,229,0.35)",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "white",
                  opacity: 0.9,
                }}
              />
            </div>
            <h1
              className="gradient-text"
              style={{
                fontSize: "32px",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                margin: 0,
              }}
            >
              TaskPulse
            </h1>
          </div>

          <p
            style={{
              color: "var(--ink-soft)",
              fontSize: "14px",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            Tasks, conversations, and progress
            <br />— all in one thread.
          </p>

          {/* Status dots */}
          <div
            style={{
              background: "var(--surface-sunken)",
              borderRadius: "14px",
              padding: "14px 20px",
              marginBottom: "28px",
              display: "flex",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            {[
              { dot: "var(--status-pending-dot)", label: "Pending" },
              { dot: "var(--status-working-dot)", label: "Working" },
              { dot: "var(--status-done-dot)", label: "Done" },
            ].map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: s.dot,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ink-soft)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                background: "var(--urgent-bg)",
                color: "var(--urgent)",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                marginBottom: "16px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {error}
            </div>
          )}

          {/* Custom Google Sign-In Button */}
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              handleGoogleLogin();
            }}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: "14px",
              border: "1.5px solid var(--border)",
              background: loading ? "var(--surface-sunken)" : "var(--surface)",
              color: "var(--ink)",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = "var(--brand)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(79,70,229,0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--border)",
                    borderTopColor: "var(--brand)",
                    animation: "spin 0.8s linear infinite",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "var(--ink-soft)" }}>
                  Signing in...
                </span>
              </>
            ) : (
              <>
                {/* Google G logo SVG */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p
            style={{
              marginTop: "16px",
              fontSize: "11px",
              color: "var(--ink-soft)",
              lineHeight: 1.5,
            }}
          >
            By continuing, you agree to TaskPulse's terms of service
          </p>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "16px",
            fontSize: "12px",
            color: "var(--ink-soft)",
          }}
        >
          Sign in with your Google account to get started
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
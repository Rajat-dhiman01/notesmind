// frontend/src/components/LoginPage.jsx

import { useState } from "react";
import { loginWithDemo, loginWithGoogle } from "../lib/auth";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = "865105279668-83p47rnnt1u51621u02umbdd2dsnokcm.apps.googleusercontent.com";

// ---------------------------------------------------------------------------
// Decode a JWT payload without a library
// The middle segment (index 1) is base64-encoded JSON
// ---------------------------------------------------------------------------
function decodeJwtPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

// ---------------------------------------------------------------------------
// Main Login Page
// isModal={true}  → just the card — App.jsx provides the backdrop
// isModal={false} → standalone full-screen page (fallback, not used by App.jsx)
// ---------------------------------------------------------------------------

export default function LoginPage({ onLogin, isModal = false }) {
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [showDemo, setShowDemo]         = useState(false);
  const [demoEmail, setDemoEmail]       = useState("demo@notesmind.app");
  const [demoPassword, setDemoPassword] = useState("");

  // GoogleLogin component calls this with credentialResponse
  // credentialResponse.credential is the id_token (a JWT)
  // We decode it to extract name, email, and profile picture
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const idToken = credentialResponse.credential

      // Decode JWT payload to get profile picture URL
      const payload = decodeJwtPayload(idToken)
      const picture = payload.picture || null   // Google profile photo URL

      // Send id_token to backend — backend validates + issues NotesMind JWT
      const result = await loginWithGoogle(idToken);

      // Pass picture as 4th argument — App.jsx stores it in userPicture state
      onLogin(result.token, result.name, result.email, picture);
    } catch (err) {
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login was cancelled or failed. Please try again.");
  };

  const handleDemoLogin = async () => {
    if (!demoPassword) { setError("Please enter the demo password."); return; }
    setLoading(true);
    setError("");
    try {
      const result = await loginWithDemo(demoEmail, demoPassword);
      // Demo has no profile picture — pass null as 4th argument
      onLogin(result.token, result.name, result.email, null);
    } catch (err) {
      setError(err.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div
      className="login-card"
      style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: "400px",
        margin: "0 20px",
        padding: "44px 40px 40px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: "40px", right: "40px",
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(79,70,229,0.6), transparent)",
        borderRadius: "1px",
      }} />

      {/* Logo + title */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          width: "48px", height: "48px", margin: "0 auto 20px",
          background: "rgba(79,70,229,0.15)",
          border: "1px solid rgba(79,70,229,0.3)",
          borderRadius: "14px", display: "flex",
          alignItems: "center", justifyContent: "center",
          animation: "pulse-ring 2.5s ease infinite",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="rgb(79,70,229)" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{
          margin: "0 0 8px", fontSize: "28px",
          fontFamily: "'Syne', sans-serif", fontWeight: "700",
          background: "linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", letterSpacing: "-0.02em",
        }}>
          NotesMind
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#6b6b6b", letterSpacing: "0.02em" }}>
          Your AI study assistant
        </p>
      </div>

      {/* Buttons */}
      <div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="continue_with"
            width="320"
            disabled={loading}
          />
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: "11px", color: "#3a3a3a", letterSpacing: "0.08em", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Demo login */}
        {!showDemo ? (
          <button
            onClick={() => setShowDemo(true)}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              color: "#a0a0a0", fontSize: "14px",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "#e5e5e5";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "#a0a0a0";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            Use Demo Account
          </button>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px", padding: "16px",
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            <input
              className="demo-input"
              type="email"
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              placeholder="Email"
              style={{
                background: "#111111", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", padding: "10px 14px", color: "#e5e5e5",
                fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 200ms, box-shadow 200ms",
              }}
            />
            <input
              className="demo-input"
              type="password"
              value={demoPassword}
              onChange={(e) => setDemoPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDemoLogin()}
              placeholder="Password"
              style={{
                background: "#111111", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", padding: "10px 14px", color: "#e5e5e5",
                fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 200ms, box-shadow 200ms",
              }}
            />
            <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#3a3a3a" }}>
              demo@notesmind.app · notesmind2024
            </p>
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              style={{
                padding: "11px",
                background: loading ? "rgba(49,46,129,0.8)" : "rgb(79,70,229)",
                border: "none", borderRadius: "8px", color: "#ffffff",
                fontSize: "13px", fontWeight: "500",
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 200ms ease, transform 150ms ease",
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "rgb(67,56,202)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgb(79,70,229)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: "14px", padding: "10px 14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px", color: "#f87171",
            fontSize: "12px", lineHeight: "1.5",
          }}>
            {error}
          </div>
        )}
      </div>

      <p style={{ margin: "28px 0 0", textAlign: "center", fontSize: "11px", color: "#2e2e2e", letterSpacing: "0.02em" }}>
        Sign in to access NotesMind
      </p>
    </div>
  );

  if (isModal) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
          @keyframes pulse-ring {
            0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79,70,229,0.4); }
            70%  { transform: scale(1);    box-shadow: 0 0 0 12px rgba(79,70,229,0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79,70,229,0); }
          }
          .demo-input:focus { outline: none; border-color: rgb(79,70,229) !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
          .login-card { animation: fadeUp 300ms ease both; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        {card}
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79,70,229,0.4); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 12px rgba(79,70,229,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79,70,229,0); }
        }
        .demo-input:focus { outline: none; border-color: rgb(79,70,229) !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
        .login-card { animation: fadeUp 600ms ease 200ms both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={{
        position: "fixed", inset: 0, background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", zIndex: 9999,
      }}>
        <div style={{
          position: "absolute", width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />
        {card}
      </div>
    </GoogleOAuthProvider>
  );
}
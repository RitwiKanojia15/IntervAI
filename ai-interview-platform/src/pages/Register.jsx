import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import InputField from "../components/InputField";
import Spinner from "../components/Spinner";
import PageWrapper from "../components/PageWrapper";

const API_BASE = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5001";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
    <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 10.7z" fill="#FF3D00"/>
    <path d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.5C29.6 36 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-7.5l-7 5.4C8.1 40.8 15.5 45 24 45z" fill="#4CAF50"/>
    <path d="M44.5 20H24v8.5h11.8c-.6 2.8-2.3 5.1-4.7 6.6l6.6 5.5C41.7 37.1 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);

const SocialBtn = ({ icon, label, onClick }) => (
  <button type="button" onClick={onClick}
    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", padding: "11px 14px", borderRadius: "10px", border: "1px solid var(--border-soft)", background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
    {icon} {label}
  </button>
);

const Register = () => {
  const [form, setForm]               = useState({ name: "", email: "", password: "" });
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [registered, setRegistered]   = useState(false);

  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 6) next.password = "Must be at least 6 characters";
    return next;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (serverError) setServerError("");
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) { setErrors(validation); return; }
    setLoading(true);
    try {
      await registerUser(form);
      setRegistered(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center px-4 py-10">
        <PageWrapper style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div className="auth-card" style={{ width: "100%", maxWidth: "920px" }}>
            <div className="auth-left relative z-10" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎉</div>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "12px" }}>Account Created!</h2>
              <p style={{ fontSize: "14px", color: "rgba(245,248,255,0.72)", lineHeight: 1.6 }}>
                Your IntervAI account is ready. Sign in to start your interview preparation.
              </p>
            </div>
            <div className="auth-right" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "20px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "18px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", boxShadow: "0 8px 24px rgba(20,184,166,0.35)" }}>✓</div>
              <div>
                <p style={{ fontFamily: "Syne,sans-serif", fontSize: "20px", fontWeight: 800, color: "white", marginBottom: "8px" }}>Welcome, {form.name}!</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
                  Account registered for <strong style={{ color: "white" }}>{form.email}</strong>
                </p>
              </div>
              <button className="btn-teal" onClick={() => navigate("/login")}
                style={{ width: "100%", padding: "13px", fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                Go to Login →
              </button>
            </div>
          </div>
        </PageWrapper>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-4 py-10">
      <PageWrapper style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div className="auth-card" style={{ width: "100%", maxWidth: "920px" }}>

          {/* Left panel */}
          <div className="auth-left relative z-10">
            <span className="teal-badge inline-flex mb-6">IntervAI</span>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "28px", fontWeight: 800, color: "white", lineHeight: 1.25, marginBottom: "16px" }}>
              Create your interview workspace
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.65, marginBottom: "28px", color: "rgba(245,248,255,0.72)" }}>
              Register once and get resume-based questions, adaptive sessions, and insights to improve your interview performance.
            </p>
            <ul style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {["Personalized AI prompts", "Session scoring and tracking", "Improvement recommendations"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "rgba(245,248,255,0.82)" }}>
                  <span style={{ color: "var(--teal-300)", marginTop: "2px", flexShrink: 0 }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right panel */}
          <div className="auth-right">
            <p className="teal-badge inline-flex mb-3" style={{ fontSize: "10px" }}>New Account</p>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
              Start with IntervAI
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Enter your details to create an account and begin interview practice.
            </p>

            {/* OAuth sign-up — same endpoints, creates account if new */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <SocialBtn
                icon={<GoogleIcon />}
                label="Google"
                onClick={() => { window.location.href = `${API_BASE}/api/auth/google`; }}
              />
              <SocialBtn
                icon={<MicrosoftIcon />}
                label="Microsoft"
                onClick={() => { window.location.href = `${API_BASE}/api/auth/microsoft`; }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-soft)" }} />
              <span style={{ fontSize: "11px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>or register with email</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-soft)" }} />
            </div>

            {serverError && (
              <div className="banner-error" style={{ marginBottom: "16px" }}>
                <span>!</span> {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <InputField label="Full name" name="name" placeholder="Your name"
                value={form.name} onChange={handleChange} error={errors.name} />

              <InputField label="Email" name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} error={errors.email} />

              <div style={{ position: "relative" }}>
                <InputField label="Password" name="password" type={showPw ? "text" : "password"}
                  placeholder="Create a password (min 6 chars)" value={form.password}
                  onChange={handleChange} error={errors.password} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  style={{ position: "absolute", right: "12px", top: "34px", background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "13px" }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="submit" className="btn-teal" disabled={loading}
                  style={{ flex: "1 1 120px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px 20px" }}>
                  {loading ? <><Spinner size="sm" /> Creating...</> : "Register"}
                </button>
                <button type="button" className="btn-outline" onClick={() => navigate("/login")}
                  style={{ flex: "1 1 100px", padding: "11px 16px" }}>
                  Back to login
                </button>
                <button type="button" className="btn-outline" onClick={() => navigate("/")}
                  style={{ flex: "1 1 80px", padding: "11px 16px" }}>
                  Back
                </button>
              </div>
            </form>
          </div>

        </div>
      </PageWrapper>
    </div>
  );
};

export default Register;

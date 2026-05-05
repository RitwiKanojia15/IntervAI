import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";
import InputField from "../components/InputField";
import Spinner from "../components/Spinner";
import PageWrapper from "../components/PageWrapper";

const API_BASE = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5001";

// SVG icons for Google and Microsoft
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

const Login = () => {
  const [form, setForm]               = useState({ email: "", password: "" });
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPw, setShowPw]           = useState(false);

  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("oauthError");

  const { login } = useAuth();
  const navigate  = useNavigate();

  const validate = () => {
    const next = {};
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
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
      const res = await loginUser(form);
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-4 py-10">
      <PageWrapper style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div className="auth-card" style={{ width: "100%", maxWidth: "920px" }}>

          {/* Left panel */}
          <div className="auth-left relative z-10">
            <span className="teal-badge inline-flex mb-6">IntervAI</span>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "28px", fontWeight: 800, color: "white", lineHeight: 1.25, marginBottom: "16px" }}>
              Practice smarter.<br />Interview stronger.
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.65, marginBottom: "28px", color: "rgba(245,248,255,0.72)" }}>
              Your personalized AI interview workspace with adaptive questions, score analytics, and guided improvements.
            </p>
            <ul style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {["Resume-aware question generation", "Real-time practice experience", "Score and performance tracking"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "rgba(245,248,255,0.82)" }}>
                  <span style={{ color: "var(--teal-300)", marginTop: "2px", flexShrink: 0 }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right panel */}
          <div className="auth-right">
            <p className="teal-badge inline-flex mb-3" style={{ fontSize: "10px" }}>Welcome Back</p>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
              Sign in to continue
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Access your dashboard and continue your interview preparation.
            </p>

            {/* OAuth error from redirect */}
            {oauthError && (
              <div className="banner-error" style={{ marginBottom: "16px" }}>
                <span>!</span>{" "}
                {oauthError === "google_not_configured"
                  ? "Google sign-in is not yet configured. Please add your Google credentials to the server."
                  : oauthError === "microsoft_not_configured"
                  ? "Microsoft sign-in is not yet configured. Please add your Microsoft credentials to the server."
                  : oauthError === "google_failed"
                  ? "Google sign-in failed. Please try again or use email."
                  : "Microsoft sign-in failed. Please try again or use email."}
              </div>
            )}

            {/* Social login buttons — redirect to backend OAuth */}
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
              <span style={{ fontSize: "11px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>or sign in with email</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-soft)" }} />
            </div>

            {serverError && (
              <div className="banner-error" style={{ marginBottom: "16px" }}>
                <span>!</span> {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <InputField label="Email" name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} error={errors.email} />

              <div style={{ position: "relative" }}>
                <InputField label="Password" name="password" type={showPw ? "text" : "password"}
                  placeholder="Enter your password" value={form.password} onChange={handleChange}
                  error={errors.password} hint="Use your registered account credentials." />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  style={{ position: "absolute", right: "12px", top: "34px", background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "13px" }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="submit" className="btn-teal" disabled={loading}
                  style={{ flex: "1 1 120px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px 20px" }}>
                  {loading ? <><Spinner size="sm" /> Signing in...</> : "Login"}
                </button>
                <button type="button" className="btn-outline" onClick={() => navigate("/register")}
                  style={{ flex: "1 1 120px", padding: "11px 16px" }}>
                  Create account
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

export default Login;

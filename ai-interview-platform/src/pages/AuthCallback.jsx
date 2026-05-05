import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../services/api";

// This page handles the redirect from Google/Microsoft OAuth
// URL: /auth/callback?token=...&name=...&email=...
const AuthCallback = () => {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      navigate(`/login?oauthError=${error}`);
      return;
    }

    if (!token) {
      navigate("/login");
      return;
    }

    // Store token then fetch full user profile
    localStorage.setItem("token", token);

    getMe()
      .then((res) => {
        login(res.data.user, token);
        navigate("/dashboard");
      })
      .catch(() => {
        // Fallback: build minimal user from query params
        const name  = params.get("name")  || "User";
        const email = params.get("email") || "";
        login({ name, email }, token);
        navigate("/dashboard");
      });
  }, []);

  return (
    <div className="app-bg min-h-screen flex items-center justify-center">
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "22px" }}>
          ✓
        </div>
        <p style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white", marginBottom: "6px" }}>
          Signing you in...
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Please wait a moment.</p>
      </div>
    </div>
  );
};

export default AuthCallback;

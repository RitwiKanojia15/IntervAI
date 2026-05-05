import React from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="app-bg min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      <PageWrapper style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div className="auth-card" style={{ width: "100%", maxWidth: "960px" }}>
          <div className="auth-left relative z-10">
            <span className="teal-badge mb-6 inline-flex">IntervAI</span>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
              AI Powered Interview
              <br />
              Preparation
            </h1>

            <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(245,248,255,0.72)" }}>
              Practice role-specific interviews with adaptive questions, answer quality scoring, and instant
              feedback designed for technical candidates.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button className="btn-teal" onClick={() => navigate("/login")}>
                Start Interview
              </button>
              <button className="btn-outline" onClick={() => navigate("/question-bank")}>
                Practice Questions
              </button>
              <button className="btn-outline" onClick={() => navigate("/login")}>
                Login
              </button>
              <button className="btn-outline" onClick={() => navigate("/register")}>
                Register
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="info-tile">
                <div className="info-tile-label">Mode</div>
                <div className="info-tile-value">Adaptive Questioning</div>
              </div>
              <div className="info-tile">
                <div className="info-tile-label">Signals</div>
                <div className="info-tile-value">AI Feedback Score</div>
              </div>
              <div className="info-tile">
                <div className="info-tile-label">Input</div>
                <div className="info-tile-value">Resume + Live Answers</div>
              </div>
            </div>
          </div>

          <div className="auth-right">
            <p className="teal-badge inline-flex mb-4" style={{ fontSize: "10px" }}>
              Product Snapshot
            </p>
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
              Interview engine built for modern candidates
            </h2>

            <div className="space-y-3 mb-8">
              {[
                { n: "1", title: "Upload Resume",      desc: "Extract skills and generate targeted interview questions." },
                { n: "2", title: "Practice Interview", desc: "Answer progressively harder prompts with timer and webcam support." },
                { n: "3", title: "Track Performance",  desc: "Review score trends, strengths, and improvement opportunities." },
              ].map(({ n, title, desc }) => (
                <div key={n} className="feature-item">
                  <span className="feature-num">{n}.</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="btn-outline" onClick={() => navigate("/login")}>Login</button>
              <button className="btn-teal"    onClick={() => navigate("/register")}>Register</button>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
};

export default Landing;

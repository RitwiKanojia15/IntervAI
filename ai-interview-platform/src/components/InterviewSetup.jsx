import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Loader2, FileText, Upload, History,
  ChevronDown, ChevronUp
} from "lucide-react";
import { getMe, getInterviewHistory } from "../services/api";
import Navbar from "./Navbar";
import PageWrapper from "./PageWrapper";

const ROLES = [
  { value: "software-engineer",    label: "Software Engineer" },
  { value: "frontend-developer",   label: "Frontend Developer" },
  { value: "backend-developer",    label: "Backend Developer" },
  { value: "full-stack-developer", label: "Full Stack Developer" },
  { value: "data-scientist",       label: "Data Scientist" },
  { value: "devops-engineer",      label: "DevOps Engineer" },
  { value: "product-manager",      label: "Product Manager" },
];

const SKILL_OPTIONS = [
  "React","JavaScript","TypeScript","Node.js","Python","Java",
  "DSA","System Design","MongoDB","SQL","AWS","Docker",
  "CSS","Next.js","Express","GraphQL","Redis","Kubernetes",
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const scoreColor = (s) => s >= 70 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#f87171";

const InterviewSetup = ({ onStart, loading }) => {
  const [role, setRole]             = useState("software-engineer");
  const [skills, setSkills]         = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [mode, setMode]             = useState("text");
  const [count, setCount]           = useState(7);
  const [resumeData, setResumeData] = useState(null);
  const [history, setHistory]       = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  const toggleSkill = (s) =>
    setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 5 ? [...prev, s] : prev);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      getMe().catch(() => null),
      getInterviewHistory().catch(() => null),
    ]).then(([meRes, histRes]) => {
      const resume = meRes?.data?.user?.resume;
      if (resume?.skills?.length) {
        setResumeData(resume);
        // Auto-select top resume skills that match SKILL_OPTIONS
        const autoSkills = [...(resume.skills || []), ...(resume.languages || [])]
          .map((s) => SKILL_OPTIONS.find((o) => o.toLowerCase() === s.toLowerCase()))
          .filter(Boolean)
          .slice(0, 3);
        setSkills(autoSkills);
      }
      if (histRes?.data?.sessions?.length) {
        setHistory(histRes.data.sessions);
      }
    }).finally(() => setLoadingData(false));
  }, []);

  const isFromResume = (skill) => {
    if (!resumeData) return false;
    const s = skill.toLowerCase();
    return [...(resumeData.skills || []), ...(resumeData.languages || [])]
      .some((r) => r.toLowerCase().includes(s) || s.includes(r.toLowerCase()));
  };

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px 60px" }}>
        <PageWrapper>
          <span className="teal-badge inline-flex mb-4" style={{ fontSize: "10px" }}>🎤 AI INTERVIEW</span>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
            Configure Your Interview
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
            Our AI generates adaptive questions based on your role, skills, and previous answers.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* ── Resume Recommendations ── */}
              <div className="dash-card" style={{ padding: "20px",
                background: resumeData ? "rgba(20,184,166,0.06)" : "var(--bg-card)",
                border: resumeData ? "1px solid rgba(20,184,166,0.25)" : "1px solid var(--border-soft)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: resumeData ? "16px" : 0 }}>
                  <FileText size={16} style={{ color: resumeData ? "var(--teal-400)" : "var(--text-dim)" }} />
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>
                    {loadingData ? "Loading resume..." : resumeData ? "Resume-Based Recommendations" : "No Resume Found"}
                  </p>
                  {loadingData && <Loader2 size={14} style={{ color: "var(--teal-400)", animation: "spin 1s linear infinite" }} />}
                  {!resumeData && !loadingData && (
                    <button onClick={() => navigate("/resume")} className="btn-teal"
                      style={{ padding: "5px 12px", fontSize: "11px", display: "flex", alignItems: "center", gap: "5px", marginLeft: "auto" }}>
                      <Upload size={11} /> Upload Resume
                    </button>
                  )}
                </div>

                {resumeData && (
                  <div>
                    {resumeData.summary && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "14px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-soft)" }}>
                        💡 {resumeData.summary}
                      </p>
                    )}

                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                      Your Strong Points (from resume)
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                      {[...(resumeData.skills || []), ...(resumeData.languages || [])].slice(0, 10).map((s) => (
                        <span key={s} className="skill-tag strong" style={{ fontSize: "11px", padding: "4px 10px" }}>✓ {s}</span>
                      ))}
                    </div>

                    {resumeData.technicalStrengths?.length > 0 && (
                      <div style={{ marginBottom: "14px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>AI Insights</p>
                        {resumeData.technicalStrengths.slice(0, 2).map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
                            <span style={{ color: "var(--teal-400)", fontSize: "13px", flexShrink: 0 }}>→</span>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{s}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <p style={{ fontSize: "12px", color: "var(--amber-400)", fontWeight: 600 }}>
                        💡 Skills pre-selected from your resume. ⭐ = detected in your resume.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            {/* ── Role ── */}
            <div className="dash-card" style={{ padding: "20px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Target Role</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {ROLES.map((r) => (
                  <button key={r.value} onClick={() => setRole(r.value)}
                    style={{ padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                      background: role === r.value ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.04)",
                      borderColor: role === r.value ? "rgba(20,184,166,0.5)" : "var(--border-soft)",
                      color: role === r.value ? "var(--teal-400)" : "var(--text-muted)" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Skills ── */}
            <div className="dash-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills to Focus On</p>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{skills.length}/5 selected</span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "12px" }}>
                {resumeData ? "⭐ = detected in your resume" : "Select up to 5 skills (optional)"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {SKILL_OPTIONS.map((s) => {
                  const fromResume = isFromResume(s);
                  const selected   = skills.includes(s);
                  return (
                    <button key={s} onClick={() => toggleSkill(s)}
                      disabled={!selected && skills.length >= 5}
                      style={{ padding: "6px 13px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                        background: selected ? "rgba(20,184,166,0.14)" : fromResume ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
                        borderColor: selected ? "rgba(20,184,166,0.5)" : fromResume ? "rgba(251,191,36,0.35)" : "var(--border-soft)",
                        color: selected ? "var(--teal-400)" : fromResume ? "var(--amber-400)" : "var(--text-muted)",
                        opacity: !selected && skills.length >= 5 ? 0.4 : 1 }}>
                      {fromResume && !selected ? "⭐ " : ""}{s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Difficulty + Mode + Count ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div className="dash-card" style={{ padding: "18px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Difficulty</p>
                {["easy", "medium", "hard"].map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", marginBottom: "6px", textAlign: "left", transition: "all 0.18s",
                      background: difficulty === d ? "rgba(20,184,166,0.12)" : "transparent",
                      borderColor: difficulty === d ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                      color: difficulty === d ? "var(--teal-400)" : "var(--text-muted)" }}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              <div className="dash-card" style={{ padding: "18px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Input Mode</p>
                {[{ v: "text", l: "✍️ Text" }, { v: "voice", l: "🎤 Voice" }].map(({ v, l }) => (
                  <button key={v} onClick={() => setMode(v)}
                    style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", marginBottom: "6px", textAlign: "left", transition: "all 0.18s",
                      background: mode === v ? "rgba(20,184,166,0.12)" : "transparent",
                      borderColor: mode === v ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                      color: mode === v ? "var(--teal-400)" : "var(--text-muted)" }}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="dash-card" style={{ padding: "18px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Questions</p>
                {[5, 7, 10].map((n) => (
                  <button key={n} onClick={() => setCount(n)}
                    style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", marginBottom: "6px", textAlign: "left", transition: "all 0.18s",
                      background: count === n ? "rgba(20,184,166,0.12)" : "transparent",
                      borderColor: count === n ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                      color: count === n ? "var(--teal-400)" : "var(--text-muted)" }}>
                    {n} questions
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => onStart({ role, skills, difficulty, mode, count })} disabled={loading}
              className="btn-teal"
              style={{ padding: "14px", fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", opacity: loading ? 0.7 : 1 }}>
              {loading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating questions...</>
                : <><Sparkles size={16} /> Start AI Interview</>}
            </button>

            {/* ── Interview History ── */}
              <div className="dash-card" style={{ padding: "20px" }}>
                <button onClick={() => setShowHistory((v) => !v)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", marginBottom: showHistory && history.length > 0 ? "16px" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <History size={16} style={{ color: "var(--teal-400)" }} />
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>
                      Interview History {history.length > 0 ? `(${history.length})` : ""}
                    </p>
                  </div>
                  {showHistory ? <ChevronUp size={15} style={{ color: "var(--text-dim)" }} /> : <ChevronDown size={15} style={{ color: "var(--text-dim)" }} />}
                </button>

                {showHistory && history.length === 0 && (
                  <p style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>
                    No completed interviews yet. Finish your first session to see history here.
                  </p>
                )}

                {showHistory && history.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {history.map((s) => (
                      <div key={s.sessionId} style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <p style={{ fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>SCORE</p>
                          <p style={{ fontSize: "15px", fontWeight: 800, color: "white" }}>{s.overallScore}%</p>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>
                              {ROLES.find((r) => r.value === s.role)?.label || s.role}
                            </p>
                            <span className={`diff-badge diff-${s.difficulty}`}>{s.difficulty}</span>
                            <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>{s.mode === "voice" ? "🎤" : "✍️"}</span>
                          </div>
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "4px" }}>
                            {(s.skills || []).slice(0, 4).map((sk) => (
                              <span key={sk} className="skill-tag neutral" style={{ fontSize: "10px", padding: "2px 7px" }}>{sk}</span>
                            ))}
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                            {s.questionsAnswered}/{s.totalQuestions} questions · {fmtDate(s.completedAt)}
                          </p>
                        </div>
                        {s.communicationScore && (
                          <div style={{ flexShrink: 0 }}>
                            {["fluency", "confidence", "clarity"].map((k) => (
                              <div key={k} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                                <span style={{ fontSize: "10px", color: "var(--text-dim)", width: "56px", textAlign: "right", textTransform: "capitalize" }}>{k}</span>
                                <div style={{ width: "60px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${s.communicationScore[k] || 0}%`, background: "linear-gradient(90deg,#0f9185,#14b8a6)", borderRadius: "inherit" }} />
                                </div>
                                <span style={{ fontSize: "10px", fontFamily: "JetBrains Mono,monospace", color: scoreColor(s.communicationScore[k] || 0), width: "28px" }}>
                                  {s.communicationScore[k] || 0}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </PageWrapper>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default InterviewSetup;

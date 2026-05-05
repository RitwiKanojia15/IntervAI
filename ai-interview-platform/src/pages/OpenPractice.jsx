import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, ChevronDown, ChevronUp,
  Lightbulb, BookOpen, MessageSquare, RotateCcw, Send,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { OPEN_QUESTIONS } from "../data/openQuestions";

const CATEGORY_COLORS = {
  "System Design": { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.3)", text: "var(--teal-400)", icon: "🏗️" },
  "Frontend":      { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#fbbf24",          icon: "⚡" },
  "Behavioral":    { bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.3)",  text: "#f9a8d4",          icon: "🤝" },
};

const TIMER_OPTIONS = [5, 10, 15, 20];

const OpenPractice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const question = OPEN_QUESTIONS.find((q) => q.id === id);

  const [answer, setAnswer]           = useState("");
  const [submitted, setSubmitted]     = useState(false);
  const [showSample, setShowSample]   = useState(false);
  const [showHints, setShowHints]     = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [activeTab, setActiveTab]     = useState("question");
  const [timerSec, setTimerSec]       = useState(null);
  const [timeLeft, setTimeLeft]       = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const textareaRef = useRef(null);
  const timerRef    = useRef(null);

  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timerRunning && timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, timeLeft]);

  if (!question) {
    return (
      <div className="app-bg min-h-screen">
        <Navbar />
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "20px" }}>Question not found.</p>
          <button className="btn-teal" onClick={() => navigate("/question-bank")}>Back to Question Bank</button>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_COLORS[question.category] || CATEGORY_COLORS["Frontend"];
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    setActiveTab("feedback");
    setTimerRunning(false);
  };

  const handleReset = () => {
    setAnswer("");
    setSubmitted(false);
    setShowSample(false);
    setShowHints(false);
    setShowFollowUps(false);
    setActiveTab("question");
    setTimeLeft(null);
    setTimerRunning(false);
  };

  const startTimer = (mins) => {
    setTimerSec(mins * 60);
    setTimeLeft(mins * 60);
    setTimerRunning(true);
  };

  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerColor = timeLeft !== null && timeLeft < 60 ? "#f87171" : "var(--teal-400)";

  return (
    <div className="app-bg min-h-screen">
      <Navbar />

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,18,32,0.9)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: "64px", zIndex: 50, backdropFilter: "blur(12px)" }}>
        <button
          onClick={() => navigate("/question-bank")}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ArrowLeft size={14} /> Back to Problems
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Timer */}
          {timeLeft !== null ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: `1px solid ${timerColor}44` }}>
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "14px", fontWeight: 700, color: timerColor }}>
                {fmtTime(timeLeft)}
              </span>
              <button onClick={() => { setTimerRunning((r) => !r); }} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "11px" }}>
                {timerRunning ? "⏸" : "▶"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Timer:</span>
              {TIMER_OPTIONS.map((m) => (
                <button key={m} onClick={() => startTimer(m)}
                  style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--teal-400)"; e.currentTarget.style.color = "var(--teal-400)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          <span className={`diff-badge diff-${question.difficulty}`}>{question.difficulty.toUpperCase()}</span>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* LEFT — Question panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid var(--border-soft)" }}>
            {["question", "key points", "follow-ups"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "8px", borderRadius: "7px", fontSize: "12px", fontWeight: 600,
                  background: activeTab === tab ? "rgba(20,184,166,0.14)" : "transparent",
                  border: `1px solid ${activeTab === tab ? "rgba(20,184,166,0.3)" : "transparent"}`,
                  color: activeTab === tab ? "var(--teal-400)" : "var(--text-muted)",
                  cursor: "pointer", transition: "all 0.18s", textTransform: "capitalize",
                }}
              >{tab}</button>
            ))}
          </div>

          {/* Question tab */}
          {activeTab === "question" && (
            <div className="dash-card" style={{ padding: "24px" }}>
              {/* Category badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "20px" }}>{cat.icon}</span>
                <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text }}>
                  {question.category}
                </span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {question.tags.map((t) => (
                    <span key={t} className="skill-tag neutral" style={{ fontSize: "10px", padding: "3px 8px" }}>{t}</span>
                  ))}
                </div>
              </div>

              <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "20px", fontWeight: 800, color: "white", marginBottom: "16px", lineHeight: 1.3 }}>
                {question.title}
              </h1>

              <div style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {question.description}
              </div>

              <div style={{ marginTop: "20px", padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)", fontSize: "12px", color: "var(--text-dim)" }}>
                <strong style={{ color: "var(--text-muted)" }}>Asked at:</strong> {question.companies.join(", ")}
              </div>

              {/* Hints */}
              <div style={{ marginTop: "16px", borderRadius: "10px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)", overflow: "hidden" }}>
                <button onClick={() => setShowHints((h) => !h)}
                  style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--amber-400)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Lightbulb size={15} /> Key Things to Cover</span>
                  {showHints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showHints && (
                  <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {question.keyPoints.map((pt, i) => (
                      <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <span style={{ color: "var(--amber-400)", fontWeight: 700, fontSize: "12px", marginTop: "1px", flexShrink: 0 }}>{i + 1}.</span>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{pt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Points tab */}
          {activeTab === "key points" && (
            <div className="dash-card" style={{ padding: "24px" }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white", marginBottom: "16px" }}>
                What a Strong Answer Covers
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {question.keyPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(20,184,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)" }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups tab */}
          {activeTab === "follow-ups" && (
            <div className="dash-card" style={{ padding: "24px" }}>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white", marginBottom: "16px" }}>
                Follow-up Questions
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "16px" }}>
                Interviewers often dig deeper with these. Make sure you can answer them.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {question.followUps.map((fu, i) => (
                  <div key={i} style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <MessageSquare size={15} style={{ color: "var(--teal-400)", flexShrink: 0, marginTop: "2px" }} />
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{fu}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback tab (after submit) */}
          {activeTab === "feedback" && submitted && (
            <div className="dash-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <CheckCircle2 size={22} style={{ color: "#4ade80" }} />
                <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>
                  Answer Submitted
                </h2>
              </div>

              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: 1.6 }}>
                Compare your answer against the sample response below. Focus on what you covered and what you missed.
              </p>

              {/* Self-assessment checklist */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                  Self-Assessment
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {question.keyPoints.map((pt, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                      <input type="checkbox" style={{ marginTop: "3px", accentColor: "var(--teal-400)", flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{pt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sample answer */}
              <div style={{ borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", overflow: "hidden" }}>
                <button onClick={() => setShowSample((s) => !s)}
                  style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--teal-400)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><BookOpen size={15} /> View Sample Answer</span>
                  {showSample ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showSample && (
                  <div style={{ padding: "0 16px 16px", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                    {question.sampleAnswer}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Answer panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="dash-card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "520px" }}>
            {/* Answer header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={15} style={{ color: "var(--teal-400)" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>Your Answer</span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "JetBrains Mono,monospace" }}>
                {wordCount} words
              </span>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={submitted}
              placeholder={`Write your answer here...\n\nTip: Use the STAR method for behavioral questions, or structure system design answers around: Requirements → High-Level Design → Deep Dive → Trade-offs`}
              style={{
                flex: 1,
                padding: "20px",
                background: "transparent",
                border: "none",
                outline: "none",
                color: submitted ? "var(--text-muted)" : "var(--text-primary)",
                fontSize: "14px",
                lineHeight: 1.75,
                resize: "none",
                fontFamily: "DM Sans, sans-serif",
                minHeight: "400px",
                opacity: submitted ? 0.7 : 1,
              }}
            />

            {/* Footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center" }}>
              {submitted ? (
                <>
                  <span style={{ fontSize: "12px", color: "#4ade80", display: "flex", alignItems: "center", gap: "6px", marginRight: "auto" }}>
                    <CheckCircle2 size={14} /> Submitted
                  </span>
                  <button onClick={handleReset} className="btn-outline"
                    style={{ padding: "9px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                    <RotateCcw size={13} /> Try Again
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleReset} className="btn-outline"
                    style={{ padding: "9px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                    <RotateCcw size={13} /> Reset
                  </button>
                  <button onClick={handleSubmit} disabled={!answer.trim()} className="btn-teal"
                    style={{ padding: "9px 22px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", opacity: answer.trim() ? 1 : 0.5 }}>
                    <Send size={13} /> Submit Answer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tips card */}
          {!submitted && (
            <div style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#a5b4fc", marginBottom: "8px" }}>💡 Tips for a strong answer</p>
              <ul style={{ paddingLeft: "16px", fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.8 }}>
                {question.category === "Behavioral" && (
                  <>
                    <li>Use the STAR method: Situation → Task → Action → Result</li>
                    <li>Be specific — use a real example with measurable outcomes</li>
                    <li>Keep it under 2 minutes when spoken aloud (~300 words)</li>
                  </>
                )}
                {question.category === "System Design" && (
                  <>
                    <li>Start with clarifying requirements and scale estimates</li>
                    <li>Sketch a high-level diagram before diving into details</li>
                    <li>Discuss trade-offs — there's no single right answer</li>
                  </>
                )}
                {question.category === "Frontend" && (
                  <>
                    <li>Cover the "why" before the "what" — motivation matters</li>
                    <li>Use code examples to illustrate concepts</li>
                    <li>Mention edge cases and browser compatibility where relevant</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenPractice;

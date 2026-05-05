import React, { useState } from "react";
import { BarChart2 } from "lucide-react";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import { useStats } from "../context/StatsContext";

const Analytics = () => {
  const [period, setPeriod] = useState("week");
  const { stats, loading }  = useStats();

  // ── Derived data ──────────────────────────────────────────────────────────
  const avgScore   = stats?.avgScore   ?? 0;
  const interviews = stats?.totalInterviews ?? 0;
  const hours      = stats?.hourspracticed ?? 0;
  const streak     = stats?.currentStreak ?? 0;

  const scoreTrend = stats?.scoreTrend ?? [
    { label: "Mon", score: 0 }, { label: "Tue", score: 0 }, { label: "Wed", score: 0 },
    { label: "Thu", score: 0 }, { label: "Fri", score: 0 }, { label: "Sat", score: 0 }, { label: "Sun", score: 0 },
  ];

  const heatmap = stats?.heatmap ?? Array(49).fill(0);

  const skillBreakdown = stats?.skillBreakdown ?? {};
  const skillEntries   = Object.entries(skillBreakdown).sort((a, b) => b[1] - a[1]);

  const commAvg = stats?.communicationAvg ?? { fluency: 0, confidence: 0, clarity: 0 };

  const scoreBreakdown = [
    { label: "Communication",   pct: commAvg.fluency },
    { label: "Confidence",      pct: commAvg.confidence },
    { label: "Clarity",         pct: commAvg.clarity },
    { label: "Technical Depth", pct: avgScore },
    { label: "Overall",         pct: avgScore },
  ];

  const recentSessions = stats?.recentSessions ?? [];

  const fmtAgo = (d) => {
    if (!d) return "";
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const skillLevel = (pct) => pct >= 70 ? "strong" : pct >= 50 ? "medium" : "weak";

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px" }}>
        <PageWrapper>
          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <span className="teal-badge inline-flex mb-2" style={{ fontSize: "10px" }}>
                <BarChart2 size={10} /> ANALYTICS
              </span>
              <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white" }}>
                Performance Analytics
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                Track your progress and identify areas for improvement
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["week", "month", "all"].map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                    background: period === p ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${period === p ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.08)"}`,
                    color: period === p ? "var(--teal-400)" : "var(--text-muted)",
                    cursor: "pointer", fontFamily: "DM Sans,sans-serif", textTransform: "capitalize" }}>
                  {p === "all" ? "All Time" : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
                </button>
              ))}
            </div>
          </div>

          {/* KPI row */}
          <div className="kpi-grid fade-up">
            {[
              { icon: "🎯", label: "Avg Score",      value: loading ? "…" : `${avgScore}%`, delta: avgScore > 0 ? `${avgScore}%` : "—", dir: avgScore > 0 ? "up" : "neutral", bg: "rgba(20,184,166,0.12)" },
              { icon: "🎤", label: "Interviews",      value: loading ? "…" : `${interviews}`, delta: interviews > 0 ? `+${interviews}` : "0", dir: interviews > 0 ? "up" : "neutral", bg: "rgba(99,102,241,0.12)" },
              { icon: "⏱",  label: "Practice Time",  value: loading ? "…" : `${hours}h`, delta: hours > 0 ? `+${hours}h` : "—", dir: hours > 0 ? "up" : "neutral", bg: "rgba(245,158,11,0.12)" },
              { icon: "🔥", label: "Current Streak", value: loading ? "…" : `${streak}`, delta: streak > 0 ? "days" : "—", dir: "neutral", bg: "rgba(249,115,22,0.12)" },
            ].map(({ icon, label, value, delta, dir, bg }) => (
              <div key={label} className="kpi-card">
                <div className="kpi-icon" style={{ background: bg }}>{icon}</div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-label">{label}</div>
                <div className={`kpi-delta ${dir}`}>{dir === "up" ? "↑" : dir === "down" ? "↓" : ""} {delta}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            {/* Score trend chart */}
            <div className="dash-card fade-up delay-1">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>Score Trend</h3>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Last 7 days</span>
              </div>
              {scoreTrend.every((d) => d.score === 0) ? (
                <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "12px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "10px" }}>
                  Complete interviews to see your score trend
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
                  {scoreTrend.map(({ label, score }) => (
                    <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                      <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", background: "linear-gradient(180deg,#14b8a6,#0d9488)", borderRadius: "6px 6px 3px 3px", height: `${Math.max(score, 4)}%`, opacity: score > 0 ? 0.85 : 0.2, transition: "all 0.4s", boxShadow: score > 0 ? "0 0 8px rgba(20,184,166,0.3)" : "none" }}
                          onMouseEnter={(e) => { if (score > 0) e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(e) => { if (score > 0) e.currentTarget.style.opacity = "0.85"; }}
                        />
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "JetBrains Mono,monospace" }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score breakdown */}
            <div className="dash-card fade-up delay-1">
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "18px" }}>Score Breakdown</h3>
              {scoreBreakdown.map(({ label, pct }) => (
                <div key={label} className="score-row">
                  <span className="score-row-label">{label}</span>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="score-pct">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Skill analysis */}
            <div className="dash-card fade-up delay-2">
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "6px" }}>Skill Analysis</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                {interviews > 0 ? `Based on your ${interviews} interview${interviews > 1 ? "s" : ""}` : "Complete interviews to see skill analysis"}
              </p>

              {skillEntries.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "10px" }}>
                  No skill data yet. Complete an interview to see your skill breakdown.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "16px" }}>
                    {skillEntries.map(([name, score]) => (
                      <span key={name} className={`skill-tag ${skillLevel(score)}`}>
                        {skillLevel(score) === "strong" ? "✓" : skillLevel(score) === "weak" ? "↑" : "→"} {name}
                      </span>
                    ))}
                  </div>
                  {skillEntries.map(([name, score]) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "140px", flexShrink: 0 }}>{name}</span>
                      <div className="score-bar-track" style={{ flex: 1 }}>
                        <div className="score-bar-fill" style={{ width: `${score}%`,
                          background: skillLevel(score) === "strong" ? "linear-gradient(90deg,#0d9488,#14b8a6)" :
                                      skillLevel(score) === "weak"   ? "linear-gradient(90deg,#dc2626,#ef4444)" :
                                      "linear-gradient(90deg,#b45309,#f59e0b)" }} />
                      </div>
                      <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono,monospace", color: "var(--text-muted)", width: "30px", textAlign: "right" }}>{score}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Streak heatmap */}
            <div className="dash-card fade-up delay-2">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>Practice Streak</h3>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 700, color: "#f97316" }}>
                  🔥 {streak} day{streak !== 1 ? "s" : ""}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>Daily practice activity — last 7 weeks</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px" }}>
                {heatmap.map((v, i) => (
                  <div key={i} className={`heat-cell heat-${v}`} title={`Activity: ${v}`} />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Less</span>
                {[0,1,2,3,4].map((v) => <div key={v} className={`heat-cell heat-${v}`} style={{ width: "12px", height: "12px" }} />)}
                <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>More</span>
              </div>

              {/* Recent sessions */}
              <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "14px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "white", marginBottom: "10px" }}>Recent Sessions</p>
                {recentSessions.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>No sessions yet. Start your first interview!</p>
                ) : recentSessions.map((s) => (
                  <div key={s.sessionId} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "16px" }}>🎤</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.role} Interview
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>{fmtAgo(s.completedAt)}</p>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "JetBrains Mono,monospace",
                      color: s.score >= 80 ? "var(--teal-400)" : s.score >= 65 ? "#fbbf24" : "#f87171" }}>
                      {s.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default Analytics;

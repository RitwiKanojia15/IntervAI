/* eslint-disable */
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FlaskConical, Zap, Users, Star, Upload, Gamepad2,
  BookOpen, LogOut, BarChart2, Trophy, TrendingUp,
  Mic2, Brain, Target, ClipboardList
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import { getSavedTestResult } from "../utils/testSessionStorage";
import { getAccuracyPercentage, formatCategoryLabel, formatDifficultyLabel } from "../utils/testHelpers";

const NAV_ITEMS = [
  { key: "T", label: "Take Test",         icon: FlaskConical, path: "/take-test" },
  { key: "L", label: "Live Tests",         icon: Zap,          path: "/live-tests" },
  { key: "G", label: "Group Discussion",   icon: Users,        path: "/gd" },
  { key: "V", label: "Versant Assessment", icon: Star,         path: "/versant" },
  { key: "S", label: "Upload Resume",      icon: Upload,       path: "/upload-resume" },
  { key: "A", label: "APTI-HUB Elite",     icon: Trophy,       path: "/question-bank" },
  { key: "R", label: "Gaming Round",       icon: Gamepad2,     path: "/leaderboard" },
  { key: "H", label: "Learning Hub",       icon: BookOpen,     path: "/question-bank" },
  { key: "O", label: "Logout",             icon: LogOut,       path: null, danger: true },
];

// Mini sparkline SVG
const Sparkline = ({ values, color }) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80; const h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="3" fill={color} />
    </svg>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const initial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const lastResult = getSavedTestResult();

  // Build KPI data from real stats
  const avgScore   = stats?.avgScore   ?? 0;
  const interviews = stats?.totalInterviews ?? 0;
  const hours      = stats?.hourspracticed ?? 0;
  const streak     = stats?.currentStreak ?? 0;

  const kpiData = [
    { icon: "🎯", label: "Avg Score",       value: `${avgScore}%`,  delta: avgScore > 0 ? `${avgScore}%` : "—",  dir: avgScore > 0 ? "up" : "neutral", spark: stats?.scoreTrend?.map((d) => d.score) || [0,0,0,0,0,0,0], color: "#14b8a6" },
    { icon: "🎤", label: "Interviews",       value: `${interviews}`, delta: interviews > 0 ? `+${interviews}` : "0", dir: interviews > 0 ? "up" : "neutral", spark: [0,1,1,2,3,interviews > 5 ? interviews - 2 : 1, interviews], color: "#818cf8" },
    { icon: "⏱",  label: "Hours Practiced", value: `${hours}h`,     delta: hours > 0 ? `+${hours}h` : "—",      dir: hours > 0 ? "up" : "neutral",      spark: [0,0.5,1,2,3,hours > 3 ? hours - 1 : 1, hours],           color: "#f59e0b" },
    { icon: "🔥", label: "Day Streak",       value: `${streak}`,     delta: streak > 0 ? "days" : "—",           dir: "neutral",                          spark: stats?.heatmap?.slice(-7) || [0,0,0,0,0,0,0],              color: "#f97316" },
  ];

  const handleNav = (item) => {
    if (item.danger) { logout(); navigate("/login"); return; }
    if (item.path) navigate(item.path);
  };

  return (
    <div className="app-bg min-h-screen">
      {/* Full Navbar */}
      <Navbar />

      <div style={{ padding: "24px" }}>
        <PageWrapper>
          <div className="grid grid-cols-1 xl:grid-cols-[240px,1fr] gap-5">

            {/* SIDEBAR */}
            <div className="sidebar fade-up self-start xl:sticky xl:top-20">
              {/* User info */}
              <div style={{ textAlign: "center", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#0d9488,#1a6b5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "white", margin: "0 auto 8px" }}>
                  {initial}
                </div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "white", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px", margin: "0 auto 6px" }}>
                  {user?.email || "user@example.com"}
                </p>
                <span className="teal-badge" style={{ fontSize: "9px" }}>STUDENT</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {NAV_ITEMS.map(item => (
                  <button key={item.key}
                    className={`sidebar-item ${item.danger ? "" : ""}`}
                    onClick={() => handleNav(item)}
                    style={{ color: item.danger ? "" : "" }}
                    onMouseEnter={e => { if (item.danger) e.currentTarget.style.color="#f87171"; }}
                    onMouseLeave={e => { if (item.danger) e.currentTarget.style.color=""; }}
                  >
                    <span className="sidebar-key">{item.key}</span>
                    <item.icon size={13} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Welcome banner */}
              <div className="dash-card fade-up delay-1" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.15) 0%, rgba(20,184,166,0.08) 50%, transparent 100%)", borderColor: "rgba(20,184,166,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p className="teal-badge inline-flex mb-2" style={{ fontSize: "10px" }}>INTERVAI DASHBOARD</p>
                    <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
                      Welcome back, {firstName} 👋
                    </h1>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      Review interview progress, launch a new session, and improve with AI feedback.
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, fontSize: "52px", opacity: 0.6 }}>🎤</div>
                </div>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 fade-up delay-2">
                {kpiData.map(({ icon, label, value, delta, dir, spark, color }) => (
                  <div key={label} className="kpi-card" style={{ position: "relative", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <span style={{ fontSize: "20px" }}>{icon}</span>
                      <Sparkline values={spark} color={color} />
                    </div>
                    <div className="kpi-value" style={{ fontSize: "22px" }}>{value}</div>
                    <div className="kpi-label">{label}</div>
                    <div className={`kpi-delta ${dir}`} style={{ marginTop: "4px" }}>
                      {dir === "up" ? "↑" : ""} {delta}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main 2-col grid */}
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                {/* Past Interviews */}
                <div className="dash-card fade-up delay-2">
                  <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "4px" }}>Past Interviews</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>No completed interviews yet.</p>
                  <div style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "10px", padding: "28px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                    Complete your first interview to see session history here.
                  </div>
                  <button className="btn-teal" onClick={() => navigate("/interview")}
                    style={{ width: "100%", marginTop: "14px", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                    <Mic2 size={14} /> Start First Interview
                  </button>
                </div>

                {/* AI Feedback Score */}
                <div className="dash-card fade-up delay-2">
                  <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "4px" }}>AI Feedback Score</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>Latest overall performance score from your most recent session.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "76px", height: "76px", borderRadius: "16px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 8px 20px rgba(20,184,166,0.3)" }}>
                      <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.05em", lineHeight: 1.3, textAlign: "center" }}>LATEST<br />SCORE</p>
                      <p style={{ fontSize: "22px", fontWeight: 800, color: "white", marginTop: "2px" }}>—</p>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>Take an interview to generate your first score. Results appear here instantly.</p>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="dash-card fade-up delay-3">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <BarChart2 size={16} style={{ color: "var(--teal-400)" }} />
                    <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>Performance Chart</h3>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>Visual trend of recent session scores.</p>
                  <div style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "10px", padding: "28px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                    No chart data yet. Complete an interview to populate this chart.
                  </div>
                  <button className="btn-outline" onClick={() => navigate("/analytics")}
                    style={{ width: "100%", marginTop: "14px", padding: "9px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                    <BarChart2 size={13} /> View Full Analytics
                  </button>
                </div>

                {/* Last Test Result */}
                <div className="dash-card fade-up delay-3">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <ClipboardList size={16} style={{ color: "var(--teal-400)" }} />
                    <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>Last Test Result</h3>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
                    Your most recent aptitude test attempt.
                  </p>

                  {lastResult ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
                        <div style={{
                          width: "72px", height: "72px", borderRadius: "16px", flexShrink: 0,
                          background: "linear-gradient(135deg,#0d9488,#14b8a6)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 8px 20px rgba(20,184,166,0.3)",
                        }}>
                          <p style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.05em" }}>ACCURACY</p>
                          <p style={{ fontSize: "22px", fontWeight: 800, color: "white" }}>
                            {getAccuracyPercentage(lastResult.correct, lastResult.total)}%
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "4px" }}>
                            {formatCategoryLabel(lastResult.meta?.category || lastResult.category)} · {formatDifficultyLabel(lastResult.meta?.difficulty || lastResult.difficulty)}
                          </p>
                          <div style={{ display: "flex", gap: "12px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>✅ {lastResult.correct} correct</span>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>❌ {lastResult.wrong} wrong</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
                            Score: {lastResult.score} · {lastResult.total} questions
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-teal" onClick={() => navigate("/take-test/results")}
                          style={{ flex: 1, padding: "9px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <ClipboardList size={13} /> View Full Result
                        </button>
                        <button className="btn-outline" onClick={() => navigate("/take-test")}
                          style={{ flex: 1, padding: "9px", fontSize: "12px" }}>
                          Retake Test
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "10px", padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px", marginBottom: "12px" }}>
                        No test completed yet. Take your first aptitude test to see results here.
                      </div>
                      <button className="btn-teal" onClick={() => navigate("/take-test")}
                        style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                        🎯 Take Aptitude Test
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick links row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 fade-up delay-4">
                {[
                  { icon: Brain, label: "Question Bank", desc: "349 curated questions", path: "/question-bank", color: "rgba(99,102,241,0.12)", text: "#a5b4fc" },
                  { icon: Trophy, label: "Leaderboard", desc: "You're rank #8 globally", path: "/leaderboard", color: "rgba(245,158,11,0.12)", text: "#fbbf24" },
                  { icon: Target, label: "My Analytics", desc: "78% avg score this week", path: "/analytics", color: "rgba(20,184,166,0.12)", text: "var(--teal-400)" },
                ].map(({ icon: Icon, label, desc, path, color, text }) => (
                  <button key={label} onClick={() => navigate(path)}
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "12px" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ width: "36px", height: "36px", background: color, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} style={{ color: text }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{label}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};
export default Dashboard;

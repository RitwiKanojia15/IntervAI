/* eslint-disable */
import React, { useState, useEffect } from "react";
import { Clock, Edit2, Flame, Shield, Target, TrendingUp, FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";
import { getMe, updateProfile } from "../services/api";

const ACHIEVEMENTS = [
  { icon: "🎯", name: "First Interview", desc: "Completed your first session", unlocked: true },
  { icon: "🔥", name: "On Fire", desc: "7-day practice streak", unlocked: false },
  { icon: "🏆", name: "Top 10", desc: "Reached top 10 on leaderboard", unlocked: false },
  { icon: "💯", name: "Perfect Score", desc: "Score 100% on any interview", unlocked: false },
  { icon: "📚", name: "Bookworm", desc: "Saved 20+ questions", unlocked: false },
  { icon: "⚡", name: "Speed Demon", desc: "Complete interview under 10min", unlocked: false },
  { icon: "🤝", name: "Team Player", desc: "Helped 5 peers in groups", unlocked: false },
  { icon: "🎓", name: "Graduate", desc: "Complete all skill categories", unlocked: false },
];

const PROFILE_FIELDS = [
  { key: "role", label: "Target Role" },
  { key: "college", label: "College" },
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
];

const SKILL_LEVEL_MAP = {
  react: "strong", javascript: "strong", typescript: "medium", css: "strong",
  "node.js": "medium", node: "medium", express: "medium",
  mongodb: "medium", mysql: "medium", postgresql: "medium",
  docker: "medium", kubernetes: "weak", aws: "medium", azure: "weak", gcp: "weak",
  redis: "medium", git: "strong", tailwind: "strong", "next.js": "medium",
  "machine learning": "weak", "deep learning": "weak",
  "data structures": "medium", algorithms: "medium", sql: "medium",
};

const getSkillLevel = (skill) => SKILL_LEVEL_MAP[skill.toLowerCase()] || "medium";

const Profile = () => {
  const { user: authUser, login } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", role: "", college: "", bio: "", github: "", linkedin: "",
  });

  useEffect(() => {
    getMe()
      .then((res) => {
        const u = res.data.user;
        setProfileData(u);
        setForm({
          name: u.name || "",
          email: u.email || "",
          role: u.role || "",
          college: u.college || "",
          bio: u.bio || "",
          github: u.github || "",
          linkedin: u.linkedin || "",
        });
      })
      .catch(() => {
        // fallback to auth context data
        if (authUser) {
          setForm({
            name: authUser.name || "",
            email: authUser.email || "",
            role: authUser.role || "",
            college: authUser.college || "",
            bio: authUser.bio || "",
            github: authUser.github || "",
            linkedin: authUser.linkedin || "",
          });
        }
      });
  }, [authUser]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await updateProfile({
        name: form.name,
        role: form.role,
        college: form.college,
        bio: form.bio,
        github: form.github,
        linkedin: form.linkedin,
      });
      const updated = res.data.user;
      setProfileData(updated);
      // keep auth context in sync
      login(updated, localStorage.getItem("token"));
      setEditMode(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const resume = profileData?.resume || null;
  const allSkills = resume
    ? [...(resume.skills || []), ...(resume.languages || []).map((l) => l)]
    : [];

  // Dynamic achievements based on real stats
  const s = stats || {};
  const ACHIEVEMENTS = [
    { icon: "🎯", name: "First Interview",  desc: "Completed your first session",    unlocked: (s.totalInterviews ?? 0) >= 1 },
    { icon: "🔥", name: "On Fire",          desc: "7-day practice streak",            unlocked: (s.bestStreak ?? 0) >= 7 },
    { icon: "🏆", name: "Top 10",           desc: "Reached top 10 on leaderboard",   unlocked: false },
    { icon: "💯", name: "Perfect Score",    desc: "Score 100% on any interview",     unlocked: (s.avgScore ?? 0) >= 100 },
    { icon: "📚", name: "Bookworm",         desc: "Completed 5+ interviews",         unlocked: (s.totalInterviews ?? 0) >= 5 },
    { icon: "⚡", name: "Speed Demon",      desc: "Complete interview under 10min",  unlocked: false },
    { icon: "🤝", name: "Team Player",      desc: "Helped 5 peers in groups",        unlocked: false },
    { icon: "🎓", name: "Graduate",         desc: "Complete all skill categories",   unlocked: Object.keys(s.skillBreakdown || {}).length >= 5 },
  ];
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;

  const initials = (form.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app-bg min-h-screen">
      <Navbar />

      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "28px 24px" }}>
        <PageWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-5">
            {/* Left column */}
            <div className="flex flex-col gap-4">
              <div className="dash-card" style={{ textAlign: "center", padding: "28px 20px" }}>
                <div style={{ position: "relative", width: "80px", margin: "0 auto 14px" }}>
                  <div
                    style={{
                      width: "80px", height: "80px", borderRadius: "20px",
                      background: "linear-gradient(135deg,#0d9488,#14b8a6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "28px", fontWeight: 800, color: "white",
                      boxShadow: "0 8px 24px rgba(20,184,166,0.35)",
                    }}
                  >
                    {initials}
                  </div>
                  <div
                    style={{
                      position: "absolute", bottom: "-3px", right: "-3px",
                      width: "22px", height: "22px", background: "#22c55e",
                      borderRadius: "50%", border: "2px solid #0d1117",
                    }}
                  />
                </div>

                {editMode ? (
                  <input
                    value={form.name}
                    onChange={(ev) => setForm((prev) => ({ ...prev, name: ev.target.value }))}
                    className="dark-input"
                    style={{ textAlign: "center", marginBottom: "6px", fontSize: "16px", fontWeight: 700 }}
                  />
                ) : (
                  <p style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 800, color: "white", marginBottom: "4px" }}>
                    {form.name || "—"}
                  </p>
                )}

                <span className="teal-badge" style={{ fontSize: "9px" }}>Student</span>

                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>🔥 {stats?.currentStreak ?? 0} streak</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>|</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>⭐ {stats?.totalInterviews ?? 0} interviews</span>
                </div>

                {saveError && (
                  <p style={{ fontSize: "12px", color: "#f87171", marginTop: "8px" }}>{saveError}</p>
                )}

                <button
                  onClick={() => {
                    if (editMode) handleSave();
                    else setEditMode(true);
                  }}
                  disabled={saving}
                  className="btn-teal"
                  style={{
                    width: "100%", marginTop: "16px", padding: "9px", fontSize: "13px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <Edit2 size={12} />
                  {saving ? "Saving…" : editMode ? "Save Changes" : "Edit Profile"}
                </button>

                {editMode && (
                  <button
                    onClick={() => { setEditMode(false); setSaveError(""); }}
                    style={{
                      width: "100%", marginTop: "8px", padding: "8px", fontSize: "12px",
                      background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="dash-card" style={{ padding: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Stats
                </p>
                {[
                  { icon: Target, label: "Avg Score",  value: stats?.avgScore ? `${stats.avgScore}%` : "—" },
                  { icon: Clock,  label: "Total Time",  value: stats?.hourspracticed ? `${stats.hourspracticed}h` : "—" },
                  { icon: TrendingUp, label: "Interviews", value: stats?.totalInterviews ?? "—" },
                  { icon: Flame,  label: "Best Streak", value: stats?.bestStreak ? `${stats.bestStreak}d` : "—" },
                ].map(({ icon: Icon, label, value }, index, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: index === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon size={13} style={{ color: "var(--teal-400)" }} />
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "white", fontFamily: "JetBrains Mono,monospace" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Resume card */}
              <div className="dash-card" style={{ padding: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Resume
                </p>
                {resume ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <CheckCircle2 size={14} style={{ color: "var(--teal-400)", flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: "white", fontWeight: 600, wordBreak: "break-all" }}>
                        {resume.filename}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px" }}>
                      Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => navigate("/resume")}
                      style={{
                        marginTop: "10px", width: "100%", padding: "7px", fontSize: "12px",
                        background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)",
                        borderRadius: "8px", color: "var(--teal-400)", cursor: "pointer",
                      }}
                    >
                      Update Resume
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <FileText size={24} style={{ color: "var(--text-dim)", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "10px" }}>
                      No resume uploaded yet
                    </p>
                    <button
                      onClick={() => navigate("/resume")}
                      className="btn-teal"
                      style={{ width: "100%", padding: "8px", fontSize: "12px" }}
                    >
                      Upload Resume
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              <div className="dash-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                  <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>About</h3>
                  {editMode ? <Shield size={14} style={{ color: "var(--teal-400)" }} /> : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PROFILE_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px" }}>{label}</p>
                      {editMode ? (
                        <input
                          value={form[key]}
                          onChange={(ev) => setForm((prev) => ({ ...prev, [key]: ev.target.value }))}
                          className="dark-input"
                          style={{ fontSize: "13px" }}
                        />
                      ) : (
                        <p style={{ fontSize: "13px", fontWeight: 600, color: form[key] ? "white" : "var(--text-dim)" }}>
                          {form[key] || "—"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "14px" }}>
                  <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px" }}>Bio</p>
                  {editMode ? (
                    <textarea
                      value={form.bio}
                      onChange={(ev) => setForm((prev) => ({ ...prev, bio: ev.target.value }))}
                      className="dark-textarea"
                      rows={2}
                    />
                  ) : (
                    <p style={{ fontSize: "13px", color: form.bio ? "var(--text-muted)" : "var(--text-dim)", lineHeight: 1.6 }}>
                      {form.bio || "No bio added yet."}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills from resume */}
              <div className="dash-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>
                    Skill Tags
                  </h3>
                  {resume && (
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>from resume</span>
                  )}
                </div>

                {allSkills.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                    {allSkills.map((skill) => (
                      <span key={skill} className={`skill-tag ${getSkillLevel(skill)}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--text-dim)" }}>
                    Upload your resume to auto-populate skill tags.
                  </p>
                )}
              </div>

              {/* Resume insights */}
              {resume && resume.technicalStrengths?.length > 0 && (
                <div className="dash-card">
                  <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "12px" }}>
                    Resume Insights
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {resume.technicalStrengths.map((strength, i) => (
                      <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <CheckCircle2 size={14} style={{ color: "var(--teal-400)", marginTop: "2px", flexShrink: 0 }} />
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{strength}</p>
                      </div>
                    ))}
                  </div>
                  {resume.projectTitles?.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Detected Projects
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {resume.projectTitles.map((title) => (
                          <span
                            key={title}
                            style={{
                              fontSize: "12px", padding: "4px 10px", borderRadius: "6px",
                              background: "rgba(255,255,255,0.05)", color: "var(--text-muted)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="dash-card">
                <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "14px" }}>
                  Achievements
                  <span style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "DM Sans,sans-serif", fontWeight: 400, marginLeft: "6px" }}>
                    {unlockedCount} of {ACHIEVEMENTS.length} unlocked
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ACHIEVEMENTS.map(({ icon, name, desc, unlocked }) => (
                    <div key={name} className={`achievement ${!unlocked ? "locked" : ""}`} title={desc}>
                      <div className="achievement-icon">{icon}</div>
                      <p className="achievement-name">{name}</p>
                      <p className="achievement-desc">{unlocked ? desc : "Locked"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default Profile;

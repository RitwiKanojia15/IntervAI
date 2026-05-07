/* eslint-disable */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Plus, LogIn, ArrowLeft, Loader2, Users } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import { useAuth } from "../../context/AuthContext";
import { createGDRoom, joinGDRoom } from "../../services/api";

const TOPICS = [
  "Should AI replace human jobs?",
  "Is remote work more productive than office work?",
  "Social media: boon or bane for society?",
  "Climate change — individual vs corporate responsibility",
  "Should college education be free?",
  "Is technology making us more isolated?",
  "Work-life balance in the modern era",
  "The role of leadership in team success",
];

const GDLobby = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab] = useState("create");

  const [title, setTitle]           = useState("");
  const [topic, setTopic]           = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [duration, setDuration]     = useState(600); // seconds

  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState(user?.name || "");

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const userId   = user?._id || user?.email || `user_${Date.now()}`;
  const hostName = user?.name || "Host";

  const handleCreate = async () => {
    const finalTopic = customTopic.trim() || topic;
    if (!title.trim()) { setError("Please enter a room title."); return; }
    if (!finalTopic)   { setError("Please select or enter a discussion topic."); return; }
    setLoading(true); setError("");
    try {
      const res = await createGDRoom({ hostId: userId, hostName, topic: finalTopic, durationSec: duration });
      const room = res.data.room;
      sessionStorage.setItem("gd-user", JSON.stringify({ userId, name: hostName, isHost: true }));
      navigate(`/gd/room/${room._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room.");
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError("Enter a join code."); return; }
    if (!joinName.trim()) { setError("Enter your name."); return; }
    setLoading(true); setError("");
    try {
      const res = await joinGDRoom({ joinCode: joinCode.trim().toUpperCase(), userId, name: joinName.trim() });
      const room = res.data.room;
      sessionStorage.setItem("gd-user", JSON.stringify({ userId, name: joinName.trim(), isHost: false }));
      navigate(`/gd/room/${room._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join room.");
    } finally { setLoading(false); }
  };

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 24px 60px" }}>
        <PageWrapper>
          <button onClick={() => navigate("/dashboard")}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", marginBottom: "24px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>

          <span className="teal-badge inline-flex mb-4" style={{ fontSize: "10px" }}>
            <Video size={10} /> GROUP DISCUSSION
          </span>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
            Group Discussion
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
            Real-time video + audio group discussions with AI-powered evaluation. Up to 6 participants.
          </p>

          {/* Tab switcher */}
          <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid var(--border-soft)", marginBottom: "24px" }}>
            {[{ key: "create", label: "Create Room", icon: Plus }, { key: "join", label: "Join Room", icon: LogIn }].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setTab(key); setError(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: "7px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: `1px solid ${tab === key ? "rgba(20,184,166,0.3)" : "transparent"}`, background: tab === key ? "rgba(20,184,166,0.14)" : "transparent", color: tab === key ? "var(--teal-400)" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", transition: "all 0.18s" }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {error && <div className="banner-error" style={{ marginBottom: "16px" }}><span>!</span> {error}</div>}

          {tab === "create" && (
            <div className="dash-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>Room Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Team Alpha GD Round"
                  className="dark-input" style={{ width: "100%" }} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>Discussion Topic</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "10px" }}>
                  {TOPICS.map((t) => (
                    <button key={t} onClick={() => { setTopic(t); setCustomTopic(""); }}
                      style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                        background: topic === t && !customTopic ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.04)",
                        borderColor: topic === t && !customTopic ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                        color: topic === t && !customTopic ? "var(--teal-400)" : "var(--text-muted)" }}>
                      {t}
                    </button>
                  ))}
                </div>
                <input value={customTopic} onChange={(e) => { setCustomTopic(e.target.value); setTopic(""); }}
                  placeholder="Or type a custom topic..." className="dark-input" style={{ width: "100%" }} />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
                  Duration: {duration / 60} minutes
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[{ s: 600, l: "10m" }, { s: 900, l: "15m" }, { s: 1200, l: "20m" }].map(({ s, l }) => (
                    <button key={s} onClick={() => setDuration(s)}
                      style={{ padding: "8px 20px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                        background: duration === s ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.04)",
                        borderColor: duration === s ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                        color: duration === s ? "var(--teal-400)" : "var(--text-muted)" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleCreate} disabled={loading} className="btn-teal"
                style={{ padding: "13px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Creating...</> : <><Plus size={15} /> Create Room</>}
              </button>
            </div>
          )}

          {tab === "join" && (
            <div className="dash-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>Join Code</label>
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code" className="dark-input"
                  style={{ width: "100%", fontFamily: "JetBrains Mono,monospace", fontSize: "18px", letterSpacing: "0.15em", textAlign: "center" }} maxLength={6} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>Your Name</label>
                <input value={joinName} onChange={(e) => setJoinName(e.target.value)}
                  placeholder="How you'll appear in the discussion" className="dark-input" style={{ width: "100%" }} />
              </div>
              <button onClick={handleJoin} disabled={loading} className="btn-teal"
                style={{ padding: "13px", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Joining...</> : <><LogIn size={15} /> Join Discussion</>}
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "24px" }}>
            {[
              { icon: "🎥", title: "Video + Audio", desc: "Real-time WebRTC video and audio for all participants" },
              { icon: "🤖", title: "AI Evaluation", desc: "Scored on participation, communication & relevance" },
              { icon: "🏆", title: "Results", desc: "Detailed performance report after discussion ends" },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)", textAlign: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "4px" }}>{title}</p>
                <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </PageWrapper>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default GDLobby;

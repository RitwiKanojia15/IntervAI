/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy, Users, MessageSquare, ArrowLeft, RotateCcw, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import { getGtgResults } from "../../services/api";

const ScoreBar = ({ label, value }) => (
  <div style={{ marginBottom: "10px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "JetBrains Mono,monospace", color: value >= 7 ? "#4ade80" : value >= 5 ? "#fbbf24" : "#f87171" }}>{value}/10</span>
    </div>
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value * 10}%`, background: value >= 7 ? "linear-gradient(90deg,#0f9185,#14b8a6)" : value >= 5 ? "linear-gradient(90deg,#d97706,#fbbf24)" : "linear-gradient(90deg,#dc2626,#f87171)" }} />
    </div>
  </div>
);

const GTGResults = () => {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const [room, setRoom]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [selected, setSelected] = useState(null); // selected participant for detail view

  const participantInfo = JSON.parse(sessionStorage.getItem("gtg-participant") || "{}");
  const { participantKey } = participantInfo;

  useEffect(() => {
    getGtgResults(roomId)
      .then((res) => {
        const r = res.data.room;
        setRoom(r);
        // Auto-select current user
        const me = r.participants.find((p) => p.participantKey === participantKey);
        setSelected(me || r.participants[0]);
      })
      .catch(() => setError("Results not available yet."))
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) return (
    <div className="app-bg min-h-screen flex items-center justify-center">
      <Loader2 size={32} style={{ color: "var(--teal-400)", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !room) return (
    <div className="app-bg min-h-screen flex items-center justify-center">
      <div className="dash-card" style={{ padding: "32px", textAlign: "center", maxWidth: "360px" }}>
        <p style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</p>
        <p style={{ fontSize: "15px", color: "white", marginBottom: "16px" }}>{error || "Results not found."}</p>
        <button className="btn-teal" onClick={() => navigate("/gtg")} style={{ padding: "10px 24px" }}>Back to Lobby</button>
      </div>
    </div>
  );

  const sorted = [...room.participants].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const totalMessages = room.messages?.length || 0;
  const duration = room.endedAt && room.startedAt
    ? Math.round((new Date(room.endedAt) - new Date(room.startedAt)) / 60000)
    : room.durationMinutes;

  const medalColor = (rank) => rank === 1 ? "#fbbf24" : rank === 2 ? "#9ca3af" : rank === 3 ? "#b45309" : "var(--text-dim)";
  const medalEmoji = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px 60px" }}>
        <PageWrapper>
          <button onClick={() => navigate("/gtg")}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", marginBottom: "20px" }}>
            <ArrowLeft size={14} /> Back to Lobby
          </button>

          <span className="teal-badge inline-flex mb-4" style={{ fontSize: "10px" }}>
            <Trophy size={10} /> DISCUSSION RESULTS
          </span>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "4px" }}>
            {room.title}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Topic: <strong style={{ color: "white" }}>{room.topic}</strong> · {duration} min · {totalMessages} messages · {room.participants.length} participants
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

            {/* Leaderboard */}
            <div className="dash-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Trophy size={16} style={{ color: "#fbbf24" }} />
                <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>Leaderboard</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sorted.map((p) => (
                  <button key={p.participantKey} onClick={() => setSelected(p)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: selected?.participantKey === p.participantKey ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${selected?.participantKey === p.participantKey ? "rgba(20,184,166,0.3)" : "var(--border-soft)"}`, cursor: "pointer", transition: "all 0.18s", textAlign: "left" }}>
                    <span style={{ fontSize: "20px", width: "28px", textAlign: "center", flexShrink: 0 }}>{medalEmoji(p.rank)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name} {p.participantKey === participantKey ? "(You)" : ""}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>{p.messageCount} messages · {p.totalWords} words</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "18px", fontWeight: 800, color: medalColor(p.rank), fontFamily: "Syne,sans-serif" }}>{p.scores?.overall ?? 0}</p>
                      <p style={{ fontSize: "10px", color: "var(--text-dim)" }}>/ 10</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected participant detail */}
            {selected && (
              <div className="dash-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "white", flexShrink: 0 }}>
                    {selected.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>{selected.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>Rank #{selected.rank} · {selected.isHost ? "Host" : "Participant"}</p>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "center" }}>
                    <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--teal-400)", fontFamily: "Syne,sans-serif" }}>{selected.scores?.overall ?? 0}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-dim)" }}>Overall</p>
                  </div>
                </div>

                <ScoreBar label="Participation"  value={selected.scores?.participation  ?? 0} />
                <ScoreBar label="Relevance"      value={selected.scores?.relevance      ?? 0} />
                <ScoreBar label="Communication"  value={selected.scores?.communication  ?? 0} />

                <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Feedback</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{selected.feedback || "No feedback available."}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "14px" }}>
                  {[
                    { label: "Messages", value: selected.messageCount },
                    { label: "Total Words", value: selected.totalWords },
                    { label: "Avg Words/Msg", value: selected.messageCount > 0 ? Math.round(selected.totalWords / selected.messageCount) : 0 },
                    { label: "Share of Chat", value: totalMessages > 0 ? `${Math.round((selected.messageCount / totalMessages) * 100)}%` : "0%" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
                      <p style={{ fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</p>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: "white", fontFamily: "JetBrains Mono,monospace" }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message transcript */}
          <div className="dash-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <MessageSquare size={16} style={{ color: "var(--teal-400)" }} />
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>
                Discussion Transcript ({totalMessages} messages)
              </h3>
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {room.messages?.map((msg, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "JetBrains Mono,monospace", flexShrink: 0, marginTop: "2px" }}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--teal-400)", flexShrink: 0, minWidth: "80px" }}>{msg.name}</span>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{msg.text}</span>
                </div>
              ))}
              {totalMessages === 0 && <p style={{ fontSize: "13px", color: "var(--text-dim)" }}>No messages were sent during this discussion.</p>}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button className="btn-outline" onClick={() => navigate("/gtg")}
              style={{ flex: 1, padding: "12px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              <ArrowLeft size={14} /> Back to Lobby
            </button>
            <button className="btn-teal" onClick={() => navigate("/gtg")}
              style={{ flex: 1, padding: "12px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              <RotateCcw size={14} /> New Discussion
            </button>
          </div>
        </PageWrapper>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default GTGResults;

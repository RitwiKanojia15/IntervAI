import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Send, Users, Clock, Play, Square, ArrowLeft, Loader2, Mic2, Shield } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import { getGtgRoom, startGtg, endGtg } from "../../services/api";

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5001";

const GTGRoom = () => {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const [room, setRoom]                 = useState(null);
  const [messages, setMessages]         = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [timeLeft, setTimeLeft]         = useState(null);
  const [typingUsers, setTypingUsers]   = useState([]);
  const [status, setStatus]             = useState("waiting");

  const socketRef  = useRef(null);
  const chatEndRef = useRef(null);
  const timerRef   = useRef(null);
  const typingRef  = useRef(null);
  const bellRef    = useRef(null); // AudioContext for bell sound
  const [bellRinging, setBellRinging] = useState(false);

  const participantInfo = JSON.parse(sessionStorage.getItem("gtg-participant") || "{}");
  const { participantKey, name, isHost } = participantInfo;

  useEffect(() => {
    if (!participantKey) { navigate("/gtg"); return; }
    getGtgRoom(roomId)
      .then((res) => {
        const r = res.data.room;
        setRoom(r);
        setMessages(r.messages || []);
        // Participants list excludes host
        setParticipants(r.participants || []);
        setStatus(r.status);
        if (r.status === "active" && r.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(r.startedAt).getTime()) / 1000);
          setTimeLeft(Math.max(0, r.durationMinutes * 60 - elapsed));
        }
        if (r.status === "completed") navigate(`/gtg/results/${roomId}`);
      })
      .catch(() => setError("Room not found."))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (!participantKey || !roomId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("gtg:join", { roomId, participantKey, name }));

    socket.on("gtg:participant-joined", ({ participantKey: pk, name: n }) => {
      setParticipants((prev) => prev.find((p) => p.participantKey === pk) ? prev : [...prev, { participantKey: pk, name: n, online: true }]);
    });
    socket.on("gtg:participant-left",    ({ participantKey: pk }) => setParticipants((prev) => prev.filter((p) => p.participantKey !== pk)));
    socket.on("gtg:participant-offline", ({ participantKey: pk }) => setParticipants((prev) => prev.map((p) => p.participantKey === pk ? { ...p, online: false } : p)));

    socket.on("gtg:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTypingUsers((prev) => prev.filter((u) => u !== msg.participantKey));
    });

    socket.on("gtg:typing", ({ participantKey: pk }) => {
      if (pk === participantKey) return;
      setTypingUsers((prev) => prev.includes(pk) ? prev : [...prev, pk]);
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => setTypingUsers((prev) => prev.filter((u) => u !== pk)), 2000);
    });

    socket.on("gtg:started", ({ durationMinutes }) => { setStatus("active"); setTimeLeft(durationMinutes * 60); });
    socket.on("gtg:ended",   () => { setStatus("completed"); clearInterval(timerRef.current); setTimeout(() => navigate(`/gtg/results/${roomId}`), 1500); });

    // 2-minute warning bell from server
    socket.on("gtg:bell", () => { playBell(); });

    return () => { socket.emit("gtg:leave", { roomId, participantKey }); socket.disconnect(); clearInterval(timerRef.current); };
  }, [roomId, participantKey]);

  useEffect(() => {
    if (timeLeft === null || status !== "active") return;
    if (timeLeft <= 0) { setStatus("completed"); return; }
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, status]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fmtTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Bell sound using Web Audio API ────────────────────────────────────────
  const playBell = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ringOnce = (startTime) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, startTime);          // A5 — bell-like
        osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.8);
        gain.gain.setValueAtTime(0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
        osc.start(startTime);
        osc.stop(startTime + 1.2);
      };
      // Ring 3 times, 1.4s apart → ~4.2s total
      ringOnce(ctx.currentTime);
      ringOnce(ctx.currentTime + 1.4);
      ringOnce(ctx.currentTime + 2.8);
      setBellRinging(true);
      setTimeout(() => setBellRinging(false), 4500);
    } catch { /* AudioContext not available */ }
  };

  const sendMessage = () => {
    if (!input.trim() || status !== "active" || isHost) return;
    socketRef.current?.emit("gtg:message", { roomId, participantKey, name, text: input.trim() });
    setInput("");
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!isHost) socketRef.current?.emit("gtg:typing", { roomId, participantKey, name });
  };

  const handleStart = async () => {
    try {
      await startGtg({ roomId, hostKey: participantKey });
      socketRef.current?.emit("gtg:started", { roomId, durationMinutes: room.durationMinutes });
      setStatus("active");
      setTimeLeft(room.durationMinutes * 60);
    } catch (err) { setError(err.response?.data?.message || "Failed to start."); }
  };

  const handleEnd = async () => {
    try {
      await endGtg({ roomId, hostKey: participantKey });
      socketRef.current?.emit("gtg:ended", { roomId });
      navigate(`/gtg/results/${roomId}`);
    } catch (err) { setError(err.response?.data?.message || "Failed to end."); }
  };

  if (loading) return (
    <div className="app-bg min-h-screen flex items-center justify-center">
      <Loader2 size={32} style={{ color: "var(--teal-400)", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes bellPulse{from{box-shadow:0 0 0 0 rgba(251,191,36,0.4)}to{box-shadow:0 0 0 8px rgba(251,191,36,0)}}`}</style>
    </div>
  );

  if (error) return (
    <div className="app-bg min-h-screen flex items-center justify-center">
      <div className="dash-card" style={{ padding: "32px", textAlign: "center", maxWidth: "360px" }}>
        <p style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</p>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "8px" }}>{error}</p>
        <button className="btn-teal" onClick={() => navigate("/gtg")} style={{ marginTop: "16px", padding: "10px 24px" }}>Back to Lobby</button>
      </div>
    </div>
  );

  // ── Shared header ──────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => navigate("/gtg")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
            <span className="teal-badge" style={{ fontSize: "9px" }}><Users size={9} /> GTG</span>
            {isHost && <span style={{ padding: "3px 8px", borderRadius: "999px", fontSize: "9px", fontWeight: 700, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "var(--amber-400)" }}>
              <Shield size={9} style={{ display: "inline", marginRight: "3px" }} />MODERATOR
            </span>}
          </div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "20px", fontWeight: 800, color: "white" }}>{room?.title}</h1>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ padding: "6px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-soft)" }}>
          <span style={{ fontSize: "10px", color: "var(--text-dim)", display: "block" }}>JOIN CODE</span>
          <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "16px", fontWeight: 800, color: "var(--teal-400)", letterSpacing: "0.15em" }}>{room?.joinCode}</span>
        </div>

        {status === "active" && timeLeft !== null && (
          <div style={{ padding: "6px 14px", borderRadius: "8px", background: timeLeft < 60 ? "rgba(248,113,113,0.12)" : "rgba(20,184,166,0.1)", border: `1px solid ${timeLeft < 60 ? "rgba(248,113,113,0.3)" : "rgba(20,184,166,0.3)"}`, display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={14} style={{ color: timeLeft < 60 ? "#f87171" : "var(--teal-400)" }} />
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "16px", fontWeight: 700, color: timeLeft < 60 ? "#f87171" : "var(--teal-400)" }}>{fmtTime(timeLeft)}</span>
          </div>
        )}
          <button onClick={handleStart} className="btn-teal" style={{ padding: "8px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
            <Play size={14} /> Start Discussion
          </button>
        )}
        {isHost && status === "active" && (
          <button onClick={handleEnd} style={{ padding: "8px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "11px", color: "var(--danger-400)", cursor: "pointer", fontWeight: 600 }}>
            <Square size={14} /> End Discussion
          </button>
        )}
      </div>
    </div>
  );

  // ── Participants sidebar (shared) ──────────────────────────────────────────
  const ParticipantsSidebar = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="dash-card" style={{ padding: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          Participants ({participants.length})
        </p>
        {participants.length === 0 && (
          <p style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "12px 0" }}>
            No participants yet. Share the join code.
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {participants.map((p) => (
            <div key={p.participantKey} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                {p.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name} {p.participantKey === participantKey ? "(You)" : ""}
                </p>
                <p style={{ fontSize: "10px", color: "var(--text-dim)" }}>Participant</p>
              </div>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.online !== false ? "#22c55e" : "#6b7280", flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {status === "active" && messages.length > 0 && (
        <div className="dash-card" style={{ padding: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Live Stats</p>
          {participants.map((p) => {
            const myMsgs = messages.filter((m) => m.participantKey === p.participantKey).length;
            const pct = messages.length > 0 ? Math.round((myMsgs / messages.length) * 100) : 0;
            return (
              <div key={p.participantKey} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.name}</span>
                  <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono,monospace", color: "var(--teal-400)" }}>{myMsgs} msgs</span>
                </div>
                <div className="progress-track" style={{ height: "4px" }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── HOST VIEW — moderator panel, no chat ───────────────────────────────────
  if (isHost) {
    return (
      <div className="app-bg min-h-screen">
        <Navbar />
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 24px 40px" }}>
          <PageWrapper>
            <Header />
            {error && <div className="banner-error" style={{ marginBottom: "16px" }}><span>!</span> {error}</div>}
            {bellRinging && (
              <div style={{ marginBottom: "16px", padding: "12px 18px", borderRadius: "10px", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", display: "flex", alignItems: "center", gap: "10px", animation: "bellPulse 0.5s ease-in-out infinite alternate" }}>
                <span style={{ fontSize: "22px" }}>🔔</span>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--amber-400)" }}>2 minutes remaining — please start wrapping up your conclusion!</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
              {/* Left: moderator panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Topic */}
                <div className="dash-card" style={{ padding: "24px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    <Mic2 size={11} style={{ display: "inline", marginRight: "4px" }} /> Discussion Topic
                  </p>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "white", lineHeight: 1.4 }}>{room?.topic}</p>
                </div>

                {/* Moderator info card */}
                <div className="dash-card" style={{ padding: "24px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <Shield size={20} style={{ color: "var(--amber-400)" }} />
                    <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>Moderator Panel</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "16px" }}>
                    As the moderator, you <strong style={{ color: "white" }}>observe and manage</strong> the discussion. You cannot send messages — only participants can chat and be evaluated.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    {[
                      { label: "Participants", value: participants.length },
                      { label: "Messages", value: messages.length },
                      { label: "Duration", value: `${room?.durationMinutes}m` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-soft)", textAlign: "center" }}>
                        <p style={{ fontSize: "20px", fontWeight: 800, color: "white", fontFamily: "Syne,sans-serif" }}>{value}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live chat read-only for host */}
                {status === "active" && (
                  <div className="dash-card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "340px" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Live Chat (read-only)</p>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{messages.length} messages</span>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {messages.length === 0 && <p style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "20px 0" }}>No messages yet.</p>}
                      {messages.map((msg, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)", flexShrink: 0, minWidth: "70px" }}>{msg.name}</span>
                          <span style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{msg.text}</span>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-soft)", background: "rgba(255,255,255,0.02)" }}>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", textAlign: "center" }}>
                        🔒 Moderators cannot send messages
                      </p>
                    </div>
                  </div>
                )}

                {status === "waiting" && (
                  <div className="dash-card" style={{ padding: "20px", textAlign: "center", border: "1px dashed var(--border-soft)" }}>
                    <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "8px" }}>
                      {participants.length === 0
                        ? "Share the join code with participants. Start when everyone has joined."
                        : `${participants.length} participant${participants.length > 1 ? "s" : ""} ready. Click "Start Discussion" when ready.`}
                    </p>
                  </div>
                )}

                {status === "completed" && (
                  <div className="dash-card" style={{ padding: "20px", textAlign: "center", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
                    <p style={{ fontSize: "14px", color: "#4ade80", fontWeight: 600 }}>Discussion ended. Redirecting to results...</p>
                  </div>
                )}
              </div>

              {/* Right: participants */}
              <ParticipantsSidebar />
            </div>
          </PageWrapper>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes bellPulse{from{box-shadow:0 0 0 0 rgba(251,191,36,0.4)}to{box-shadow:0 0 0 8px rgba(251,191,36,0)}}`}</style>
      </div>
    );
  }

  // ── PARTICIPANT VIEW — full chat ───────────────────────────────────────────
  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 24px 40px" }}>
        <PageWrapper>
          <Header />
          {error && <div className="banner-error" style={{ marginBottom: "16px" }}><span>!</span> {error}</div>}
          {bellRinging && (
            <div style={{ marginBottom: "16px", padding: "12px 18px", borderRadius: "10px", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", display: "flex", alignItems: "center", gap: "10px", animation: "bellPulse 0.5s ease-in-out infinite alternate" }}>
              <span style={{ fontSize: "22px" }}>🔔</span>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--amber-400)" }}>2 minutes remaining — please start wrapping up your conclusion!</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px", height: "calc(100vh - 220px)", minHeight: "500px" }}>
            {/* Left: topic + chat */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden" }}>
              <div className="dash-card" style={{ padding: "16px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", flexShrink: 0 }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  <Mic2 size={11} style={{ display: "inline", marginRight: "4px" }} /> Discussion Topic
                </p>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "white", lineHeight: 1.4 }}>{room?.topic}</p>
                {status === "waiting" && <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "8px" }}>Waiting for the host to start the discussion...</p>}
                {status === "completed" && <p style={{ fontSize: "12px", color: "#4ade80", marginTop: "8px" }}>Discussion ended. Redirecting to results...</p>}
              </div>

              <div className="dash-card" style={{ flex: 1, padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Discussion Chat</p>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{messages.length} messages</span>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {status === "waiting" && messages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)", fontSize: "13px" }}>
                      Chat will be available once the host starts the discussion.
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = msg.participantKey === participantKey;
                    return (
                      <div key={msg._id || i} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: isMine ? "var(--teal-400)" : "var(--text-muted)" }}>{msg.name}</span>
                          <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMine ? "rgba(20,184,166,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid ${isMine ? "rgba(20,184,166,0.3)" : "var(--border-soft)"}`, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  {typingUsers.length > 0 && (
                    <div style={{ fontSize: "12px", color: "var(--text-dim)", fontStyle: "italic" }}>
                      {typingUsers.length === 1 ? "Someone is typing..." : `${typingUsers.length} people are typing...`}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-soft)", display: "flex", gap: "8px" }}>
                  <input value={input} onChange={handleTyping}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={status === "active" ? "Type your message... (Enter to send)" : "Waiting for host to start..."}
                    disabled={status !== "active"}
                    style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-soft)", color: "var(--text-primary)", fontSize: "13px", outline: "none", opacity: status !== "active" ? 0.5 : 1 }}
                  />
                  <button onClick={sendMessage} disabled={!input.trim() || status !== "active"} className="btn-teal"
                    style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px", opacity: !input.trim() || status !== "active" ? 0.5 : 1 }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: participants */}
            <ParticipantsSidebar />
          </div>
        </PageWrapper>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes bellPulse{from{box-shadow:0 0 0 0 rgba(251,191,36,0.4)}to{box-shadow:0 0 0 8px rgba(251,191,36,0)}}`}</style>
    </div>
  );
};

export default GTGRoom;


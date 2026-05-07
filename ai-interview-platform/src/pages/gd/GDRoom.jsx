/* eslint-disable */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Send, Users, Clock, Play, Square, ArrowLeft,
  Loader2, Shield, Bell, MessageSquare,
  Mic, MicOff, Video, VideoOff, PhoneOff
} from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import { getGDRoom, startGD, endGD } from "../../services/api";

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5001";
const SPAM_MS = 3000;
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const fmtTime = (s) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

// ── VideoTile ─────────────────────────────────────────────────────────────────
const VideoTile = ({ stream, name, isMuted, isCameraOff, isSelf, isSpeaking }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{
      position: "relative", borderRadius: "12px", overflow: "hidden",
      background: "var(--bg-card)",
      border: `2px solid ${isSpeaking ? "var(--teal-400)" : "var(--border-soft)"}`,
      aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: isSpeaking ? "0 0 0 3px rgba(20,184,166,0.35)" : "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}>
      <video ref={videoRef} autoPlay playsInline muted={isSelf}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: isCameraOff ? "none" : "block" }} />
      {isCameraOff && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "white" }}>
            {initials}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{name}</p>
        </div>
      )}
      <div style={{ position: "absolute", bottom: "8px", left: "8px", padding: "3px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "white" }}>{name}{isSelf ? " (You)" : ""}</span>
      </div>
      <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px" }}>
        {isMuted && <div style={{ width: "22px", height: "22px", borderRadius: "5px", background: "rgba(248,113,113,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}><MicOff size={11} color="white" /></div>}
        {isCameraOff && <div style={{ width: "22px", height: "22px", borderRadius: "5px", background: "rgba(248,113,113,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}><VideoOff size={11} color="white" /></div>}
      </div>
      {isSpeaking && <div style={{ position: "absolute", top: "8px", left: "8px", width: "10px", height: "10px", borderRadius: "50%", background: "var(--teal-400)", animation: "speakPulse 0.8s ease-in-out infinite" }} />}
    </div>
  );
};

// ── VideoGrid ─────────────────────────────────────────────────────────────────
const VideoGrid = ({ localStream, remoteStreams, participants, selfId, selfName, mediaStates, speakingUsers }) => {
  const tiles = [
    { userId: selfId, stream: localStream, name: selfName || "You", isSelf: true },
    ...Object.entries(remoteStreams).map(([uid, stream]) => {
      const p = participants.find((x) => x.userId === uid);
      return { userId: uid, stream, name: p?.name || "Participant", isSelf: false };
    }),
  ];
  const count = tiles.length;
  const cols = count <= 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 2 : 3;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "10px", width: "100%" }}>
      {tiles.map(({ userId, stream, name, isSelf }) => {
        const st = mediaStates[userId] || {};
        return (
          <VideoTile key={userId} stream={stream} name={name} isSelf={isSelf}
            isMuted={st.micOn === false} isCameraOff={st.cameraOn === false}
            isSpeaking={speakingUsers?.has(userId)} />
        );
      })}
    </div>
  );
};

// ── GDRoom ────────────────────────────────────────────────────────────────────
const GDRoom = () => {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const gdUser = JSON.parse(sessionStorage.getItem("gd-user") || "{}");
  const { userId, name, isHost } = gdUser;

  // ── Room / chat state ──────────────────────────────────────────────────────
  const [room, setRoom]               = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [status, setStatus]           = useState("waiting");
  const [timeLeft, setTimeLeft]       = useState(null);
  const [bellRinging, setBellRinging] = useState(false);
  const [spamWarn, setSpamWarn]       = useState("");

  // ── WebRTC / media state ───────────────────────────────────────────────────
  const [localStream, setLocalStream]   = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});   // uid → MediaStream
  const [micOn, setMicOn]               = useState(true);
  const [cameraOn, setCameraOn]         = useState(true);
  const [mediaStates, setMediaStates]   = useState({});    // uid → {micOn, cameraOn}
  const [speakingUsers, setSpeakingUsers] = useState(new Set());
  const [mediaError, setMediaError]     = useState("");
  const [showVideo, setShowVideo]       = useState(true);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const socketRef    = useRef(null);
  const timerRef     = useRef(null);
  const chatEndRef   = useRef(null);
  const lastSentRef  = useRef(0);
  const localStreamRef = useRef(null);
  const peersRef     = useRef({});   // uid → RTCPeerConnection
  const analyserRefs = useRef({});   // uid → AnalyserNode (speaking detection)
  const speakTimers  = useRef({});

  // ── Bell ───────────────────────────────────────────────────────────────────
  const playBell = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ring = (t) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.8);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.start(t); osc.stop(t + 1.2);
      };
      ring(ctx.currentTime); ring(ctx.currentTime + 1.4); ring(ctx.currentTime + 2.8);
      setBellRinging(true);
      setTimeout(() => setBellRinging(false), 4500);
    } catch { /* ignore */ }
  }, []);

  // ── Get local media ────────────────────────────────────────────────────────
  const getLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCameraOn(false);
        setMediaError("Camera not available — audio only.");
        return stream;
      } catch {
        setMediaError("Could not access mic/camera. Check browser permissions.");
        return null;
      }
    }
  }, []);

  // ── Speaking detection via Web Audio API ──────────────────────────────────
  const startSpeakingDetection = useCallback((uid, stream) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRefs.current[uid] = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const check = () => {
        if (!analyserRefs.current[uid]) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setSpeakingUsers((prev) => {
          const next = new Set(prev);
          if (avg > 20) { next.add(uid); clearTimeout(speakTimers.current[uid]); speakTimers.current[uid] = setTimeout(() => setSpeakingUsers((p) => { const n = new Set(p); n.delete(uid); return n; }), 800); }
          return next;
        });
        requestAnimationFrame(check);
      };
      check();
    } catch { /* ignore */ }
  }, []);

  // ── Create RTCPeerConnection ───────────────────────────────────────────────
  const createPeer = useCallback((targetUid, isInitiator) => {
    if (peersRef.current[targetUid]) return peersRef.current[targetUid];
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[targetUid] = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    }

    // Remote stream
    const remoteStream = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
      setRemoteStreams((prev) => ({ ...prev, [targetUid]: remoteStream }));
      startSpeakingDetection(targetUid, remoteStream);
    };

    // ICE
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("gd:ice-candidate", { roomId, from: userId, to: targetUid, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        closePeer(targetUid);
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => socketRef.current?.emit("gd:offer", { roomId, from: userId, to: targetUid, offer: pc.localDescription }))
        .catch(console.error);
    }
    return pc;
  }, [roomId, userId, startSpeakingDetection]);

  const closePeer = useCallback((uid) => {
    peersRef.current[uid]?.close();
    delete peersRef.current[uid];
    delete analyserRefs.current[uid];
    setRemoteStreams((prev) => { const n = { ...prev }; delete n[uid]; return n; });
    setSpeakingUsers((prev) => { const n = new Set(prev); n.delete(uid); return n; });
  }, []);

  // ── Load room ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { navigate("/gd"); return; }
    getLocalMedia();
    getGDRoom(roomId)
      .then((res) => {
        const r = res.data.room;
        setRoom(r); setParticipants(r.participants || []); setStatus(r.status);
        if (r.status === "ended") { navigate(`/gd/results/${roomId}`); return; }
        if (r.status === "live" && r.endTime) {
          setTimeLeft(Math.max(0, Math.floor((new Date(r.endTime) - Date.now()) / 1000)));
        }
      })
      .catch(() => setError("Room not found."))
      .finally(() => setLoading(false));

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(peersRef.current).forEach((pc) => pc.close());
      clearInterval(timerRef.current);
    };
  }, [roomId]);

  // ── Socket.io ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !roomId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("gd:join", { roomId, userId, name }));

    socket.on("gd:user-joined", ({ userId: uid, name: n }) => {
      setParticipants((prev) => prev.find((p) => p.userId === uid) ? prev : [...prev, { userId: uid, name: n, online: true }]);
      // If live, initiate offer to new peer
      if (status === "live") createPeer(uid, true);
    });

    socket.on("gd:user-left", ({ userId: uid }) => {
      closePeer(uid);
      setParticipants((prev) => prev.filter((p) => p.userId !== uid));
    });

    socket.on("gd:started", ({ durationSec, endTime }) => {
      setStatus("live");
      setTimeLeft(Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000)));
      // Create offers to all current participants
      setParticipants((prev) => {
        prev.forEach((p) => { if (p.userId !== userId) createPeer(p.userId, true); });
        return prev;
      });
    });

    // WebRTC signaling
    socket.on("gd:offer", async ({ from, offer }) => {
      if (from === userId) return;
      const pc = createPeer(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("gd:answer", { roomId, from: userId, to: from, answer: pc.localDescription });
    });

    socket.on("gd:answer", async ({ from, answer }) => {
      if (from === userId) return;
      const pc = peersRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {});
    });

    socket.on("gd:ice-candidate", async ({ from, candidate }) => {
      if (from === userId) return;
      const pc = peersRef.current[from];
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    socket.on("gd:media-state", ({ userId: uid, micOn: m, cameraOn: c }) => {
      setMediaStates((prev) => ({ ...prev, [uid]: { micOn: m, cameraOn: c } }));
    });

    // Host forced this participant's media on/off
    socket.on("gd:force-media", ({ targetUserId, micOn: m, cameraOn: c }) => {
      if (targetUserId !== userId) return; // only apply to self
      if (localStreamRef.current) {
        if (m !== undefined) localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = m; });
        if (c !== undefined) localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = c; });
      }
      if (m !== undefined) setMicOn(m);
      if (c !== undefined) setCameraOn(c);
      // Broadcast updated state to room
      const newMic = m !== undefined ? m : micOn;
      const newCam = c !== undefined ? c : cameraOn;
      socket.emit("gd:media-state", { roomId, userId, micOn: newMic, cameraOn: newCam });
    });

    socket.on("gd:chat", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("gd:bell", () => playBell());
    socket.on("gd:ended", () => {
      setStatus("ended"); clearInterval(timerRef.current);
      setTimeout(() => navigate(`/gd/results/${roomId}`), 1500);
    });
    socket.on("gd:error", ({ message: msg }) => setError(msg));

    return () => { socket.emit("gd:leave", { roomId, userId }); socket.disconnect(); };
  }, [roomId, userId]);

  // ── Countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || status !== "live") return;
    if (timeLeft <= 0) { setStatus("ended"); return; }
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, status]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const next = !micOn;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = next; });
    setMicOn(next);
    socketRef.current?.emit("gd:media-state", { roomId, userId, micOn: next, cameraOn });
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const next = !cameraOn;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = next; });
    setCameraOn(next);
    socketRef.current?.emit("gd:media-state", { roomId, userId, micOn, cameraOn: next });
  };

  const handleLeave = () => {
    socketRef.current?.emit("gd:leave", { roomId, userId });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(peersRef.current).forEach((pc) => pc.close());
    navigate("/gd");
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || status !== "live") return;
    if (text.length < 10) { setSpamWarn("Message must be at least 10 characters."); return; }
    const now = Date.now();
    if (now - lastSentRef.current < SPAM_MS) { setSpamWarn("Please wait before sending another message."); return; }
    setSpamWarn("");
    socketRef.current?.emit("gd:chat", { roomId, userId, name, message: text });
    setInput(""); lastSentRef.current = now;
  };

  const handleStart = async () => {
    try {
      const res = await startGD(roomId, { hostId: userId });
      const r = res.data.room;
      socketRef.current?.emit("gd:started", { roomId, durationSec: r.durationSec, endTime: r.endTime });
      setStatus("live");
      setTimeLeft(Math.max(0, Math.floor((new Date(r.endTime) - Date.now()) / 1000)));
      participants.forEach((p) => { if (p.userId !== userId) createPeer(p.userId, true); });
    } catch (err) { setError(err.response?.data?.message || "Failed to start."); }
  };

  const handleEnd = async () => {
    try {
      await endGD(roomId, { hostId: userId });
      socketRef.current?.emit("gd:ended", { roomId });
      navigate(`/gd/results/${roomId}`);
    } catch (err) { setError(err.response?.data?.message || "Failed to end."); }
  };

  // Host forces a participant's mic or camera on/off
  const forceMedia = (targetUserId, micOn, cameraOn) => {
    socketRef.current?.emit("gd:force-media", { roomId, targetUserId, micOn, cameraOn });
    // Optimistically update local mediaStates so host UI reflects change immediately
    setMediaStates((prev) => ({
      ...prev,
      [targetUserId]: {
        micOn:    micOn    !== undefined ? micOn    : prev[targetUserId]?.micOn,
        cameraOn: cameraOn !== undefined ? cameraOn : prev[targetUserId]?.cameraOn,
      },
    }));
  };

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="app-bg min-h-screen flex items-center justify-center">
      <Loader2 size={32} style={{ color: "var(--teal-400)", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error && !room) return (
    <div className="app-bg min-h-screen flex items-center justify-center">
      <div className="dash-card" style={{ padding: "32px", textAlign: "center", maxWidth: "360px" }}>
        <p style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</p>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "16px" }}>{error}</p>
        <button className="btn-teal" onClick={() => navigate("/gd")} style={{ padding: "10px 24px" }}>Back to Lobby</button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-bg min-h-screen" style={{ display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* ── Header ── */}
      <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={handleLeave} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span className="teal-badge" style={{ fontSize: "9px" }}><Users size={9} /> GROUP DISCUSSION</span>
              {isHost && <span style={{ padding: "3px 8px", borderRadius: "999px", fontSize: "9px", fontWeight: 700, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "var(--amber-400)" }}><Shield size={9} style={{ display: "inline", marginRight: "3px" }} />MODERATOR</span>}
            </div>
            <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 800, color: "white" }}>{room?.topic}</h1>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ padding: "5px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-soft)" }}>
            <span style={{ fontSize: "10px", color: "var(--text-dim)", display: "block" }}>JOIN CODE</span>
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "14px", fontWeight: 800, color: "var(--teal-400)", letterSpacing: "0.15em" }}>{room?.joinCode}</span>
          </div>
          {status === "live" && timeLeft !== null && (
            <div style={{ padding: "5px 12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", background: timeLeft < 120 ? "rgba(248,113,113,0.12)" : "rgba(20,184,166,0.1)", border: `1px solid ${timeLeft < 120 ? "rgba(248,113,113,0.3)" : "rgba(20,184,166,0.3)"}` }}>
              <Clock size={13} style={{ color: timeLeft < 120 ? "#f87171" : "var(--teal-400)" }} />
              <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "15px", fontWeight: 700, color: timeLeft < 120 ? "#f87171" : "var(--teal-400)" }}>{fmtTime(timeLeft)}</span>
            </div>
          )}
          <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: status === "live" ? "rgba(74,222,128,0.12)" : status === "ended" ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.06)", color: status === "live" ? "#4ade80" : status === "ended" ? "#f87171" : "var(--text-muted)", border: `1px solid ${status === "live" ? "rgba(74,222,128,0.3)" : status === "ended" ? "rgba(248,113,113,0.3)" : "var(--border-soft)"}` }}>
            {status === "live" ? "● LIVE" : status === "ended" ? "ENDED" : "WAITING"}
          </span>
          {/* Toggle video panel */}
          <button onClick={() => setShowVideo((v) => !v)}
            style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid var(--border-soft)", background: showVideo ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.05)", color: showVideo ? "var(--teal-400)" : "var(--text-muted)" }}>
            {showVideo ? "Hide Video" : "Show Video"}
          </button>
        </div>
      </div>

      {/* ── Bell banner ── */}
      {bellRinging && (
        <div style={{ padding: "10px 24px", background: "rgba(251,191,36,0.12)", borderBottom: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <Bell size={16} style={{ color: "var(--amber-400)" }} />
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--amber-400)" }}>🔔 2 minutes remaining — please start wrapping up your conclusion!</p>
        </div>
      )}

      {/* ── Media error ── */}
      {mediaError && (
        <div style={{ padding: "8px 24px", background: "rgba(251,191,36,0.08)", borderBottom: "1px solid rgba(251,191,36,0.2)", flexShrink: 0 }}>
          <p style={{ fontSize: "12px", color: "var(--amber-400)" }}>⚠ {mediaError}</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="banner-error" style={{ margin: "8px 24px", flexShrink: 0 }}>
          <span>!</span> {error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* ── Main body ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", overflow: "hidden" }}>

          {/* ── Left: video + chat ── */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--border-soft)" }}>

            {/* Video grid — shown when live and showVideo */}
            {showVideo && (
              <div style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
                {status === "waiting" ? (
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    {/* Local preview in waiting room */}
                    <div style={{ width: "220px", flexShrink: 0 }}>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Preview</p>
                      <VideoTile stream={localStream} name={name} isSelf isMuted={!micOn} isCameraOff={!cameraOn} />
                    </div>
                    <div style={{ flex: 1, padding: "12px 16px", borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "6px" }}>
                        {isHost ? "Waiting Room — You are the Host" : "Waiting Room"}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                        {isHost
                          ? `${participants.length} participant(s) ready. Click "Start Discussion" when everyone has joined.`
                          : "Waiting for the host to start. Your camera and mic are ready."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <VideoGrid
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                    participants={participants}
                    selfId={userId}
                    selfName={name}
                    mediaStates={mediaStates}
                    speakingUsers={speakingUsers}
                  />
                )}
              </div>
            )}

            {/* Topic bar */}
            <div style={{ padding: "10px 16px", background: "rgba(20,184,166,0.06)", borderBottom: "1px solid rgba(20,184,166,0.15)", flexShrink: 0 }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--teal-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Topic: </span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>{room?.topic}</span>
              {status === "ended" && <span style={{ fontSize: "12px", color: "#4ade80", marginLeft: "12px" }}>Discussion ended. Redirecting...</span>}
            </div>

            {/* Chat messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {status === "waiting" && messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--text-dim)", fontSize: "13px" }}>
                  Chat will be available once the host starts the discussion.
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.userId === userId;
                return (
                  <div key={msg._id || i} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: isMine ? "var(--teal-400)" : "var(--text-muted)" }}>{msg.name}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div style={{ maxWidth: "75%", padding: "9px 13px", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMine ? "rgba(20,184,166,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid ${isMine ? "rgba(20,184,166,0.3)" : "var(--border-soft)"}`, fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            {spamWarn && <p style={{ fontSize: "11px", color: "#f87171", padding: "4px 16px" }}>{spamWarn}</p>}
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-soft)", display: "flex", gap: "8px", flexShrink: 0 }}>
              <input value={input} onChange={(e) => { setInput(e.target.value); setSpamWarn(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={status === "live" ? "Type your message... (min 10 chars)" : "Waiting for discussion to start..."}
                disabled={status !== "live"}
                style={{ flex: 1, padding: "9px 13px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-soft)", color: "var(--text-primary)", fontSize: "13px", outline: "none", opacity: status !== "live" ? 0.5 : 1 }} />
              <button onClick={sendMessage} disabled={!input.trim() || status !== "live"} className="btn-teal"
                style={{ padding: "9px 14px", display: "flex", alignItems: "center", opacity: !input.trim() || status !== "live" ? 0.5 : 1 }}>
                <Send size={14} />
              </button>
            </div>

            {/* Controls bar */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-soft)", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexShrink: 0 }}>
              <button onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}
                style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: micOn ? "rgba(255,255,255,0.1)" : "rgba(248,113,113,0.2)", color: micOn ? "white" : "#f87171" }}>
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button onClick={toggleCamera} title={cameraOn ? "Turn off camera" : "Turn on camera"}
                style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: cameraOn ? "rgba(255,255,255,0.1)" : "rgba(248,113,113,0.2)", color: cameraOn ? "white" : "#f87171" }}>
                {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
              {isHost && status === "waiting" && (
                <button onClick={handleStart} className="btn-teal" style={{ padding: "9px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                  <Play size={14} /> Start Discussion
                </button>
              )}
              {isHost && status === "live" && (
                <button onClick={handleEnd} style={{ padding: "9px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "11px", color: "var(--danger-400)", cursor: "pointer", fontWeight: 600 }}>
                  <Square size={14} /> End Discussion
                </button>
              )}
              <button onClick={handleLeave} title="Leave"
                style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#ef4444", color: "white" }}>
                <PhoneOff size={18} />
              </button>
            </div>
          </div>

          {/* ── Right: participants + stats ── */}
          <div style={{ overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="dash-card" style={{ padding: "14px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Participants ({participants.length})
                {isHost && status === "live" && <span style={{ marginLeft: "6px", fontSize: "9px", color: "var(--amber-400)" }}>— host controls active</span>}
              </p>
              {participants.length === 0 && <p style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "10px 0" }}>No participants yet.</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {participants.map((p) => {
                  const pState = p.userId === userId
                    ? { micOn, cameraOn }
                    : (mediaStates[p.userId] ?? { micOn: true, cameraOn: true });
                  const canControl = isHost && p.userId !== room?.hostId && p.userId !== userId && status === "live";
                  return (
                    <div key={p.userId} style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: canControl ? "7px" : 0 }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                          {p.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.name} {p.userId === userId ? "(You)" : ""}
                            {speakingUsers.has(p.userId) && <span style={{ marginLeft: "5px", fontSize: "10px", color: "var(--teal-400)" }}>● speaking</span>}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                            <p style={{ fontSize: "10px", color: p.userId === room?.hostId ? "var(--amber-400)" : "var(--text-dim)" }}>
                              {p.userId === room?.hostId ? "Host" : "Participant"}
                            </p>
                            {!pState.micOn    && <span style={{ fontSize: "9px", color: "#f87171" }}>🔇</span>}
                            {!pState.cameraOn && <span style={{ fontSize: "9px", color: "#f87171" }}>📷 off</span>}
                          </div>
                        </div>
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: p.online !== false ? "#22c55e" : "#6b7280", flexShrink: 0 }} />
                      </div>
                      {/* Host controls per participant */}
                      {canControl && (
                        <div style={{ display: "flex", gap: "5px", paddingLeft: "37px" }}>
                          <button onClick={() => forceMedia(p.userId, !pState.micOn, undefined)}
                            title={pState.micOn ? "Mute this participant" : "Unmute this participant"}
                            style={{ flex: 1, padding: "4px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, cursor: "pointer", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.18s",
                              background: pState.micOn ? "rgba(255,255,255,0.05)" : "rgba(248,113,113,0.12)",
                              borderColor: pState.micOn ? "var(--border-soft)" : "rgba(248,113,113,0.4)",
                              color: pState.micOn ? "var(--text-muted)" : "#f87171" }}>
                            {pState.micOn ? <><Mic size={10} /> Mute</> : <><MicOff size={10} /> Unmute</>}
                          </button>
                          <button onClick={() => forceMedia(p.userId, undefined, !pState.cameraOn)}
                            title={pState.cameraOn ? "Turn off camera" : "Turn on camera"}
                            style={{ flex: 1, padding: "4px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, cursor: "pointer", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.18s",
                              background: pState.cameraOn ? "rgba(255,255,255,0.05)" : "rgba(248,113,113,0.12)",
                              borderColor: pState.cameraOn ? "var(--border-soft)" : "rgba(248,113,113,0.4)",
                              color: pState.cameraOn ? "var(--text-muted)" : "#f87171" }}>
                            {pState.cameraOn ? <><Video size={10} /> Cam off</> : <><VideoOff size={10} /> Cam on</>}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {status === "live" && messages.length > 0 && (
              <div className="dash-card" style={{ padding: "14px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Live Participation</p>
                {participants.filter((p) => p.userId !== room?.hostId).map((p) => {
                  const count = messages.filter((m) => m.userId === p.userId).length;
                  const pct = messages.length > 0 ? Math.round((count / messages.length) * 100) : 0;
                  return (
                    <div key={p.userId} style={{ marginBottom: "9px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.name}</span>
                        <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono,monospace", color: "var(--teal-400)" }}>{count} msgs</span>
                      </div>
                      <div className="progress-track" style={{ height: "4px" }}>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="dash-card" style={{ padding: "14px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Room Info</p>
              {[
                { label: "Duration", value: `${(room?.durationSec || 600) / 60} min` },
                { label: "Max", value: room?.maxParticipants || 6 },
                { label: "Messages", value: messages.length },
                { label: "Connections", value: Object.keys(peersRef.current).length },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{label}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "white", fontFamily: "JetBrains Mono,monospace" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes speakPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes bellPulse { from{box-shadow:0 0 0 0 rgba(251,191,36,0.4)} to{box-shadow:0 0 0 8px rgba(251,191,36,0)} }
      `}</style>
    </div>
  );
};

export default GDRoom;

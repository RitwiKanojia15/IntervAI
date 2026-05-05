import React from "react";
import { Users, Shield } from "lucide-react";
import VideoTile from "./VideoTile";

const WaitingRoom = ({ room, localStream, selfName, isHost, participants, micOn, cameraOn }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
    <div className="dash-card" style={{ padding: "20px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        {isHost
          ? <Shield size={18} style={{ color: "var(--amber-400)" }} />
          : <Users size={18} style={{ color: "var(--teal-400)" }} />}
        <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>
          {isHost ? "Waiting Room — You are the Host" : "Waiting Room"}
        </h3>
      </div>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "12px" }}>
        {isHost
          ? `${participants.length} participant(s) ready. Click "Start Discussion" when everyone has joined.`
          : "Waiting for the host to start the discussion. Your camera and mic are ready."}
      </p>
      <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-soft)" }}>
        <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px" }}>TOPIC</p>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>{room?.topic}</p>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
          Your Preview
        </p>
        <VideoTile stream={localStream} name={selfName} isSelf isMuted={!micOn} isCameraOff={!cameraOn} />
      </div>

      <div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
          Participants ({participants.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {participants.map((p) => (
            <div key={p.userId} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                {p.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: "13px", color: "white" }}>{p.name}</span>
              {p.userId === room?.hostId && (
                <span style={{ fontSize: "10px", color: "var(--amber-400)", marginLeft: "auto" }}>Host</span>
              )}
            </div>
          ))}
          {participants.length === 0 && (
            <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>No participants yet.</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default WaitingRoom;

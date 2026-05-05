import React from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Play, Square } from "lucide-react";

const ControlsBar = ({ micOn, cameraOn, onToggleMic, onToggleCamera, onLeave, isHost, status, onStart, onEnd }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "16px 24px", background: "var(--bg-card)", borderTop: "1px solid var(--border-soft)", flexShrink: 0 }}>
    {/* Mic toggle */}
    <button onClick={onToggleMic}
      style={{ width: "48px", height: "48px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s",
        background: micOn ? "rgba(255,255,255,0.1)" : "rgba(248,113,113,0.2)",
        color: micOn ? "white" : "#f87171" }}
      title={micOn ? "Mute" : "Unmute"}>
      {micOn ? <Mic size={20} /> : <MicOff size={20} />}
    </button>

    {/* Camera toggle */}
    <button onClick={onToggleCamera}
      style={{ width: "48px", height: "48px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s",
        background: cameraOn ? "rgba(255,255,255,0.1)" : "rgba(248,113,113,0.2)",
        color: cameraOn ? "white" : "#f87171" }}
      title={cameraOn ? "Turn off camera" : "Turn on camera"}>
      {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
    </button>

    {/* Host controls */}
    {isHost && status === "waiting" && (
      <button onClick={onStart} className="btn-teal"
        style={{ padding: "10px 24px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
        <Play size={16} /> Start Discussion
      </button>
    )}
    {isHost && status === "live" && (
      <button onClick={onEnd}
        style={{ padding: "10px 24px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "11px", color: "#f87171", cursor: "pointer", fontWeight: 600 }}>
        <Square size={16} /> End Discussion
      </button>
    )}

    {/* Leave */}
    <button onClick={onLeave}
      style={{ width: "48px", height: "48px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#ef4444", color: "white", transition: "all 0.18s" }}
      title="Leave">
      <PhoneOff size={20} />
    </button>
  </div>
);

export default ControlsBar;

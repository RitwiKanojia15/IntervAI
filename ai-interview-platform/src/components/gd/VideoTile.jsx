import React, { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";

const VideoTile = ({ stream, name, isMuted, isCameraOff, isSelf, isSpeaking }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{
      position: "relative", borderRadius: "12px", overflow: "hidden",
      background: "var(--bg-card)", border: `2px solid ${isSpeaking ? "var(--teal-400)" : "var(--border-soft)"}`,
      aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "border-color 0.2s",
      boxShadow: isSpeaking ? "0 0 0 2px rgba(20,184,166,0.4)" : "none",
    }}>
      {/* Video element — mirror only for self (local preview) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: isCameraOff ? "none" : "block",
          transform: isSelf ? "scaleX(-1)" : "none",
        }}
      />

      {/* Avatar when camera off */}
      {isCameraOff && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "white" }}>
            {initials}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{name}</p>
        </div>
      )}

      {/* Name label */}
      <div style={{ position: "absolute", bottom: "8px", left: "8px", display: "flex", alignItems: "center", gap: "5px", padding: "3px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "white" }}>{name}{isSelf ? " (You)" : ""}</span>
      </div>

      {/* Mic/camera status icons */}
      <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px" }}>
        {isMuted && (
          <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(248,113,113,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MicOff size={12} color="white" />
          </div>
        )}
        {isCameraOff && (
          <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(248,113,113,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <VideoOff size={12} color="white" />
          </div>
        )}
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div style={{ position: "absolute", top: "8px", left: "8px", width: "10px", height: "10px", borderRadius: "50%", background: "var(--teal-400)", animation: "speakPulse 0.8s ease-in-out infinite" }} />
      )}
    </div>
  );
};

export default VideoTile;

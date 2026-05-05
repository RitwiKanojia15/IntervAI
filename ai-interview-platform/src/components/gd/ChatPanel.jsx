import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

const SPAM_INTERVAL = 3000; // 3 seconds between messages

const ChatPanel = ({ messages, onSend, disabled }) => {
  const [input, setInput]     = useState("");
  const [lastSent, setLastSent] = useState(0);
  const [spamWarn, setSpamWarn] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || disabled) return;
    if (text.length < 10) { setSpamWarn("Message must be at least 10 characters."); return; }
    const now = Date.now();
    if (now - lastSent < SPAM_INTERVAL) { setSpamWarn("Please wait before sending another message."); return; }
    setSpamWarn("");
    onSend(text);
    setInput("");
    setLastSent(now);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Chat</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 && (
          <p style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", marginTop: "20px" }}>
            {disabled ? "Chat available once discussion starts." : "No messages yet."}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={msg._id || i}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)" }}>{msg.name}</span>
              <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, paddingLeft: "4px" }}>{msg.message}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {spamWarn && <p style={{ fontSize: "11px", color: "#f87171", padding: "4px 14px" }}>{spamWarn}</p>}
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border-soft)", display: "flex", gap: "8px", flexShrink: 0 }}>
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setSpamWarn(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={disabled ? "Waiting for discussion..." : "Type a message (min 10 chars)..."}
          disabled={disabled}
          style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-soft)", color: "var(--text-primary)", fontSize: "12px", outline: "none", opacity: disabled ? 0.5 : 1 }}
        />
        <button onClick={handleSend} disabled={!input.trim() || disabled} className="btn-teal"
          style={{ padding: "8px 12px", display: "flex", alignItems: "center", opacity: !input.trim() || disabled ? 0.5 : 1 }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;

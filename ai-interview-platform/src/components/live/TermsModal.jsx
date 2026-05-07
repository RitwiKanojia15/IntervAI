/* eslint-disable */
import React, { useState } from "react";
import { ShieldAlert, Monitor, EyeOff, Clock, Wifi, AlertTriangle } from "lucide-react";

/**
 * TermsModal
 * Shown once before the live test begins (when antiCheat is enabled).
 * The user must tick the checkbox before the "Start Test" button becomes active.
 *
 * Props:
 *   testTitle  – string  – title of the live test
 *   onAccept   – () => void – called when the user clicks "Start Test"
 */
const TermsModal = ({ testTitle, onAccept }) => {
  const [agreed, setAgreed] = useState(false);

  const rules = [
    {
      icon: <Monitor size={15} />,
      text: "The test must be attempted in fullscreen mode at all times.",
    },
    {
      icon: <EyeOff size={15} />,
      text: "Do not switch tabs, open new windows, or minimise the browser.",
    },
    {
      icon: <AlertTriangle size={15} />,
      text: "Multiple violations will automatically terminate your test.",
    },
    {
      icon: <Clock size={15} />,
      text: "The timer continues running even if you switch away from the tab.",
    },
    {
      icon: <Wifi size={15} />,
      text: "Internet interruptions may affect answer submission — stay connected.",
    },
  ];

  return (
    /* Full-screen overlay */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "var(--card-bg, #111827)",
          border: "1px solid var(--border-soft, rgba(255,255,255,0.08))",
          borderRadius: "16px",
          padding: "36px 32px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(20,184,166,0.15)",
              border: "1px solid rgba(20,184,166,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} style={{ color: "var(--teal-400, #2dd4bf)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", margin: 0 }}>
              Before You Begin
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted, #9ca3af)", margin: 0 }}>
              {testTitle}
            </p>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-muted, #9ca3af)", marginBottom: "20px", lineHeight: 1.6 }}>
          This is a proctored live assessment. Please read the rules carefully before starting.
        </p>

        {/* Rules list */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {rules.map((rule, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span
                style={{
                  color: "var(--teal-400, #2dd4bf)",
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              >
                {rule.icon}
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-muted, #9ca3af)", lineHeight: 1.55 }}>
                {rule.text}
              </span>
            </div>
          ))}
        </div>

        {/* Warning banner */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={14} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "12px", color: "#fbbf24", margin: 0, lineHeight: 1.5 }}>
            You will receive up to <strong>3 warnings</strong>. On the 3rd violation your test will be
            automatically submitted and you will be <strong>disqualified</strong>.
          </p>
        </div>

        {/* Checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              marginTop: "2px",
              accentColor: "var(--teal-400, #2dd4bf)",
              flexShrink: 0,
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--text-muted, #9ca3af)", lineHeight: 1.55 }}>
            I have read and agree to the rules and regulations. I understand that violations may result
            in disqualification.
          </span>
        </label>

        {/* Start button */}
        <button
          type="button"
          onClick={() => agreed && onAccept()}
          disabled={!agreed}
          className={agreed ? "btn-teal" : "btn-outline"}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: agreed ? 1 : 0.45,
            cursor: agreed ? "pointer" : "not-allowed",
            transition: "opacity 0.2s",
          }}
        >
          <Monitor size={15} />
          Start Test in Fullscreen
        </button>
      </div>
    </div>
  );
};

export default TermsModal;

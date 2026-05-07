/**
 * TermsModal
 *
 * Shown once before the live test session begins.
 * User must explicitly accept the rules before the test starts.
 * Blocks interaction with the rest of the page via a full-screen overlay.
 */

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Monitor, ShieldAlert, TabletSmartphone } from "lucide-react";

const RULES = [
  {
    icon: <Monitor size={16} />,
    title: "Stay in fullscreen",
    description:
      "The test will enter fullscreen mode automatically. Exiting fullscreen counts as a violation.",
  },
  {
    icon: <TabletSmartphone size={16} />,
    title: "No tab switching",
    description:
      "Switching to another tab, window, or application during the test is detected and recorded.",
  },
  {
    icon: <ShieldAlert size={16} />,
    title: "3-strike rule",
    description:
      "Each violation earns a warning. After 3 violations your test is automatically submitted and you are disqualified.",
  },
  {
    icon: <AlertTriangle size={16} />,
    title: "No external help",
    description:
      "Using any external resource, tool, or assistance during the test is strictly prohibited.",
  },
];

const TermsModal = ({ testTitle, onAccept }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "var(--card-bg, #111827)",
          border: "1px solid var(--border-soft, rgba(255,255,255,0.08))",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <span
            className="teal-badge inline-flex"
            style={{ marginBottom: "12px" }}
          >
            <ShieldAlert size={12} /> ANTI-CHEAT POLICY
          </span>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "white",
              marginBottom: "6px",
            }}
          >
            Before you begin: {testTitle}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.6 }}>
            Read and accept the following rules. Violations are recorded in real-time and
            visible to the host.
          </p>
        </div>

        {/* Rules list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {RULES.map((rule) => (
            <div
              key={rule.title}
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                style={{
                  color: "var(--teal-400, #2dd4bf)",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {rule.icon}
              </span>
              <div>
                <p
                  style={{
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "3px",
                  }}
                >
                  {rule.title}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: 1.55 }}>
                  {rule.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: "pointer",
            marginBottom: "20px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: checked
              ? "rgba(20,184,166,0.08)"
              : "rgba(255,255,255,0.02)",
            border: `1px solid ${checked ? "rgba(20,184,166,0.35)" : "rgba(255,255,255,0.06)"}`,
            transition: "all 0.2s",
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ marginTop: "2px", accentColor: "var(--teal-400, #2dd4bf)", cursor: "pointer" }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.55 }}>
            I have read and understood the rules. I agree that any violation will be recorded
            and may result in disqualification.
          </span>
        </label>

        {/* CTA */}
        <button
          type="button"
          className="btn-teal"
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: checked ? 1 : 0.45,
            cursor: checked ? "pointer" : "not-allowed",
            transition: "opacity 0.2s",
          }}
          disabled={!checked}
          onClick={onAccept}
        >
          <CheckCircle2 size={16} />
          I Accept — Start Test
        </button>
      </div>
    </div>
  );
};

export default TermsModal;

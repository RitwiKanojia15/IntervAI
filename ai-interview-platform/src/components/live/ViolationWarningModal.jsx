/* eslint-disable */
import React, { useEffect } from "react";
import { AlertTriangle, ShieldAlert, XCircle } from "lucide-react";

/**
 * ViolationWarningModal
 * Shown each time the anti-cheat system records a violation.
 *
 * Props:
 *   warnings     – number  – current warning count (1-based)
 *   maxWarnings  – number  – total allowed warnings before disqualification
 *   reason       – string  – "tab-switch" | "fullscreen-exit" | etc.
 *   onClose      – () => void – called when the user dismisses the modal
 */
const ViolationWarningModal = ({ warnings, maxWarnings, reason, onClose }) => {
  const isDisqualified = warnings >= maxWarnings;
  const remaining = maxWarnings - warnings;

  // Auto-dismiss after 6 s (unless disqualified — that one stays until redirect)
  useEffect(() => {
    if (isDisqualified) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [isDisqualified, onClose]);

  const reasonLabel =
    reason === "fullscreen-exit"
      ? "Exiting fullscreen"
      : reason === "tab-switch"
      ? "Tab / window switching"
      : "Suspicious activity";

  const accentColor = isDisqualified ? "#ef4444" : warnings >= maxWarnings - 1 ? "#f97316" : "#fbbf24";
  const bgColor = isDisqualified
    ? "rgba(239,68,68,0.08)"
    : warnings >= maxWarnings - 1
    ? "rgba(249,115,22,0.08)"
    : "rgba(251,191,36,0.08)";
  const borderColor = isDisqualified
    ? "rgba(239,68,68,0.3)"
    : warnings >= maxWarnings - 1
    ? "rgba(249,115,22,0.3)"
    : "rgba(251,191,36,0.3)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "var(--card-bg, #111827)",
          border: `1px solid ${borderColor}`,
          borderRadius: "14px",
          padding: "28px 28px 24px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: `0 0 0 1px ${borderColor}, 0 20px 48px rgba(0,0,0,0.55)`,
          animation: "fadeInScale 0.2s ease",
        }}
      >
        {/* Icon + title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: bgColor,
              border: `1px solid ${borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isDisqualified ? (
              <XCircle size={20} style={{ color: accentColor }} />
            ) : (
              <AlertTriangle size={20} style={{ color: accentColor }} />
            )}
          </div>
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: accentColor,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {isDisqualified
                ? "Disqualified"
                : `Warning ${warnings} of ${maxWarnings}`}
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-dim, #6b7280)", margin: 0 }}>
              {reasonLabel} detected
            </p>
          </div>
        </div>

        {/* Message */}
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-muted, #9ca3af)",
            lineHeight: 1.6,
            marginBottom: "16px",
          }}
        >
          {isDisqualified ? (
            <>
              You have been <strong style={{ color: accentColor }}>disqualified</strong> due to multiple
              violations. Your test has been automatically submitted. You cannot rejoin this session.
            </>
          ) : remaining === 1 ? (
            <>
              <strong style={{ color: accentColor }}>One more violation</strong> will automatically
              terminate your test and mark you as disqualified. Please stay in fullscreen and do not
              switch tabs.
            </>
          ) : (
            <>
              Tab switching and exiting fullscreen are not allowed during a proctored test. You have{" "}
              <strong style={{ color: accentColor }}>
                {remaining} warning{remaining !== 1 ? "s" : ""} remaining
              </strong>{" "}
              before automatic disqualification.
            </>
          )}
        </p>

        {/* Warning pip bar */}
        <div style={{ display: "flex", gap: "5px", marginBottom: "18px" }}>
          {Array.from({ length: maxWarnings }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: "5px",
                borderRadius: "3px",
                background: i < warnings ? accentColor : "rgba(255,255,255,0.1)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* Dismiss / re-enter fullscreen button */}
        {!isDisqualified && (
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: bgColor,
              border: `1px solid ${borderColor}`,
              color: accentColor,
              transition: "opacity 0.2s",
            }}
          >
            I understand — Return to Test
          </button>
        )}

        {/* Auto-dismiss hint */}
        {!isDisqualified && (
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-dim, #6b7280)",
              textAlign: "center",
              marginTop: "10px",
              marginBottom: 0,
            }}
          >
            This dialog will close automatically in 6 seconds.
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ViolationWarningModal;

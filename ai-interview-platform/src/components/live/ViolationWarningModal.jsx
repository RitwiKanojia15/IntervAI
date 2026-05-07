/**
 * ViolationWarningModal
 *
 * Shown on every anti-cheat violation (tab switch, window blur, fullscreen exit).
 * Displays current warning count and remaining strikes.
 * Auto-dismisses after 5 seconds or on manual close.
 */

import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

const REASON_LABELS = {
  "tab-switch": "Tab switch detected",
  "window-blur": "Window focus lost",
  "fullscreen-exit": "Fullscreen exited",
};

const AUTO_DISMISS_MS = 5000;

const ViolationWarningModal = ({
  warnings,
  maxWarnings,
  reason,
  onClose,
}) => {
  const isLastWarning = warnings >= maxWarnings - 1;
  const label = REASON_LABELS[reason] || "Violation detected";

  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          background: isLastWarning ? "rgba(127,29,29,0.95)" : "rgba(17,24,39,0.97)",
          border: `1px solid ${isLastWarning ? "rgba(239,68,68,0.6)" : "rgba(251,191,36,0.45)"}`,
          borderRadius: "14px",
          padding: "28px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: `0 20px 60px ${isLastWarning ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.5)"}`,
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            padding: "4px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Dismiss warning"
        >
          <X size={16} />
        </button>

        {/* Icon + title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: isLastWarning ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle
              size={20}
              style={{ color: isLastWarning ? "#ef4444" : "#fbbf24" }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: isLastWarning ? "#fca5a5" : "#fde68a",
                marginBottom: "3px",
              }}
            >
              {label}
            </p>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "white",
              }}
            >
              Warning {warnings}/{maxWarnings}
            </h3>
          </div>
        </div>

        {/* Strike indicators */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {Array.from({ length: maxWarnings }).map((_, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              style={{
                flex: 1,
                height: "6px",
                borderRadius: "3px",
                background:
                  i < warnings
                    ? isLastWarning
                      ? "#ef4444"
                      : "#fbbf24"
                    : "rgba(255,255,255,0.1)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* Message */}
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: 1.6 }}>
          {isLastWarning ? (
            <>
              <strong style={{ color: "#fca5a5" }}>This is your final warning.</strong> One more
              violation will automatically submit your test and disqualify you.
            </>
          ) : (
            <>
              Stay on the test tab and keep the window in fullscreen. You have{" "}
              <strong style={{ color: "#fde68a" }}>
                {maxWarnings - warnings} strike{maxWarnings - warnings !== 1 ? "s" : ""} remaining
              </strong>{" "}
              before disqualification.
            </>
          )}
        </p>

        {/* Auto-dismiss hint */}
        <p
          style={{
            marginTop: "14px",
            fontSize: "11px",
            color: "rgba(255,255,255,0.3)",
            textAlign: "right",
          }}
        >
          Dismisses automatically in 5 s
        </p>
      </div>
    </div>
  );
};

export default ViolationWarningModal;

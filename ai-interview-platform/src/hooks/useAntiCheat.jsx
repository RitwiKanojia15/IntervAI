/**
 * useAntiCheat
 *
 * Handles all anti-cheat detection for the Live Test module:
 *  - Fullscreen enforcement (enter on start, detect exit)
 *  - Tab-switch detection (visibilitychange)
 *  - Window blur / minimize detection (blur event)
 *
 * Returns helpers to enter fullscreen and a teardown function.
 * Calls `onViolation(reason)` on every detected event.
 * Debounces repeated triggers to 5 s per violation.
 */

import { useCallback, useEffect, useRef } from "react";

const VIOLATION_DEBOUNCE_MS = 5000;

const useAntiCheat = ({ enabled, onViolation }) => {
  const lastViolationRef = useRef(0);
  const enabledRef = useRef(enabled);

  // Keep ref in sync so event listeners always see the latest value
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  /** Request fullscreen on the document element */
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      (
        el.requestFullscreen?.() ||
        el.webkitRequestFullscreen?.() ||
        el.mozRequestFullScreen?.() ||
        el.msRequestFullscreen?.()
      );
    }
  }, []);

  /** Exit fullscreen (used on cleanup / disqualification) */
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      (
        document.exitFullscreen?.() ||
        document.webkitExitFullscreen?.() ||
        document.mozCancelFullScreen?.() ||
        document.msExitFullscreen?.()
      );
    }
  }, []);

  const fireViolation = useCallback(
    (reason) => {
      if (!enabledRef.current) return;
      const now = Date.now();
      if (now - lastViolationRef.current < VIOLATION_DEBOUNCE_MS) return;
      lastViolationRef.current = now;
      onViolation(reason);
    },
    [onViolation]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    // ── Tab switch ────────────────────────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        fireViolation("tab-switch");
      }
    };

    // ── Window blur (minimize / alt-tab / focus lost) ─────────────────────────
    const handleWindowBlur = () => {
      // Only fire if the document is still visible (blur without tab switch)
      if (document.visibilityState !== "hidden") {
        fireViolation("window-blur");
      }
    };

    // ── Fullscreen exit ───────────────────────────────────────────────────────
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        fireViolation("fullscreen-exit");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [enabled, fireViolation]);

  return { enterFullscreen, exitFullscreen };
};

export default useAntiCheat;

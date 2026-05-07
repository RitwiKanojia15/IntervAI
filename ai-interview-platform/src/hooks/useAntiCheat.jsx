/* eslint-disable */
import { useCallback, useEffect, useRef } from "react";

/**
 * useAntiCheat
 *
 * Detects tab-switching, window blur, and fullscreen exits during a live test.
 * Calls `onViolation(reason)` whenever a violation is detected.
 *
 * Props:
 *   enabled     – boolean  – activate/deactivate the hook
 *   onViolation – (reason: string) => void
 *
 * Returns:
 *   enterFullscreen – () => Promise<void>
 *   exitFullscreen  – () => void
 */
const useAntiCheat = ({ enabled = false, onViolation }) => {
  // Prevent double-firing on the same event cycle
  const cooldownRef = useRef(false);
  const mountedRef  = useRef(false);

  const triggerViolation = useCallback(
    (reason) => {
      if (!enabled || cooldownRef.current) return;
      cooldownRef.current = true;
      onViolation?.(reason);
      // 2-second cooldown so rapid events don't stack up
      setTimeout(() => { cooldownRef.current = false; }, 2000);
    },
    [enabled, onViolation]
  );

  // ── Fullscreen helpers ──────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) return; // already fullscreen
    try {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch {
      // User denied or browser blocked — treat as a violation
      triggerViolation("fullscreen-exit");
    }
  }, [triggerViolation]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ── Event listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    mountedRef.current = true;

    // --- visibilitychange: tab hidden / minimised ---
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerViolation("tab-switch");
      }
    };

    // --- window blur: focus moved to another window / app ---
    const handleBlur = () => {
      // Only fire if the page is still visible (avoids double-firing with visibilitychange)
      if (document.visibilityState === "visible") {
        triggerViolation("tab-switch");
      }
    };

    // --- fullscreenchange: user pressed Esc or otherwise exited fullscreen ---
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && mountedRef.current) {
        triggerViolation("fullscreen-exit");
        // Attempt to re-enter fullscreen after a short delay
        setTimeout(() => {
          if (mountedRef.current && !document.fullscreenElement) {
            enterFullscreen();
          }
        }, 800);
      }
    };

    // --- Prevent right-click context menu ---
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // --- Block common copy/paste/devtools shortcuts ---
    const handleKeyDown = (e) => {
      const blocked =
        (e.ctrlKey && ["c", "v", "u", "s", "a"].includes(e.key.toLowerCase())) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === "Tab");

      if (blocked) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, enterFullscreen, triggerViolation]);

  return { enterFullscreen, exitFullscreen };
};

export default useAntiCheat;

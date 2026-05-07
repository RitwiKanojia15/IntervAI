import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, ShieldAlert, Trophy, Users } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import useLiveTestSocket from "../../hooks/useLiveTestSocket";
import { getLiveTestLeaderboard } from "../../services/api";
import {
  clearActiveLiveTest,
  clearLiveTestResult,
  getActiveLiveTest,
  getLiveTestResult,
} from "../../utils/liveTestStorage";

const LiveTestLeaderboard = () => {
  const navigate = useNavigate();
  const [result] = useState(() => getLiveTestResult());
  const [activeSession] = useState(() => getActiveLiveTest());
  const [leaderboardState, setLeaderboardState] = useState({
    title: result?.title || activeSession?.title || "Live Test",
    joinCode: result?.joinCode || activeSession?.joinCode || "",
    leaderboard: result?.leaderboard || [],
  });
  const [error, setError] = useState("");
  // Real-time violation log for host view
  const [violations, setViolations] = useState([]);

  const testId = result?.testId || activeSession?.testId;

  const refreshLeaderboard = useCallback(async () => {
    if (!testId) {
      return;
    }

    try {
      const response = await getLiveTestLeaderboard(testId, { limit: 20 });
      setLeaderboardState(response.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load the leaderboard.");
    }
  }, [testId]);

  useEffect(() => {
    if (!testId) {
      navigate("/live-tests", { replace: true });
      return;
    }

    refreshLeaderboard();
  }, [navigate, refreshLeaderboard, testId]);

  useLiveTestSocket({
    testId,
    onLeaderboardUpdate: useCallback((payload) => {
      setLeaderboardState(payload);
    }, []),
    onViolationUpdate: useCallback((payload) => {
      setViolations((prev) => {
        // Keep latest 50 events, newest first
        const next = [{ ...payload, at: new Date().toISOString() }, ...prev];
        return next.slice(0, 50);
      });
    }, []),
  });

  if (!testId) {
    return null;
  }

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "28px 24px 40px" }}>
        <PageWrapper>
          <button
            type="button"
            onClick={() => navigate("/live-tests")}
            className="flex items-center gap-2 text-sm mb-6"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={15} /> Back to live test lobby
          </button>

          <div className="dash-card fade-up">
            <div className="test-results-hero">
              <div>
                <span className="teal-badge inline-flex mb-3">
                  <Trophy size={12} /> LIVE LEADERBOARD
                </span>
                <h1 style={{ fontSize: "30px", color: "white", marginBottom: "8px" }}>
                  {leaderboardState.title}
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
                  Join code {leaderboardState.joinCode} · rankings break ties by lower completion time.
                </p>
              </div>

              <div className="test-score-orb">
                <span className="test-score-orb-label">Entries</span>
                <span className="test-score-orb-value">{leaderboardState.leaderboard.length}</span>
              </div>
            </div>

            {result?.result ? (
              <div className="test-results-stats">
                <div className="info-tile">
                  <div className="info-tile-label">Score</div>
                  <div className="info-tile-value">{result.result.score}</div>
                </div>
                <div className="info-tile">
                  <div className="info-tile-label">Correct</div>
                  <div className="info-tile-value">{result.result.correct}</div>
                </div>
                <div className="info-tile">
                  <div className="info-tile-label">Rank</div>
                  <div className="info-tile-value">{result.result.participantRank || "-"}</div>
                </div>
                <div className="info-tile">
                  <div className="info-tile-label">Time</div>
                  <div className="info-tile-value">{result.result.timeTakenSec}s</div>
                </div>
              </div>
            ) : null}

            <div className="test-results-actions">
              <button type="button" className="btn-outline" onClick={refreshLeaderboard}>
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                type="button"
                className="btn-teal"
                onClick={() => {
                  clearActiveLiveTest();
                  clearLiveTestResult();
                  navigate("/live-tests");
                }}
              >
                <Users size={14} /> Back to Lobby
              </button>
            </div>
          </div>

          {error ? (
            <div className="banner-error mt-4">
              <span>{error}</span>
            </div>
          ) : null}

          {/* ── Real-time violation log (visible to host/admin) ── */}
          {violations.length > 0 && (
            <div className="dash-card fade-up mt-5">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <ShieldAlert size={16} style={{ color: "#fbbf24" }} />
                <h3 style={{ fontSize: "16px", color: "white", fontWeight: 700 }}>
                  Anti-Cheat Violations
                </h3>
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-dim)", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "20px", padding: "2px 8px" }}>
                  {violations.length} event{violations.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto" }}>
                {violations.map((v, i) => (
                  <div
                    key={`${v.participantKey}-${v.at}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: v.locked ? "rgba(239,68,68,0.08)" : "rgba(251,191,36,0.06)",
                      border: `1px solid ${v.locked ? "rgba(239,68,68,0.25)" : "rgba(251,191,36,0.18)"}`,
                    }}
                  >
                    <ShieldAlert
                      size={13}
                      style={{ color: v.locked ? "#ef4444" : "#fbbf24", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "13px", color: "white", fontWeight: 600 }}>
                        {v.participantName}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>
                        {v.reason === "tab-switch"
                          ? "switched tab"
                          : v.reason === "window-blur"
                          ? "lost window focus"
                          : "exited fullscreen"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "JetBrains Mono,monospace",
                        color: v.locked ? "#fca5a5" : "#fde68a",
                        flexShrink: 0,
                      }}
                    >
                      {v.locked ? "DISQUALIFIED" : `${v.warnings}/${v.maxWarnings}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-4">
            {leaderboardState.leaderboard.map((entry) => (
              <div key={entry.id} className="result-list-card fade-up">
                <div className="result-list-top">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--teal-400)" }}>
                      Rank #{entry.rank}
                    </p>
                    <h3 style={{ color: "white", fontSize: "18px", marginTop: "6px" }}>{entry.participantName}</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <span className="skill-tag strong">{entry.score} pts</span>
                    {entry.status === "disqualified" && (
                      <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#fca5a5", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <ShieldAlert size={10} /> Disqualified
                      </span>
                    )}
                  </div>
                </div>

                <div className="test-review-grid">
                  <div className="info-tile">
                    <div className="info-tile-label">Correct</div>
                    <div className="info-tile-value">{entry.correct}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-tile-label">Wrong</div>
                    <div className="info-tile-value">{entry.wrong}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-tile-label">Total</div>
                    <div className="info-tile-value">{entry.total}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-tile-label">Time Taken</div>
                    <div className="info-tile-value">{entry.timeTakenSec}s</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default LiveTestLeaderboard;

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Trophy, Users } from "lucide-react";
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
                  <span className="skill-tag strong">{entry.score} pts</span>
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

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, TimerReset, Zap } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import { useAuth } from "../../context/AuthContext";
import { createLiveTest, joinLiveTest } from "../../services/api";
import { TEST_CATEGORIES } from "../../utils/testHelpers";
import {
  clearLiveTestResult,
  getActiveLiveTest,
  saveActiveLiveTest,
} from "../../utils/liveTestStorage";

const QUESTION_COUNT_OPTIONS = [10, 15, 20];
const DURATION_OPTIONS = [600, 900, 1200];

const LiveTestLobby = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeSession = getActiveLiveTest();
  const hostIdentity = user?.email || user?.name || "admin";

  const [selectedCategories, setSelectedCategories] = useState([
    "quantitative",
    "logical-reasoning",
    "technical",
  ]);
  const [questionCount, setQuestionCount] = useState(15);
  const [durationSec, setDurationSec] = useState(900);
  const [testTitle, setTestTitle] = useState("Campus Screening Live Test");
  const [joinCode, setJoinCode] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdTest, setCreatedTest] = useState(null);

  const selectableCategories = useMemo(
    () => TEST_CATEGORIES.filter((category) => category.key !== "mixed"),
    []
  );

  const toggleCategory = (categoryKey) => {
    setSelectedCategories((current) => {
      if (current.includes(categoryKey)) {
        return current.length === 1 ? current : current.filter((item) => item !== categoryKey);
      }

      return [...current, categoryKey];
    });
  };

  const handleCreateTest = async () => {
    setCreateLoading(true);
    setError("");

    try {
      const response = await createLiveTest({
        title: testTitle,
        hostId: hostIdentity,
        categories: selectedCategories,
        totalQuestions: questionCount,
      });

      setCreatedTest(response.data);
      setJoinCode(response.data.joinCode);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create the live test right now.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinTest = async (targetJoinCode = joinCode) => {
    setJoinLoading(true);
    setError("");

    try {
      const response = await joinLiveTest({
        joinCode: targetJoinCode,
        userId: hostIdentity,
        email: user?.email,
        participantName: user?.name || user?.email || hostIdentity,
      });

      clearLiveTestResult();
      saveActiveLiveTest({
        ...response.data,
        currentQuestionIndex: 0,
      });
      navigate("/live-tests/session");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to join this live test.");
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "28px 24px 40px" }}>
        <PageWrapper>
          <div className="test-layout">
            <div className="test-layout-main">
              <div className="dash-card fade-up">
                <span className="teal-badge inline-flex mb-3">
                  <Zap size={12} /> LIVE TESTS
                </span>
                <h1 style={{ fontSize: "30px", color: "white", marginBottom: "8px" }}>
                  Host or join a live assessment
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.65 }}>
                  The server drives the timer, answers save incrementally, and leaderboard updates stream in live.
                </p>
              </div>

              <div className="dash-card fade-up delay-1">
                <div className="test-panel-header">
                  <div>
                    <h2 style={{ fontSize: "20px", color: "white", marginBottom: "6px" }}>
                      Create live test
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                      Build a balanced live round with one shared timer and one stable question order for every participant.
                    </p>
                  </div>
                  <div className="test-mini-stat">
                    <span className="test-mini-stat-label">Host</span>
                    <span className="test-mini-stat-value">{user?.name || "Admin"}</span>
                  </div>
                </div>

                <div className="test-config-grid">
                  <div>
                    <p className="test-config-label">Test Title</p>
                    <input
                      className="dark-input"
                      value={testTitle}
                      onChange={(event) => setTestTitle(event.target.value)}
                      placeholder="Campus Screening Live Test"
                    />
                  </div>

                  <div>
                    <p className="test-config-label">Question Count</p>
                    <div className="test-pill-row">
                      {QUESTION_COUNT_OPTIONS.map((count) => (
                        <button
                          key={count}
                          type="button"
                          className={`test-filter-pill ${questionCount === count ? "active" : ""}`}
                          onClick={() => setQuestionCount(count)}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="test-config-label">Duration</p>
                    <div className="test-pill-row">
                      {DURATION_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`test-filter-pill ${durationSec === value ? "active" : ""}`}
                          onClick={() => setDurationSec(value)}
                        >
                          {Math.round(value / 60)} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="test-config-label">Categories</p>
                    <div className="test-pill-row compact">
                      {selectableCategories.map((category) => (
                        <button
                          key={category.key}
                          type="button"
                          className={`test-filter-pill compact ${selectedCategories.includes(category.key) ? "active" : ""}`}
                          onClick={() => toggleCategory(category.key)}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="test-panel-footer">
                  <div className="test-mini-stat">
                    <span className="test-mini-stat-label">Distribution</span>
                    <span className="test-mini-stat-value">Easy 40% · Medium 40% · Hard 20%</span>
                  </div>
                  <button
                    type="button"
                    className="btn-teal"
                    onClick={handleCreateTest}
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create Live Test"} <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="dash-card fade-up delay-2">
                <div className="test-panel-header">
                  <div>
                    <h2 style={{ fontSize: "20px", color: "white", marginBottom: "6px" }}>
                      Join with code
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                      Resume is automatic for the same participant identity, and duplicate sessions are blocked server-side.
                    </p>
                  </div>
                </div>

                <div className="test-config-grid" style={{ gridTemplateColumns: "1.2fr auto" }}>
                  <div>
                    <p className="test-config-label">Join Code</p>
                    <input
                      className="dark-input"
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                      placeholder="Enter live test code"
                    />
                  </div>

                  <div style={{ alignSelf: "end" }}>
                    <button type="button" className="btn-teal" onClick={() => handleJoinTest()} disabled={joinLoading}>
                      {joinLoading ? "Joining..." : "Join Live Test"} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="banner-error mt-4">
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="test-layout-side">
              {createdTest ? (
                <div className="dash-card fade-up delay-2">
                  <h3 style={{ fontSize: "18px", color: "white", marginBottom: "10px" }}>
                    Live test created
                  </h3>
                  <div className="space-y-3">
                    <div className="info-tile">
                      <div className="info-tile-label">Join Code</div>
                      <div className="info-tile-value">{createdTest.joinCode}</div>
                    </div>
                    <div className="info-tile">
                      <div className="info-tile-label">Questions</div>
                      <div className="info-tile-value">{createdTest.questionCount}</div>
                    </div>
                    <div className="info-tile">
                      <div className="info-tile-label">Duration</div>
                      <div className="info-tile-value">{Math.round(createdTest.totalDurationSec / 60)} min</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-outline mt-4"
                    onClick={() => handleJoinTest(createdTest.joinCode)}
                  >
                    <CheckCircle2 size={14} /> Join as host
                  </button>
                </div>
              ) : null}

              {activeSession ? (
                <div className="dash-card fade-up delay-3">
                  <h3 style={{ fontSize: "18px", color: "white", marginBottom: "10px" }}>
                    Resume active session
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.6, marginBottom: "14px" }}>
                    An unfinished live test session is already saved in this browser for {activeSession.title}.
                  </p>
                  <button type="button" className="btn-outline" onClick={() => navigate("/live-tests/session")}>
                    <TimerReset size={14} /> Continue Live Test
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default LiveTestLobby;

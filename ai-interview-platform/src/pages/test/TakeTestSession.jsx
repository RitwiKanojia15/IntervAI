import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Clock } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import TestQuestionPanel from "../../components/test/TestQuestionPanel";
import { evaluateTestAnswer, submitTestSession } from "../../services/api";
import {
  formatCategoryLabel,
  formatDifficultyLabel,
  reorderQuestionsForAdaptivePath,
} from "../../utils/testHelpers";
import {
  clearActiveTestSession,
  getActiveTestSession,
  saveActiveTestSession,
  saveTestResult,
} from "../../utils/testSessionStorage";

const TakeTestSession = () => {
  const navigate = useNavigate();
  const [testState, setTestState] = useState(() => getActiveTestSession());
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = testState?.questions?.[testState.currentQuestionIndex] || null;
  const totalQuestions = testState?.questions?.length || 0;
  const answeredCount = useMemo(() => {
    if (!testState) {
      return 0;
    }

    return testState.questions.filter((question) => Boolean(testState.answers[question.id])).length;
  }, [testState]);
  const remainingTime = currentQuestion
    ? testState.remainingTimeByQuestionId[currentQuestion.id] ?? currentQuestion.timeLimitSec
    : 0;
  const isLastQuestion = testState ? testState.currentQuestionIndex === totalQuestions - 1 : false;

  const commitState = (nextState) => {
    saveActiveTestSession(nextState);
    setTestState(nextState);
    return nextState;
  };

  const evaluateCurrentQuestion = useCallback(async (baseState, moveForward) => {
    if (!baseState || !currentQuestion) {
      return baseState;
    }

    const selectedOptionId = baseState.answers[currentQuestion.id] || null;
    const currentRemainingTime =
      baseState.remainingTimeByQuestionId[currentQuestion.id] ?? currentQuestion.timeLimitSec;
    const timeSpentSec = Math.max(currentQuestion.timeLimitSec - currentRemainingTime, 0);

    const response = await evaluateTestAnswer({
      sessionId: baseState.sessionId,
      questionId: currentQuestion.id,
      selectedOptionId,
      timeSpentSec,
    });

    const reviewEntry = {
      selectedOptionId,
      timeSpentSec,
      ...response.data,
    };

    let reorderedQuestions = baseState.questions;

    if (moveForward && baseState.meta?.adaptiveEnabled && reviewEntry.nextDifficulty) {
      reorderedQuestions = reorderQuestionsForAdaptivePath(
        baseState.questions,
        baseState.currentQuestionIndex,
        reviewEntry.nextDifficulty
      );
    }

    return {
      ...baseState,
      questions: reorderedQuestions,
      reviewByQuestionId: {
        ...baseState.reviewByQuestionId,
        [currentQuestion.id]: reviewEntry,
      },
    };
  }, [currentQuestion]);

  const handlePrevious = () => {
    if (!testState || processing || testState.currentQuestionIndex === 0) {
      return;
    }

    commitState({
      ...testState,
      currentQuestionIndex: testState.currentQuestionIndex - 1,
    });
  };

  const handleAdvance = useCallback(async () => {
    if (!testState || !currentQuestion || processing) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const reviewedState = await evaluateCurrentQuestion(testState, true);
      commitState({
        ...reviewedState,
        currentQuestionIndex: Math.min(reviewedState.currentQuestionIndex + 1, reviewedState.questions.length - 1),
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this answer right now.");
    } finally {
      setProcessing(false);
    }
  }, [currentQuestion, evaluateCurrentQuestion, processing, testState]);

  const handleSubmit = useCallback(async () => {
    if (!testState || !currentQuestion || processing) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const reviewedState = await evaluateCurrentQuestion(testState, false);
      commitState(reviewedState);

      const response = await submitTestSession({
        sessionId: reviewedState.sessionId,
        answers: reviewedState.answers,
      });

      saveTestResult({
        ...response.data,
        mode: reviewedState.mode,
        meta: reviewedState.meta,
        completedAt: new Date().toISOString(),
      });
      clearActiveTestSession();
      navigate("/take-test/results");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit the test right now.");
    } finally {
      setProcessing(false);
    }
  }, [currentQuestion, evaluateCurrentQuestion, navigate, processing, testState]);

  const handleSelectOption = (optionId) => {
    if (!testState || !currentQuestion) {
      return;
    }

    commitState({
      ...testState,
      answers: {
        ...testState.answers,
        [currentQuestion.id]: optionId,
      },
    });
  };

  useEffect(() => {
    if (!testState) {
      navigate("/take-test", { replace: true });
    }
  }, [navigate, testState]);

  useEffect(() => {
    if (!testState || !currentQuestion || processing) {
      return undefined;
    }

    if (remainingTime <= 0) {
      if (isLastQuestion) {
        handleSubmit();
      } else {
        handleAdvance();
      }

      return undefined;
    }

    const timer = window.setTimeout(() => {
      setTestState((previousState) => {
        if (!previousState) {
          return previousState;
        }

        const activeQuestion = previousState.questions[previousState.currentQuestionIndex];

        if (!activeQuestion || activeQuestion.id !== currentQuestion.id) {
          return previousState;
        }

        const nextRemaining = Math.max(
          (previousState.remainingTimeByQuestionId[activeQuestion.id] ?? activeQuestion.timeLimitSec) - 1,
          0
        );
        const nextState = {
          ...previousState,
          remainingTimeByQuestionId: {
            ...previousState.remainingTimeByQuestionId,
            [activeQuestion.id]: nextRemaining,
          },
        };

        saveActiveTestSession(nextState);
        return nextState;
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [currentQuestion, handleAdvance, handleSubmit, isLastQuestion, processing, remainingTime, testState]);

  if (!testState || !currentQuestion) {
    return null;
  }

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "28px 24px 40px" }}>
        <PageWrapper>
          <button
            type="button"
            onClick={() => navigate("/take-test")}
            className="flex items-center gap-2 text-sm mb-6"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            <ArrowLeft size={15} /> Exit Test Setup
          </button>

          <div className="test-session-shell">
            <div className="test-session-main">
              <div className="dash-card fade-up">
                <div className="test-session-header">
                  <div>
                    <span className="teal-badge inline-flex mb-2">
                      <Clock size={12} /> TIMED TEST
                    </span>
                    <h1 style={{ fontSize: "28px", color: "white", marginBottom: "8px" }}>
                      {formatCategoryLabel(testState.meta?.category || testState.mode)}
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                      {testState.meta?.topic || "General topic coverage"} · {formatDifficultyLabel(testState.meta?.difficulty)}
                    </p>
                  </div>

                  <div className="test-mini-stat">
                    <span className="test-mini-stat-label">Progress</span>
                    <span className="test-mini-stat-value">
                      {testState.currentQuestionIndex + 1}/{totalQuestions}
                    </span>
                  </div>
                </div>

                <div className="progress-track mt-5">
                  <div
                    className="progress-fill"
                    style={{ width: `${((testState.currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {error ? (
                <div className="banner-error mt-4">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="mt-4">
                <TestQuestionPanel
                  question={currentQuestion}
                  currentIndex={testState.currentQuestionIndex}
                  total={totalQuestions}
                  selectedOptionId={testState.answers[currentQuestion.id] || null}
                  remainingTime={remainingTime}
                  answeredCount={answeredCount}
                  adaptiveEnabled={Boolean(testState.meta?.adaptiveEnabled)}
                  onSelectOption={handleSelectOption}
                  onPrevious={handlePrevious}
                  onNext={handleAdvance}
                  onSubmit={handleSubmit}
                  isBusy={processing}
                />
              </div>
            </div>

            <div className="test-session-side">
              {/* ── Question Palette ── */}
              <div className="dash-card fade-up delay-1" style={{ padding: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Question Status</p>
                {[
                  { label: "Answered",      count: answeredCount,                  bg: "rgba(74,222,128,0.18)",  border: "rgba(74,222,128,0.55)",  color: "#4ade80" },
                  { label: "Not Attempted", count: totalQuestions - answeredCount, bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.45)", color: "#f87171" },
                ].map(({ label, count, bg, border, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "14px", height: "14px", borderRadius: "3px", background: bg, border: `1.5px solid ${border}`, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color, fontFamily: "JetBrains Mono,monospace" }}>{count}</span>
                  </div>
                ))}
              </div>

              <div className="dash-card fade-up delay-2" style={{ padding: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Questions ({totalQuestions})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {testState.questions.map((q, i) => {
                    const isAnswered = Boolean(testState.answers[q.id]);
                    const isCurrent  = i === testState.currentQuestionIndex;
                    let bg = "rgba(248,113,113,0.14)", border = "rgba(248,113,113,0.45)", color = "#f87171";
                    if (isAnswered) { bg = "rgba(74,222,128,0.18)"; border = "rgba(74,222,128,0.55)"; color = "#4ade80"; }
                    if (isCurrent)  { bg = "rgba(20,184,166,0.22)"; border = "rgba(20,184,166,0.7)";  color = "var(--teal-300)"; }
                    return (
                      <button key={q.id} onClick={() => commitState({ ...testState, currentQuestionIndex: i })}
                        style={{ width: "36px", height: "36px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: `2px solid ${border}`, background: bg, color, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isCurrent ? `0 0 0 2px ${border}` : "none" }}>
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="dash-card fade-up delay-3" style={{ padding: "16px" }}>
                {totalQuestions - answeredCount > 0 && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
                    <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ fontSize: "11px", color: "#f87171", lineHeight: 1.5 }}>
                      {totalQuestions - answeredCount} question{totalQuestions - answeredCount > 1 ? "s" : ""} not attempted. Answer all to submit.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={isLastQuestion ? handleSubmit : handleAdvance}
                  disabled={processing}
                  className={answeredCount === totalQuestions ? "btn-teal" : "btn-outline"}
                  style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: processing ? 0.6 : 1, cursor: processing ? "not-allowed" : "pointer" }}
                >
                  {processing ? "Processing..." : answeredCount === totalQuestions ? "Submit Test" : `${totalQuestions - answeredCount} Remaining`}
                </button>
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default TakeTestSession;

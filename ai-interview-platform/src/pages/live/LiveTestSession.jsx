/* eslint-disable */
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Play, ShieldAlert, Users } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import TestQuestionPanel from "../../components/test/TestQuestionPanel";
import TermsModal from "../../components/live/TermsModal";
import ViolationWarningModal from "../../components/live/ViolationWarningModal";
import useAntiCheat from "../../hooks/useAntiCheat";
import useLiveTestSocket from "../../hooks/useLiveTestSocket";
import { useAuth } from "../../context/AuthContext";
import {
  getLiveTestSession,
  recordLiveTestWarning,
  saveLiveTestAnswers,
  startLiveTest,
  submitLiveTest,
} from "../../services/api";
import {
  clearActiveLiveTest,
  saveActiveLiveTest,
  saveLiveTestResult,
  getActiveLiveTest,
} from "../../utils/liveTestStorage";

const initialState = {
  session: null,
  currentQuestionIndex: 0,
  syncing: false,
  submitting: false,
  error: "",
  warningMessage: "",
};

const liveTestReducer = (state, action) => {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        session: action.payload.session,
        currentQuestionIndex: action.payload.currentQuestionIndex ?? state.currentQuestionIndex,
        error: "",
      };
    case "select-answer":
      return {
        ...state,
        session: {
          ...state.session,
          answers: {
            ...state.session.answers,
            [action.payload.questionId]: action.payload.optionId,
          },
        },
      };
    case "set-index":
      return {
        ...state,
        currentQuestionIndex: action.payload,
      };
    case "set-syncing":
      return {
        ...state,
        syncing: action.payload,
      };
    case "set-submitting":
      return {
        ...state,
        submitting: action.payload,
      };
    case "set-error":
      return {
        ...state,
        error: action.payload,
      };
    case "set-warning":
      return {
        ...state,
        warningMessage: action.payload,
      };
    case "update-participant":
      return {
        ...state,
        session: {
          ...state.session,
          participant: {
            ...state.session.participant,
            ...action.payload,
          },
        },
      };
    default:
      return state;
  }
};

const LiveTestSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storedSession = getActiveLiveTest();
  const [state, dispatch] = useReducer(liveTestReducer, {
    ...initialState,
    session: storedSession,
    currentQuestionIndex: storedSession?.currentQuestionIndex || 0,
  });
  const [remainingTime, setRemainingTime] = useState(null);
  const [starting, setStarting] = useState(false);
  // Anti-cheat UI state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [violationModal, setViolationModal] = useState(null); // { warnings, maxWarnings, reason }

  const dirtyAnswersRef = useRef({});
  const currentIndexRef = useRef(storedSession?.currentQuestionIndex || 0);
  const serverOffsetRef = useRef(0);
  const submitLockRef = useRef(false);

  const participantKey = useMemo(
    () =>
      state.session?.participant?.participantKey ||
      user?.email?.toLowerCase() ||
      user?.name?.toLowerCase() ||
      "",
    [state.session, user]
  );
  const currentQuestion = state.session?.questions?.[state.currentQuestionIndex] || null;
  const isWaitingRoom = state.session?.status === "waiting";
  const answeredCount = useMemo(() => {
    if (!state.session?.answers) {
      return 0;
    }

    return Object.values(state.session.answers).filter(Boolean).length;
  }, [state.session]);

  const syncClock = useCallback((sessionPayload) => {
    if (!sessionPayload?.endAt) {
      setRemainingTime(sessionPayload?.totalDurationSec || null);
      return;
    }

    serverOffsetRef.current = new Date(sessionPayload.serverNow).getTime() - Date.now();
    setRemainingTime(
      Math.max(
        0,
        Math.floor(
          (new Date(sessionPayload.endAt).getTime() - (Date.now() + serverOffsetRef.current)) / 1000
        )
      )
    );
  }, []);

  const persistSession = useCallback(
    (nextSession, currentQuestionIndex = currentIndexRef.current) => {
      const payload = {
        ...nextSession,
        currentQuestionIndex,
      };

      saveActiveLiveTest(payload);
      dispatch({
        type: "hydrate",
        payload: {
          session: nextSession,
          currentQuestionIndex,
        },
      });
    },
    []
  );

  const refreshSession = useCallback(async () => {
    if (!state.session?.testId || !state.session?.participant?.sessionToken || !participantKey) {
      return;
    }

    const response = await getLiveTestSession(state.session.testId, {
      participantKey,
      sessionToken: state.session.participant.sessionToken,
    });

    syncClock(response.data);
    persistSession(
      {
        ...response.data,
        answers: {
          ...response.data.answers,
          ...dirtyAnswersRef.current,
        },
      },
      currentIndexRef.current
    );
  }, [participantKey, persistSession, state.session?.participant?.sessionToken, state.session?.testId, syncClock]);

  const flushDirtyAnswers = useCallback(async () => {
    if (!state.session?.testId || !state.session?.participant?.sessionToken || !participantKey) {
      return;
    }

    const pendingAnswers = { ...dirtyAnswersRef.current };

    if (Object.keys(pendingAnswers).length === 0) {
      return;
    }

    dispatch({ type: "set-syncing", payload: true });

    try {
      const response = await saveLiveTestAnswers(state.session.testId, {
        participantKey,
        sessionToken: state.session.participant.sessionToken,
        answers: pendingAnswers,
      });

      dirtyAnswersRef.current = {};
      dispatch({ type: "set-error", payload: "" });
      setRemainingTime(response.data.remainingTimeSec);
    } catch (requestError) {
      dispatch({
        type: "set-error",
        payload: requestError.response?.data?.message || "Unable to save your answers right now.",
      });
    } finally {
      dispatch({ type: "set-syncing", payload: false });
    }
  }, [participantKey, state.session]);

  const handleSubmit = useCallback(async () => {
    if (isWaitingRoom) {
      dispatch({
        type: "set-error",
        payload: "The host has not started this live test yet.",
      });
      return;
    }

    if (!state.session?.testId || !state.session?.participant?.sessionToken || submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    dispatch({ type: "set-submitting", payload: true });
    dispatch({ type: "set-error", payload: "" });

    try {
      await flushDirtyAnswers();

      const response = await submitLiveTest(state.session.testId, {
        participantKey,
        sessionToken: state.session.participant.sessionToken,
      });

      saveLiveTestResult({
        testId: state.session.testId,
        title: state.session.title,
        joinCode: state.session.joinCode,
        participant: state.session.participant,
        result: response.data.result,
        leaderboard: response.data.leaderboard,
      });
      clearActiveLiveTest();
      navigate("/live-tests/leaderboard");
    } catch (requestError) {
      dispatch({
        type: "set-error",
        payload: requestError.response?.data?.message || "Unable to submit the live test.",
      });
      submitLockRef.current = false;
    } finally {
      dispatch({ type: "set-submitting", payload: false });
    }
  }, [flushDirtyAnswers, isWaitingRoom, navigate, participantKey, state.session]);

  const handleStartTest = useCallback(async () => {
    if (!state.session?.testId || !state.session?.isHost || starting) {
      return;
    }

    setStarting(true);
    dispatch({ type: "set-error", payload: "" });
    try {
      await startLiveTest(state.session.testId, {
        hostId: participantKey,
      });
      await refreshSession();
    } catch (requestError) {
      dispatch({
        type: "set-error",
        payload: requestError.response?.data?.message || "Unable to start this live test right now.",
      });
    } finally {
      setStarting(false);
    }
  }, [participantKey, refreshSession, starting, state.session]);

  useLiveTestSocket({
    testId: state.session?.testId,
    onTestStarted: useCallback(() => {
      if (state.session?.status !== "waiting") {
        return;
      }
      refreshSession().catch(() => {});
    }, [refreshSession, state.session?.status]),
  });

  useEffect(() => {
    currentIndexRef.current = state.currentQuestionIndex;
  }, [state.currentQuestionIndex]);

  useEffect(() => {
    if (!state.session) {
      navigate("/live-tests", { replace: true });
      return;
    }

    refreshSession().catch(() => {});
  }, [navigate, refreshSession, state.session?.participant?.sessionToken, state.session?.testId]);

  useEffect(() => {
    if (!state.session) {
      return;
    }

    saveActiveLiveTest({
      ...state.session,
      currentQuestionIndex: state.currentQuestionIndex,
    });
  }, [state.currentQuestionIndex, state.session]);

  useEffect(() => {
    if (!state.session?.endAt) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemainingTime(
        Math.max(
          0,
          Math.floor(
            (new Date(state.session.endAt).getTime() - (Date.now() + serverOffsetRef.current)) / 1000
          )
        )
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.session]);

  useEffect(() => {
    if (remainingTime === null || remainingTime > 0 || state.submitting || !state.session) {
      return;
    }

    handleSubmit();
  }, [handleSubmit, remainingTime, state.session, state.submitting]);

  useEffect(() => {
    if (!state.session) {
      return undefined;
    }

    const syncTimer = window.setInterval(() => {
      flushDirtyAnswers().catch(() => {});
    }, 4000);

    return () => window.clearInterval(syncTimer);
  }, [flushDirtyAnswers, state.session]);

  useEffect(() => {
    if (!state.session || !isWaitingRoom) {
      return undefined;
    }

    const waitingPollTimer = window.setInterval(() => {
      refreshSession().catch(() => {});
    }, 3000);

    return () => window.clearInterval(waitingPollTimer);
  }, [isWaitingRoom, refreshSession, state.session]);

  // ── Anti-cheat: violation handler ────────────────────────────────────────────
  const antiCheatEnabled = Boolean(state.session?.antiCheat?.enabled);
  const maxWarnings = state.session?.antiCheat?.maxWarnings ?? 3;

  const handleViolation = useCallback(
    (reason) => {
      if (!state.session?.testId || !state.session?.participant?.sessionToken || !participantKey) {
        return;
      }
      recordLiveTestWarning(state.session.testId, {
        participantKey,
        sessionToken: state.session.participant.sessionToken,
        reason,
      })
        .then((response) => {
          const { warnings, locked } = response.data;
          // Show the warning modal
          setViolationModal({ warnings, maxWarnings, reason });
          dispatch({
            type: "update-participant",
            payload: {
              warnings,
              tabSwitchCount: response.data.tabSwitchCount,
              status: locked ? "disqualified" : state.session.participant.status,
            },
          });
          if (locked) {
            handleSubmit();
          }
        })
        .catch(() => {});
    },
    [handleSubmit, maxWarnings, participantKey, state.session]
  );

  // Only activate anti-cheat once the test is live and terms are accepted
  const antiCheatActive = antiCheatEnabled && termsAccepted && !isWaitingRoom && Boolean(state.session);

  const { enterFullscreen, exitFullscreen } = useAntiCheat({
    enabled: antiCheatActive,
    onViolation: handleViolation,
  });

  // Enter fullscreen when terms are accepted and test is live
  useEffect(() => {
    if (antiCheatActive) {
      enterFullscreen();
    }
  }, [antiCheatActive, enterFullscreen]);

  // Exit fullscreen on unmount / disqualification
  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, [exitFullscreen]);

  if (!state.session) {
    return (
      <div className="app-bg min-h-screen">
        <Navbar />
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "28px 24px 40px" }}>
          <PageWrapper>
            <div className="dash-card fade-up">
              <h1 style={{ fontSize: "28px", color: "white", marginBottom: "8px" }}>
                Loading live test session...
              </h1>
            </div>
          </PageWrapper>
        </div>
      </div>
    );
  }

  if (isWaitingRoom) {
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

            <div className="test-session-shell">
              <div className="test-session-main">
                <div className="dash-card fade-up">
                  <span className="teal-badge inline-flex mb-2">
                    <Users size={12} /> WAITING ROOM
                  </span>
                  <h1 style={{ fontSize: "28px", color: "white", marginBottom: "8px" }}>{state.session.title}</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
                    Joined successfully. Share join code <strong>{state.session.joinCode}</strong>. The host will start
                    the test once everyone is ready.
                  </p>
                </div>

                {state.error ? (
                  <div className="banner-error mt-4">
                    <AlertTriangle size={14} />
                    <span>{state.error}</span>
                  </div>
                ) : null}

                <div className="dash-card fade-up delay-1 mt-4">
                  <h3 style={{ fontSize: "18px", color: "white", marginBottom: "10px" }}>Session status</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    You will automatically move to the live test as soon as the host starts it.
                  </p>
                  <div className="info-tile mt-4">
                    <div className="info-tile-label">Host</div>
                    <div className="info-tile-value">{state.session.isHost ? "You" : "Another participant"}</div>
                  </div>
                </div>
              </div>

              <div className="test-session-side">
                <div className="dash-card fade-up delay-2">
                  <h3 style={{ fontSize: "18px", color: "white", marginBottom: "12px" }}>Ready to begin</h3>
                  <div className="space-y-3">
                    <div className="info-tile">
                      <div className="info-tile-label">Questions</div>
                      <div className="info-tile-value">{state.session.questionCount || state.session.questions.length}</div>
                    </div>
                    <div className="info-tile">
                      <div className="info-tile-label">Duration</div>
                      <div className="info-tile-value">{Math.round(state.session.totalDurationSec / 60)} min</div>
                    </div>
                  </div>

                  {state.session.isHost ? (
                    <button type="button" className="btn-teal mt-4" onClick={handleStartTest} disabled={starting}>
                      <Play size={14} /> {starting ? "Starting..." : "Start Live Test"}
                    </button>
                  ) : (
                    <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "14px" }}>
                      Only the host can start this live test.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </PageWrapper>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    clearActiveLiveTest();
    return (
      <div className="app-bg min-h-screen">
        <Navbar />
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "28px 24px 40px" }}>
          <PageWrapper>
            <div className="dash-card fade-up">
              <h1 style={{ fontSize: "28px", color: "white", marginBottom: "8px" }}>
                No questions found in this live test.
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
                The live test may not have been set up correctly. Please try creating a new live test.
              </p>
              <button
                type="button"
                onClick={() => navigate("/live-tests")}
                className="btn-teal mt-4"
              >
                Back to Live Test Lobby
              </button>
            </div>
          </PageWrapper>
        </div>
      </div>
    );
  }


  return (
    <div className="app-bg min-h-screen">
      {/* ── Terms & Conditions modal (shown once before test starts) ── */}
      {antiCheatEnabled && !termsAccepted && (
        <TermsModal
          testTitle={state.session.title}
          onAccept={() => setTermsAccepted(true)}
        />
      )}

      {/* ── Per-violation warning popup ── */}
      {violationModal && (
        <ViolationWarningModal
          warnings={violationModal.warnings}
          maxWarnings={violationModal.maxWarnings}
          reason={violationModal.reason}
          onClose={() => setViolationModal(null)}
        />
      )}

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

          <div className="test-session-shell">
            <div className="test-session-main">
              <div className="dash-card fade-up">
                <div className="test-session-header">
                  <div>
                    <span className="teal-badge inline-flex mb-2">
                      <Users size={12} /> LIVE SESSION
                    </span>
                    <h1 style={{ fontSize: "28px", color: "white", marginBottom: "8px" }}>
                      {state.session.title}
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                      Join code {state.session.joinCode} · server-driven timer · answers autosave in place
                    </p>
                  </div>

                  <div className="test-mini-stat">
                    <span className="test-mini-stat-label">Progress</span>
                    <span className="test-mini-stat-value">
                      {state.currentQuestionIndex + 1}/{state.session.questions.length}
                    </span>
                  </div>
                </div>

                <div className="progress-track mt-5">
                  <div
                    className="progress-fill"
                    style={{ width: `${((state.currentQuestionIndex + 1) / state.session.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {state.error ? (
                <div className="banner-error mt-4">
                  <AlertTriangle size={14} />
                  <span>{state.error}</span>
                </div>
              ) : null}

              <div className="mt-4">
                <TestQuestionPanel
                  question={currentQuestion}
                  currentIndex={state.currentQuestionIndex}
                  total={state.session.questions.length}
                  selectedOptionId={state.session.answers[currentQuestion.id] || null}
                  remainingTime={remainingTime ?? 0}
                  answeredCount={answeredCount}
                  adaptiveEnabled={false}
                  onSelectOption={(optionId) => {
                    dirtyAnswersRef.current[currentQuestion.id] = optionId;
                    dispatch({
                      type: "select-answer",
                      payload: { questionId: currentQuestion.id, optionId },
                    });
                    saveActiveLiveTest({
                      ...state.session,
                      answers: {
                        ...state.session.answers,
                        [currentQuestion.id]: optionId,
                      },
                      currentQuestionIndex: state.currentQuestionIndex,
                    });
                  }}
                  onPrevious={() =>
                    dispatch({
                      type: "set-index",
                      payload: Math.max(state.currentQuestionIndex - 1, 0),
                    })
                  }
                  onNext={() =>
                    dispatch({
                      type: "set-index",
                      payload: Math.min(state.currentQuestionIndex + 1, state.session.questions.length - 1),
                    })
                  }
                  onSubmit={handleSubmit}
                  isBusy={state.syncing || state.submitting}
                />
              </div>
            </div>

            <div className="test-session-side">
              {/* ── Question Palette ── */}
              <div className="dash-card fade-up delay-1" style={{ padding: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Question Status</p>
                {[
                  { label: "Answered",      count: answeredCount,                                    bg: "rgba(74,222,128,0.18)",  border: "rgba(74,222,128,0.55)",  color: "#4ade80" },
                  { label: "Not Attempted", count: state.session.questions.length - answeredCount,  bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.45)", color: "#f87171" },
                ].map(({ label, count, bg, border, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "14px", height: "14px", borderRadius: "3px", background: bg, border: `1.5px solid ${border}`, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color, fontFamily: "JetBrains Mono,monospace" }}>{count}</span>
                  </div>
                ))}
                {remainingTime !== null && (
                  <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Time Left</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "JetBrains Mono,monospace", color: remainingTime < 60 ? "#f87171" : "var(--teal-400)" }}>{remainingTime}s</span>
                  </div>
                )}
              </div>

              <div className="dash-card fade-up delay-2" style={{ padding: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Questions ({state.session.questions.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {state.session.questions.map((q, i) => {
                    const isAnswered = Boolean(state.session.answers[q.id]);
                    const isCurrent  = i === state.currentQuestionIndex;
                    let bg = "rgba(248,113,113,0.14)", border = "rgba(248,113,113,0.45)", color = "#f87171";
                    if (isAnswered) { bg = "rgba(74,222,128,0.18)"; border = "rgba(74,222,128,0.55)"; color = "#4ade80"; }
                    if (isCurrent)  { bg = "rgba(20,184,166,0.22)"; border = "rgba(20,184,166,0.7)";  color = "var(--teal-300)"; }
                    return (
                      <button key={q.id}
                        onClick={() => dispatch({ type: "set-index", payload: i })}
                        style={{ width: "36px", height: "36px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: `2px solid ${border}`, background: bg, color, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isCurrent ? `0 0 0 2px ${border}` : "none" }}>
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="dash-card fade-up delay-3" style={{ padding: "16px" }}>
                {state.session.questions.length - answeredCount > 0 && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
                    <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ fontSize: "11px", color: "#f87171", lineHeight: 1.5 }}>
                      {state.session.questions.length - answeredCount} question{state.session.questions.length - answeredCount > 1 ? "s" : ""} not attempted.
                    </p>
                  </div>
                )}
                <button type="button" onClick={handleSubmit} disabled={state.submitting || state.syncing}
                  className={answeredCount === state.session.questions.length ? "btn-teal" : "btn-outline"}
                  style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: (state.submitting || state.syncing) ? 0.6 : 1 }}>
                  {state.submitting ? "Submitting..." : state.syncing ? "Syncing..." : answeredCount === state.session.questions.length ? "Submit Test" : `${state.session.questions.length - answeredCount} Remaining`}
                </button>
                {/* ── Anti-cheat warning counter ── */}
                {antiCheatEnabled && (
                  <div style={{ marginTop: "12px", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "5px" }}>
                        <ShieldAlert size={11} /> Warnings
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "JetBrains Mono,monospace", color: (state.session.participant.warnings ?? 0) > 0 ? "#fbbf24" : "var(--text-dim)" }}>
                        {state.session.participant.warnings ?? 0}/{maxWarnings}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {Array.from({ length: maxWarnings }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: "4px",
                            borderRadius: "2px",
                            background: i < (state.session.participant.warnings ?? 0) ? "#fbbf24" : "rgba(255,255,255,0.1)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default LiveTestSession;

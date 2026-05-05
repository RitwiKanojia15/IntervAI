import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Code2,
  FlaskConical,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import TestCategoryCard from "../../components/test/TestCategoryCard";
import { startTestSession } from "../../services/api";
import {
  COUNT_OPTIONS,
  createInitialRemainingTimeMap,
  DIFFICULTY_OPTIONS,
  TEST_CATEGORIES,
} from "../../utils/testHelpers";
import {
  clearSavedTestResult,
  getActiveTestSession,
  saveActiveTestSession,
} from "../../utils/testSessionStorage";

const CATEGORY_ICONS = {
  quantitative: Target,
  "logical-reasoning": Brain,
  technical: Code2,
  "spatial-reasoning": Trophy,
  "logical-puzzles": Sparkles,
  mixed: FlaskConical,
};

const TOPIC_SUGGESTIONS = {
  quantitative: ["percentages", "averages", "ratios", "time-and-work", "probability"],
  "logical-reasoning": ["series", "coding-decoding", "syllogism", "blood-relations", "seating-arrangement"],
  technical: ["c", "c++", "python", "javascript"],
  "spatial-reasoning": ["rotation", "mirror-image", "paper-folding", "cube"],
  "logical-puzzles": ["truth-and-lie", "weighing", "bridge-crossing", "clock-puzzle"],
};

const TakeTestSelection = () => {
  const navigate = useNavigate();
  const activeSession = getActiveTestSession();

  const [selectedCategory, setSelectedCategory] = useState("quantitative");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [topic, setTopic] = useState("");
  const [skills, setSkills] = useState("");
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeCategoryConfig = useMemo(
    () => TEST_CATEGORIES.find((category) => category.key === selectedCategory),
    [selectedCategory]
  );

  const categoryTopics = TOPIC_SUGGESTIONS[selectedCategory] || [];
  const isMixedMode = selectedCategory === "mixed";

  const handleCategoryChange = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setTopic("");
    setError("");

    if (categoryKey === "mixed") {
      setSelectedDifficulty("");
      setAdaptiveEnabled(false);
      setQuestionCount(15);
    } else if (!adaptiveEnabled) {
      setAdaptiveEnabled(true);
    }
  };

  const handleStartTest = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        category: selectedCategory,
        count: isMixedMode ? 15 : questionCount,
      };

      if (!isMixedMode && topic.trim()) {
        params.topic = topic.trim();
      }

      if (!isMixedMode && selectedDifficulty) {
        params.difficulty = selectedDifficulty;
      }

      if (!isMixedMode && adaptiveEnabled && !selectedDifficulty) {
        params.adaptive = true;
      }

      if (!isMixedMode && skills.trim()) {
        params.skills = skills.trim();
      }

      const response = await startTestSession(params);
      const payload = response.data;
      const nextSession = {
        ...payload,
        currentQuestionIndex: 0,
        answers: {},
        remainingTimeByQuestionId: createInitialRemainingTimeMap(payload.questions),
        reviewByQuestionId: {},
        startedAt: new Date().toISOString(),
      };

      clearSavedTestResult();
      saveActiveTestSession(nextSession);
      navigate("/take-test/session");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to start the test. Please try again.");
    } finally {
      setLoading(false);
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
                  <FlaskConical size={12} /> TAKE TEST
                </span>
                <h1 style={{ fontSize: "30px", color: "white", marginBottom: "8px" }}>
                  Choose your test track
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.65 }}>
                  Start a focused aptitude test in quantitative, logical reasoning, technical,
                  spatial reasoning, or logical puzzles. Mixed mode blends the core screening rounds.
                </p>
              </div>

              <div className="test-category-grid fade-up delay-1">
                {TEST_CATEGORIES.map((category) => (
                  <TestCategoryCard
                    key={category.key}
                    icon={CATEGORY_ICONS[category.key]}
                    category={category}
                    isSelected={selectedCategory === category.key}
                    onSelect={handleCategoryChange}
                  />
                ))}
              </div>

              <div className="dash-card fade-up delay-2">
                <div className="test-panel-header">
                  <div>
                    <h2 style={{ fontSize: "20px", color: "white", marginBottom: "6px" }}>
                      Configure your attempt
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                      Fine-tune difficulty, topic, count, and optional resume-skills matching before you start.
                    </p>
                  </div>
                  <div className="test-mini-stat">
                    <span className="test-mini-stat-label">Mode</span>
                    <span className="test-mini-stat-value">{activeCategoryConfig?.label}</span>
                  </div>
                </div>

                <div className="test-config-grid">
                  <div>
                    <p className="test-config-label">Difficulty</p>
                    <div className="test-pill-row">
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          className={`test-filter-pill ${selectedDifficulty === option.key ? "active" : ""}`}
                          onClick={() => setSelectedDifficulty(option.key)}
                          disabled={isMixedMode}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="test-config-label">Question Count</p>
                    <div className="test-pill-row">
                      {COUNT_OPTIONS.map((count) => (
                        <button
                          key={count}
                          type="button"
                          className={`test-filter-pill ${questionCount === count ? "active" : ""}`}
                          onClick={() => setQuestionCount(count)}
                          disabled={isMixedMode}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                    {isMixedMode ? (
                      <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
                        Mixed mode is fixed to 15 questions right now.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <p className="test-config-label">Topic Filter</p>
                    <input
                      className="dark-input"
                      placeholder={isMixedMode ? "Topic filter disabled for mixed mode" : "Optional topic, e.g. javascript"}
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      disabled={isMixedMode}
                    />
                    {!isMixedMode && categoryTopics.length > 0 ? (
                      <div className="test-pill-row compact">
                        {categoryTopics.map((suggestedTopic) => (
                          <button
                            key={suggestedTopic}
                            type="button"
                            className={`test-filter-pill compact ${topic === suggestedTopic ? "active" : ""}`}
                            onClick={() => setTopic(suggestedTopic)}
                          >
                            {suggestedTopic}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className="test-config-label">Resume Skills Match</p>
                    <input
                      className="dark-input"
                      placeholder="Optional comma-separated skills, e.g. python, javascript"
                      value={skills}
                      onChange={(event) => setSkills(event.target.value)}
                      disabled={isMixedMode}
                    />
                  </div>
                </div>

                <div className="test-toggle-row">
                  <div>
                    <p style={{ color: "white", fontWeight: 700, marginBottom: "4px" }}>Adaptive difficulty</p>
                    <p style={{ color: "var(--text-dim)", fontSize: "12px" }}>
                      When enabled, correct answers prioritize harder upcoming questions and wrong answers prioritize easier ones.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`toggle-sw ${adaptiveEnabled ? "on" : ""}`}
                    onClick={() => !isMixedMode && setAdaptiveEnabled((current) => !current)}
                    disabled={isMixedMode}
                    aria-label="Toggle adaptive difficulty"
                  />
                </div>

                {error ? (
                  <div className="banner-error mt-4">
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="test-panel-footer">
                  <div className="test-mini-stat">
                    <span className="test-mini-stat-label">Expected Flow</span>
                    <span className="test-mini-stat-value">
                      {isMixedMode ? "Mixed screening round" : `${questionCount} timed MCQs`}
                    </span>
                  </div>

                  <button type="button" className="btn-teal" onClick={handleStartTest} disabled={loading}>
                    {loading ? "Loading test..." : "Start Test"} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="test-layout-side">
              <div className="dash-card fade-up delay-1">
                <h3 style={{ fontSize: "18px", color: "white", marginBottom: "10px" }}>
                  Test blueprint
                </h3>
                <div className="space-y-3">
                  <div className="info-tile">
                    <div className="info-tile-label">Selected Category</div>
                    <div className="info-tile-value">{activeCategoryConfig?.label}</div>
                  </div>
                  <div className="info-tile">
                    <div className="info-tile-label">Difficulty Setting</div>
                    <div className="info-tile-value">
                      {isMixedMode ? "Mixed difficulty set" : selectedDifficulty || "Adaptive"}
                    </div>
                  </div>
                  <div className="info-tile">
                    <div className="info-tile-label">Timer Rule</div>
                    <div className="info-tile-value">Each question runs on its own timer.</div>
                  </div>
                </div>
              </div>

              {activeSession ? (
                <div className="dash-card fade-up delay-2">
                  <h3 style={{ fontSize: "18px", color: "white", marginBottom: "8px" }}>
                    Resume active test
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.6, marginBottom: "14px" }}>
                    You already have an unfinished test session saved in this browser. You can jump back into it anytime.
                  </p>
                  <button type="button" className="btn-outline" onClick={() => navigate("/take-test/session")}>
                    Continue Attempt
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

export default TakeTestSelection;

import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, RotateCcw, Trophy } from "lucide-react";
import Navbar from "../../components/Navbar";
import PageWrapper from "../../components/PageWrapper";
import { getAccuracyPercentage } from "../../utils/testHelpers";
import { clearSavedTestResult, getSavedTestResult } from "../../utils/testSessionStorage";

const TakeTestResults = () => {
  const navigate = useNavigate();
  const result = getSavedTestResult();

  const accuracy = useMemo(
    () => getAccuracyPercentage(result?.correct || 0, result?.total || 0),
    [result]
  );

  useEffect(() => {
    if (!result) {
      navigate("/take-test", { replace: true });
    }
  }, [navigate, result]);

  if (!result) {
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
            <ArrowLeft size={15} /> Back to test selection
          </button>

          <div className="dash-card fade-up">
            <div className="test-results-hero">
              <div>
                <span className="teal-badge inline-flex mb-3">
                  <Trophy size={12} /> TEST RESULT
                </span>
                <h1 style={{ fontSize: "30px", color: "white", marginBottom: "8px" }}>
                  Your attempt is complete
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
                  Review your score, correct answers, and explanations before you jump into the next round.
                </p>
              </div>

              <div className="test-score-orb">
                <span className="test-score-orb-label">Accuracy</span>
                <span className="test-score-orb-value">{accuracy}%</span>
              </div>
            </div>

            <div className="test-results-stats">
              <div className="info-tile">
                <div className="info-tile-label">Score</div>
                <div className="info-tile-value">{result.score}</div>
              </div>
              <div className="info-tile">
                <div className="info-tile-label">Correct</div>
                <div className="info-tile-value">{result.correct}</div>
              </div>
              <div className="info-tile">
                <div className="info-tile-label">Wrong</div>
                <div className="info-tile-value">{result.wrong}</div>
              </div>
              <div className="info-tile">
                <div className="info-tile-label">Total</div>
                <div className="info-tile-value">{result.total}</div>
              </div>
            </div>

            <div className="test-results-actions">
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  clearSavedTestResult();
                  navigate("/dashboard");
                }}
              >
                <CheckCircle2 size={14} /> Dashboard
              </button>
              <button
                type="button"
                className="btn-teal"
                onClick={() => {
                  clearSavedTestResult();
                  navigate("/take-test");
                }}
              >
                <RotateCcw size={14} /> Take Another Test
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {result.feedback.map((item, index) => {
              const selectedOption = item.options.find((option) => option.id === item.selectedOptionId);
              const correctOption = item.options.find((option) => option.id === item.correctOptionId);

              return (
                <div key={item.questionId} className="result-list-card fade-up">
                  <div className="result-list-top">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--teal-400)" }}>
                        Question {index + 1}
                      </p>
                      <h3 style={{ color: "white", fontSize: "18px", marginTop: "6px" }}>{item.question}</h3>
                    </div>
                    <span className={`skill-tag ${item.isCorrect ? "strong" : "weak"}`}>
                      {item.isCorrect ? "Correct" : "Wrong"}
                    </span>
                  </div>

                  <div className="test-review-grid">
                    <div className="info-tile">
                      <div className="info-tile-label">Your Answer</div>
                      <div className="info-tile-value">
                        {selectedOption ? `${selectedOption.id}. ${selectedOption.text}` : "Unanswered"}
                      </div>
                    </div>
                    <div className="info-tile">
                      <div className="info-tile-label">Correct Answer</div>
                      <div className="info-tile-value">
                        {correctOption ? `${correctOption.id}. ${correctOption.text}` : item.correctOptionId}
                      </div>
                    </div>
                  </div>

                  <div className="question-text-block mt-4">
                    <p className="text-sm leading-relaxed text-white">{item.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default TakeTestResults;

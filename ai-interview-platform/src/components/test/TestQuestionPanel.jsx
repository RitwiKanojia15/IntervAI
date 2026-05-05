import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Sparkles } from "lucide-react";

const TestQuestionPanel = ({
  question,
  currentIndex,
  total,
  selectedOptionId,
  remainingTime,
  answeredCount,
  adaptiveEnabled,
  onSelectOption,
  onPrevious,
  onNext,
  onSubmit,
  isBusy,
}) => (
  <div className="question-card fade-up">
    <div className="test-question-top">
      <div className="flex items-center gap-3">
        <div className="q-number">Q{currentIndex + 1}</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--teal-400)" }}>
            Question {currentIndex + 1} of {total}
          </p>
          <p className="text-xs mt-1 flex items-center gap-2" style={{ color: "var(--text-dim)" }}>
            <Clock size={12} /> {question.categoryLabel} · {question.topic}
          </p>
        </div>
      </div>

      <div className="timer-chip">
        <Clock size={13} />
        {remainingTime}s
      </div>
    </div>

    <div className="test-question-meta">
      <span className={`diff-badge diff-${question.difficulty}`}>{question.difficulty}</span>
      <span className="skill-tag neutral">{question.marks} mark{question.marks > 1 ? "s" : ""}</span>
      <span className="skill-tag neutral">{answeredCount}/{total} answered</span>
      {adaptiveEnabled ? (
        <span className="skill-tag strong">
          <Sparkles size={11} /> Adaptive
        </span>
      ) : null}
    </div>

    <div className="question-text-block mb-5">
      <p className="text-base font-semibold leading-relaxed text-white">{question.question}</p>
    </div>

    <div className="test-options-grid">
      {question.options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`test-option-btn ${selectedOptionId === option.id ? "selected" : ""}`}
          onClick={() => onSelectOption(option.id)}
        >
          <span className="test-option-pill">{option.id}</span>
          <span>{option.text}</span>
        </button>
      ))}
    </div>

    <div className="test-actions-row">
      <button
        type="button"
        className="btn-outline"
        onClick={onPrevious}
        disabled={currentIndex === 0 || isBusy}
        style={{ opacity: currentIndex === 0 || isBusy ? 0.55 : 1 }}
      >
        <ArrowLeft size={14} /> Previous
      </button>

      {currentIndex === total - 1 ? (
        <button type="button" className="btn-teal" onClick={onSubmit} disabled={isBusy}>
          <CheckCircle2 size={14} /> {isBusy ? "Submitting..." : "Submit Test"}
        </button>
      ) : (
        <button type="button" className="btn-teal" onClick={onNext} disabled={isBusy}>
          <ArrowRight size={14} /> {isBusy ? "Saving..." : "Next Question"}
        </button>
      )}
    </div>
  </div>
);

export default TestQuestionPanel;

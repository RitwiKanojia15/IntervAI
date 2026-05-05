import React, { useState } from "react";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Send, AlertCircle, Bookmark, Eye, RotateCcw } from "lucide-react";

const PALETTE_COLORS = {
  answered:    { bg: "rgba(74,222,128,0.18)",  border: "rgba(74,222,128,0.55)",  color: "#4ade80" },
  remarked:    { bg: "rgba(96,165,250,0.18)",  border: "rgba(96,165,250,0.55)",  color: "#60a5fa" },
  unattempted: { bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.45)", color: "#f87171" },
  current:     { bg: "rgba(20,184,166,0.22)",  border: "rgba(20,184,166,0.7)",   color: "var(--teal-300)" },
  correct:     { bg: "rgba(74,222,128,0.18)",  border: "rgba(74,222,128,0.55)",  color: "#4ade80" },
  wrong:       { bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.45)", color: "#f87171" },
};

// ── Post-submit full review panel ─────────────────────────────────────────────
const ReviewPanel = ({ questions, answers, results, onClose }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 700, color: "white" }}>Answer Review</h2>
      <button onClick={onClose} className="btn-outline"
        style={{ padding: "7px 16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
        <RotateCcw size={13} /> Back to Summary
      </button>
    </div>

    {/* Score banner */}
    {results && (
      <div style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p style={{ fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>SCORE</p>
          <p style={{ fontSize: "18px", fontWeight: 800, color: "white" }}>{results.percentage}%</p>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#4ade80" }}>{results.score}</p>
            <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>Correct</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#f87171" }}>{results.total - results.score}</p>
            <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>Wrong</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "white" }}>{results.total}</p>
            <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>Total</p>
          </div>
        </div>
      </div>
    )}

    {/* Per-question review */}
    {questions.map((q, i) => {
      const res = results?.answers?.find((a) => a.questionId === String(q._id));
      const isCorrect = res?.isCorrect;
      const yourAns   = q.options.find((o) => o.id === res?.selectedOptionId);
      const correctAns = q.options.find((o) => o.id === res?.correctOptionId);

      return (
        <div key={q._id} className="dash-card" style={{ padding: "20px", borderColor: isCorrect ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "28px", height: "28px", borderRadius: "7px", background: isCorrect ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isCorrect
                  ? <CheckCircle2 size={15} style={{ color: "#4ade80" }} />
                  : <XCircle size={15} style={{ color: "#f87171" }} />}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)" }}>Q{i + 1}</span>
              <span className={`diff-badge diff-${q.difficulty || "medium"}`}>{q.difficulty || "medium"}</span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: isCorrect ? "#4ade80" : "#f87171" }}>
              {isCorrect ? "Correct" : "Wrong"}
            </span>
          </div>

          <p style={{ fontSize: "14px", fontWeight: 600, color: "white", lineHeight: 1.6, marginBottom: "14px" }}>{q.sentence}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            {q.options.map((opt) => {
              const isOpt = opt.id === res?.correctOptionId;
              const isSel = opt.id === res?.selectedOptionId;
              let bg = "rgba(255,255,255,0.02)", bc = "var(--border-soft)", col = "var(--text-dim)";
              if (isOpt)              { bg = "rgba(74,222,128,0.12)";  bc = "rgba(74,222,128,0.4)";  col = "#4ade80"; }
              if (isSel && !isOpt)    { bg = "rgba(248,113,113,0.12)"; bc = "rgba(248,113,113,0.4)"; col = "#f87171"; }
              return (
                <div key={opt.id} style={{ padding: "10px 14px", borderRadius: "9px", background: bg, border: `1px solid ${bc}`, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0, color: col }}>{opt.id}</span>
                  <span style={{ fontSize: "13px", color: col }}>{opt.text}</span>
                  {isOpt && <CheckCircle2 size={13} style={{ color: "#4ade80", marginLeft: "auto", flexShrink: 0 }} />}
                  {isSel && !isOpt && <XCircle size={13} style={{ color: "#f87171", marginLeft: "auto", flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "16px", fontSize: "12px", marginBottom: res?.explanation ? "10px" : 0 }}>
            <span style={{ color: "var(--text-dim)" }}>Your answer: <strong style={{ color: yourAns ? (isCorrect ? "#4ade80" : "#f87171") : "var(--text-dim)" }}>{yourAns ? `${yourAns.id}. ${yourAns.text}` : "Not answered"}</strong></span>
            {!isCorrect && correctAns && (
              <span style={{ color: "var(--text-dim)" }}>Correct: <strong style={{ color: "#4ade80" }}>{correctAns.id}. {correctAns.text}</strong></span>
            )}
          </div>

          {res?.explanation && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.18)" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--teal-400)" }}>Explanation: </strong>{res.explanation}
              </p>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ── Palette ───────────────────────────────────────────────────────────────────
const QuestionPalette = ({ questions, current, answers, remarked, onJump, onSubmit, submitted, results, reviewing, onReview }) => {
  const total        = questions.length;
  const answeredCount = Object.keys(answers).length;
  const remarkedCount = remarked.size;
  const unattempted   = total - answeredCount;
  const allDone       = answeredCount === total;

  const getStyle = (i) => {
    const qId = questions[i]._id;
    const isCurrent  = i === current;
    const isAnswered = !!answers[qId];
    const isRemarked = remarked.has(i);

    let c = PALETTE_COLORS.unattempted;
    if (submitted) {
      const res = results?.answers?.find((a) => a.questionId === String(qId));
      c = res?.isCorrect ? PALETTE_COLORS.correct : PALETTE_COLORS.wrong;
    } else {
      if (isAnswered) c = PALETTE_COLORS.answered;
      if (isRemarked) c = PALETTE_COLORS.remarked;
    }
    if (isCurrent && !reviewing) c = PALETTE_COLORS.current;

    return { width: "36px", height: "36px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: `2px solid ${c.border}`, background: c.bg, color: c.color, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: (isCurrent && !reviewing) ? `0 0 0 2px ${c.border}` : "none" };
  };

  return (
    <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Legend */}
      <div className="dash-card" style={{ padding: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          {submitted ? "Result Status" : "Question Status"}
        </p>
        {submitted ? (
          <>
            {[
              { label: "Correct",  count: results?.score || 0,                    ...PALETTE_COLORS.correct },
              { label: "Wrong",    count: (results?.total || 0) - (results?.score || 0), ...PALETTE_COLORS.wrong },
            ].map(({ label, count, bg, border, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "14px", height: "14px", borderRadius: "3px", background: bg, border: `1.5px solid ${border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color, fontFamily: "JetBrains Mono,monospace" }}>{count}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { label: "Answered",      count: answeredCount, ...PALETTE_COLORS.answered },
              { label: "Remarked",      count: remarkedCount, ...PALETTE_COLORS.remarked },
              { label: "Not Attempted", count: unattempted,   ...PALETTE_COLORS.unattempted },
            ].map(({ label, count, bg, border, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "14px", height: "14px", borderRadius: "3px", background: bg, border: `1.5px solid ${border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color, fontFamily: "JetBrains Mono,monospace" }}>{count}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Grid */}
      <div className="dash-card" style={{ padding: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Questions ({total})</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {questions.map((_, i) => (
            <button key={i} onClick={() => !reviewing && onJump(i)} style={getStyle(i)}>{i + 1}</button>
          ))}
        </div>
      </div>

      {/* Submit / Review */}
      {!submitted ? (
        <div className="dash-card" style={{ padding: "16px" }}>
          {!allDone && (
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
              <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "11px", color: "#f87171", lineHeight: 1.5 }}>
                {unattempted} question{unattempted > 1 ? "s" : ""} not attempted. Answer all to submit.
              </p>
            </div>
          )}
          <button onClick={onSubmit} disabled={!allDone} className={allDone ? "btn-teal" : "btn-outline"}
            style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: allDone ? 1 : 0.5, cursor: allDone ? "pointer" : "not-allowed" }}>
            <Send size={14} /> {allDone ? "Submit Test" : `${unattempted} Remaining`}
          </button>
        </div>
      ) : (
        <div className="dash-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", textAlign: "center" }}>
            <p style={{ fontSize: "26px", fontWeight: 800, color: "white", fontFamily: "Syne,sans-serif" }}>{results?.percentage}%</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{results?.score}/{results?.total} correct</p>
          </div>
          <button onClick={onReview} className="btn-teal"
            style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            <Eye size={14} /> Review Answers
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const GrammarSection = ({ questions, onSubmit, submitted, results }) => {
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [remarked,  setRemarked]  = useState(new Set());
  const [reviewing, setReviewing] = useState(false);

  const q     = questions[current];
  const total = questions.length;

  const select = (qId, optId) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const toggleRemark = () => {
    if (submitted) return;
    setRemarked((prev) => { const n = new Set(prev); n.has(current) ? n.delete(current) : n.add(current); return n; });
  };

  const handleSubmit = () => {
    onSubmit(questions.map((q, i) => ({ questionId: String(q._id), index: i, selectedOptionId: answers[q._id] || null })));
  };

  const getOptionStyle = (qId, optId) => {
    const base = { width: "100%", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: submitted ? "default" : "pointer", display: "flex", alignItems: "center", gap: "10px", textAlign: "left", transition: "all 0.18s", border: "1px solid" };
    if (!submitted) {
      const sel = answers[qId] === optId;
      return { ...base, background: sel ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.03)", borderColor: sel ? "rgba(20,184,166,0.5)" : "var(--border-soft)", color: sel ? "var(--teal-300)" : "var(--text-muted)" };
    }
    const res = results?.answers?.find((a) => a.questionId === String(qId));
    const isCorrect  = res?.correctOptionId === optId;
    const isSelected = res?.selectedOptionId === optId;
    if (isCorrect)               return { ...base, background: "rgba(74,222,128,0.12)",  borderColor: "rgba(74,222,128,0.4)",  color: "#4ade80" };
    if (isSelected && !isCorrect) return { ...base, background: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.4)", color: "var(--danger-400)" };
    return { ...base, background: "rgba(255,255,255,0.02)", borderColor: "var(--border-soft)", color: "var(--text-dim)" };
  };

  if (!q) return null;

  // ── Review mode ──
  if (reviewing) {
    return (
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ReviewPanel questions={questions} answers={answers} results={results} onClose={() => setReviewing(false)} />
        </div>
        <QuestionPalette questions={questions} current={current} answers={answers} remarked={remarked}
          onJump={setCurrent} onSubmit={handleSubmit} submitted={submitted} results={results}
          reviewing={reviewing} onReview={() => setReviewing(true)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      {/* Left */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Question {current + 1} of {total}</span>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{Object.keys(answers).length}/{total} answered</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>

        <div className="dash-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={`diff-badge diff-${q.difficulty || "medium"}`}>{q.difficulty || "medium"}</span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Grammar · Spot the Error</span>
            </div>
            {!submitted && (
              <button onClick={toggleRemark}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                  background: remarked.has(current) ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.04)",
                  borderColor: remarked.has(current) ? "rgba(96,165,250,0.5)" : "var(--border-soft)",
                  color: remarked.has(current) ? "#60a5fa" : "var(--text-dim)" }}>
                <Bookmark size={13} fill={remarked.has(current) ? "#60a5fa" : "none"} />
                {remarked.has(current) ? "Remarked" : "Remark"}
              </button>
            )}
          </div>

          <p style={{ fontSize: "16px", fontWeight: 600, color: "white", lineHeight: 1.6, marginBottom: "24px" }}>{q.sentence}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {q.options.map((opt) => (
              <button key={opt.id} onClick={() => select(q._id, opt.id)} style={getOptionStyle(q._id, opt.id)}>
                <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{opt.id}</span>
                {opt.text}
              </button>
            ))}
          </div>

          {submitted && (() => {
            const res = results?.answers?.find((a) => a.questionId === String(q._id));
            return res?.explanation ? (
              <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "10px", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--teal-400)" }}>Explanation: </strong>{res.explanation}
                </p>
              </div>
            ) : null;
          })()}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="btn-outline"
            style={{ padding: "9px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", opacity: current === 0 ? 0.4 : 1 }}>
            <ChevronLeft size={14} /> Previous
          </button>
          {submitted ? (
            <button onClick={() => setReviewing(true)} className="btn-teal"
              style={{ padding: "9px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
              <Eye size={14} /> Review All Answers
            </button>
          ) : (
            <button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} disabled={current === total - 1} className="btn-outline"
              style={{ padding: "9px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", opacity: current === total - 1 ? 0.4 : 1 }}>
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right */}
      <QuestionPalette questions={questions} current={current} answers={answers} remarked={remarked}
        onJump={setCurrent} onSubmit={handleSubmit} submitted={submitted} results={results}
        reviewing={reviewing} onReview={() => setReviewing(true)} />
    </div>
  );
};

export default GrammarSection;

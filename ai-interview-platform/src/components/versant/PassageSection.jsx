/* eslint-disable */
import React, { useState, useRef } from "react";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Send, CheckCircle2, XCircle, BookOpen, Headphones, AlertCircle, Bookmark, Eye, RotateCcw } from "lucide-react";

const PALETTE_COLORS = {
  answered:    { bg: "rgba(74,222,128,0.18)",  border: "rgba(74,222,128,0.55)",  color: "#4ade80" },
  remarked:    { bg: "rgba(96,165,250,0.18)",  border: "rgba(96,165,250,0.55)",  color: "#60a5fa" },
  unattempted: { bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.45)", color: "#f87171" },
  current:     { bg: "rgba(20,184,166,0.22)",  border: "rgba(20,184,166,0.7)",   color: "var(--teal-300)" },
  correct:     { bg: "rgba(74,222,128,0.18)",  border: "rgba(74,222,128,0.55)",  color: "#4ade80" },
  wrong:       { bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.45)", color: "#f87171" },
};

// Build a flat list of all questions across all passages for the palette
const buildFlatList = (passages) => {
  const flat = [];
  passages.forEach((p, pi) => {
    (p.questions || []).forEach((q, qi) => {
      flat.push({ passageIdx: pi, questionIdx: qi, passageTitle: p.title, label: `P${pi + 1}Q${qi + 1}` });
    });
  });
  return flat;
};

// ── Post-submit full review panel ─────────────────────────────────────────────
const ReviewPanel = ({ passages, answers, results, onClose }) => {
  const correctCount = results?.score || 0;
  const total        = results?.total || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 700, color: "white" }}>Answer Review</h2>
        <button onClick={onClose} className="btn-outline"
          style={{ padding: "7px 16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <RotateCcw size={13} /> Back to Summary
        </button>
      </div>

      {/* Score banner */}
      <div style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p style={{ fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>SCORE</p>
          <p style={{ fontSize: "18px", fontWeight: 800, color: "white" }}>{results?.percentage}%</p>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {[{ label: "Correct", val: correctCount, color: "#4ade80" }, { label: "Wrong", val: total - correctCount, color: "#f87171" }, { label: "Total", val: total, color: "white" }].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: 800, color }}>{val}</p>
              <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-passage review */}
      {passages.map((p, pi) => (
        <div key={pi}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--border-soft)" }}>
            <BookOpen size={15} style={{ color: "var(--teal-400)" }} />
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "white" }}>{p.title}</h3>
            <span className={`diff-badge diff-${p.difficulty}`}>{p.difficulty}</span>
          </div>

          {p.questions.map((q, qi) => {
            const key = `${pi}-${qi}`;
            const res = results?.answers?.find((a) => a.questionId === String(p._id) && a.index === qi);
            const isCorrect  = res?.isCorrect;
            const yourAns    = q.options.find((o) => o.id === res?.selectedOptionId);
            const correctAns = q.options.find((o) => o.id === res?.correctOptionId);

            return (
              <div key={qi} className="dash-card" style={{ padding: "18px", marginBottom: "10px", borderColor: isCorrect ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: isCorrect ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isCorrect ? <CheckCircle2 size={14} style={{ color: "#4ade80" }} /> : <XCircle size={14} style={{ color: "#f87171" }} />}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)" }}>Q{qi + 1}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: isCorrect ? "#4ade80" : "#f87171", marginLeft: "auto" }}>{isCorrect ? "Correct" : "Wrong"}</span>
                </div>

                <p style={{ fontSize: "14px", fontWeight: 600, color: "white", lineHeight: 1.5, marginBottom: "12px" }}>{q.question}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                  {q.options.map((opt) => {
                    const isOpt = opt.id === res?.correctOptionId;
                    const isSel = opt.id === res?.selectedOptionId;
                    let bg = "rgba(255,255,255,0.02)", bc = "var(--border-soft)", col = "var(--text-dim)";
                    if (isOpt)           { bg = "rgba(74,222,128,0.12)";  bc = "rgba(74,222,128,0.4)";  col = "#4ade80"; }
                    if (isSel && !isOpt) { bg = "rgba(248,113,113,0.12)"; bc = "rgba(248,113,113,0.4)"; col = "#f87171"; }
                    return (
                      <div key={opt.id} style={{ padding: "9px 14px", borderRadius: "8px", background: bg, border: `1px solid ${bc}`, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0, color: col }}>{opt.id}</span>
                        <span style={{ fontSize: "13px", color: col }}>{opt.text}</span>
                        {isOpt && <CheckCircle2 size={12} style={{ color: "#4ade80", marginLeft: "auto", flexShrink: 0 }} />}
                        {isSel && !isOpt && <XCircle size={12} style={{ color: "#f87171", marginLeft: "auto", flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <span>Your answer: <strong style={{ color: yourAns ? (isCorrect ? "#4ade80" : "#f87171") : "var(--text-dim)" }}>{yourAns ? `${yourAns.id}. ${yourAns.text}` : "Not answered"}</strong></span>
                  {!isCorrect && correctAns && <span>Correct: <strong style={{ color: "#4ade80" }}>{correctAns.id}. {correctAns.text}</strong></span>}
                </div>

                {res?.explanation && (
                  <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "8px", background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.18)" }}>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--teal-400)" }}>Explanation: </strong>{res.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const QuestionPalette = ({ flat, currentKey, answers, remarked, onJump, onSubmit, submitted, results, totalQuestions, reviewing, onReview }) => {
  const answeredCount  = Object.keys(answers).length;
  const remarkedCount  = remarked.size;
  const unattempted    = totalQuestions - answeredCount;
  const allDone        = answeredCount === totalQuestions;

  const getStyle = (item) => {
    const key   = `${item.passageIdx}-${item.questionIdx}`;
    const isCur = key === currentKey && !reviewing;
    const isAns = !!answers[key];
    const isRem = remarked.has(key);

    let c = PALETTE_COLORS.unattempted;
    if (submitted) {
      const res = results?.answers?.find((a) => a.questionId === item.passageId && a.index === item.questionIdx);
      c = res?.isCorrect ? PALETTE_COLORS.correct : PALETTE_COLORS.wrong;
    } else {
      if (isAns) c = PALETTE_COLORS.answered;
      if (isRem) c = PALETTE_COLORS.remarked;
    }
    if (isCur) c = PALETTE_COLORS.current;

    return { width: "36px", height: "36px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, cursor: "pointer", border: `2px solid ${c.border}`, background: c.bg, color: c.color, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isCur ? `0 0 0 2px ${c.border}` : "none" };
  };

  const byPassage = flat.reduce((acc, item) => {
    if (!acc[item.passageIdx]) acc[item.passageIdx] = { title: item.passageTitle, items: [] };
    acc[item.passageIdx].items.push(item);
    return acc;
  }, {});

  return (
    <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Legend */}
      <div className="dash-card" style={{ padding: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Question Status</p>
        {submitted ? (
          <>
            {[
              { label: "Correct",  count: results?.score || 0,                         ...PALETTE_COLORS.correct },
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

      {/* Grid grouped by passage */}
      <div className="dash-card" style={{ padding: "16px", maxHeight: "340px", overflowY: "auto" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          All Questions ({totalQuestions})
        </p>
        {Object.entries(byPassage).map(([pi, group]) => (
          <div key={pi} style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "6px", fontWeight: 600 }}>
              Passage {parseInt(pi) + 1}: {group.title}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {group.items.map((item) => (
                <button key={`${item.passageIdx}-${item.questionIdx}`}
                  onClick={() => onJump(item.passageIdx, item.questionIdx)}
                  style={getStyle(item)}
                  title={item.label}>
                  {item.questionIdx + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      {!submitted && (
        <div className="dash-card" style={{ padding: "16px" }}>
          {!allDone && (
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
              <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "11px", color: "#f87171", lineHeight: 1.5 }}>
                {unattempted} question{unattempted > 1 ? "s" : ""} remaining.
              </p>
            </div>
          )}
          <button onClick={onSubmit} disabled={!allDone}
            className={allDone ? "btn-teal" : "btn-outline"}
            style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: allDone ? 1 : 0.5, cursor: allDone ? "pointer" : "not-allowed" }}>
            <Send size={14} /> {allDone ? "Submit Test" : `${unattempted} Remaining`}
          </button>
        </div>
      )}

      {submitted && results && (
        <div className="dash-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", textAlign: "center" }}>
            <p style={{ fontSize: "26px", fontWeight: 800, color: "white", fontFamily: "Syne,sans-serif" }}>{results.percentage}%</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{results.score}/{results.total} correct</p>
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

// ── Main Component ────────────────────────────────────────────────────────────

const PassageSection = ({ passages, mode, onSubmit, submitted, results }) => {
  const [passageIdx,  setPassageIdx]  = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [remarked,    setRemarked]    = useState(new Set());
  const [playing,     setPlaying]     = useState(false);
  const [reviewing,   setReviewing]   = useState(false);
  const synthRef = useRef(null);

  const passage    = passages[passageIdx];
  const isListening = mode === "listening";
  const flat        = buildFlatList(passages).map((f) => ({ ...f, passageId: String(passages[f.passageIdx]._id) }));
  const totalQ      = flat.length;
  const currentKey  = `${passageIdx}-${questionIdx}`;
  const currentQ    = passage?.questions?.[questionIdx];

  const playTTS = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9; utt.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((v) => v.lang === "en-GB") || voices.find((v) => v.lang.startsWith("en"));
    if (v) utt.voice = v;
    utt.onstart = () => setPlaying(true);
    utt.onend   = () => setPlaying(false);
    utt.onerror = () => setPlaying(false);
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  };

  const stopTTS = () => { window.speechSynthesis?.cancel(); setPlaying(false); };

  const select = (optId) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentKey]: optId }));
  };

  const toggleRemark = () => {
    if (submitted) return;
    setRemarked((prev) => {
      const next = new Set(prev);
      next.has(currentKey) ? next.delete(currentKey) : next.add(currentKey);
      return next;
    });
  };

  const jumpTo = (pi, qi) => { setPassageIdx(pi); setQuestionIdx(qi); };

  const handleSubmit = () => {
    const payload = passages.map((p, pi) =>
      p.questions.map((_, qi) => ({
        questionId: String(p._id),
        index: qi,
        selectedOptionId: answers[`${pi}-${qi}`] || null,
      }))
    ).flat();
    onSubmit(payload);
  };

  // Prev / Next across all passages
  const flatIdx = flat.findIndex((f) => f.passageIdx === passageIdx && f.questionIdx === questionIdx);
  const goPrev  = () => { if (flatIdx > 0) { const f = flat[flatIdx - 1]; jumpTo(f.passageIdx, f.questionIdx); } };
  const goNext  = () => { if (flatIdx < flat.length - 1) { const f = flat[flatIdx + 1]; jumpTo(f.passageIdx, f.questionIdx); } };

  const getOptStyle = (optId) => {
    const base = { width: "100%", padding: "11px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, cursor: submitted ? "default" : "pointer", display: "flex", alignItems: "center", gap: "10px", textAlign: "left", transition: "all 0.18s", border: "1px solid" };
    const selected = answers[currentKey] === optId;
    if (!submitted) return { ...base, background: selected ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.03)", borderColor: selected ? "rgba(20,184,166,0.5)" : "var(--border-soft)", color: selected ? "var(--teal-300)" : "var(--text-muted)" };
    const res = results?.answers?.find((a) => a.questionId === String(passage._id) && a.index === questionIdx);
    const isCorrect = res?.correctOptionId === optId;
    const isSel     = res?.selectedOptionId === optId;
    if (isCorrect)          return { ...base, background: "rgba(74,222,128,0.12)",  borderColor: "rgba(74,222,128,0.4)",  color: "#4ade80" };
    if (isSel && !isCorrect) return { ...base, background: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.4)", color: "var(--danger-400)" };
    return { ...base, background: "rgba(255,255,255,0.02)", borderColor: "var(--border-soft)", color: "var(--text-dim)" };
  };

  if (!passage) return null;

  // ── Review mode ──
  if (reviewing) {
    return (
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ReviewPanel passages={passages} answers={answers} results={results} onClose={() => setReviewing(false)} />
        </div>
        <QuestionPalette flat={flat} currentKey={currentKey} answers={answers} remarked={remarked}
          onJump={jumpTo} onSubmit={handleSubmit} submitted={submitted} results={results}
          totalQuestions={totalQ} reviewing={reviewing} onReview={() => setReviewing(true)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      {/* ── Left ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Passage tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {passages.map((p, i) => (
            <button key={i} onClick={() => jumpTo(i, 0)}
              style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                background: i === passageIdx ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.04)",
                borderColor: i === passageIdx ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                color: i === passageIdx ? "var(--teal-400)" : "var(--text-muted)" }}>
              {i + 1}. {p.title}
            </button>
          ))}
        </div>

        {/* Passage card */}
        <div className="dash-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isListening ? <Headphones size={18} style={{ color: "#a78bfa" }} /> : <BookOpen size={18} style={{ color: "var(--teal-400)" }} />}
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>{passage.title}</h3>
              <span className={`diff-badge diff-${passage.difficulty}`}>{passage.difficulty}</span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{passage.category}</span>
            </div>
            <button onClick={() => playing ? stopTTS() : playTTS(passage.passage || passage.title)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.2s",
                background: playing ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
                borderColor: playing ? "rgba(167,139,250,0.4)" : "var(--border)",
                color: playing ? "#a78bfa" : "var(--text-muted)" }}>
              {playing ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {playing ? "Stop Audio" : "Play Audio"}
            </button>
          </div>

          {isListening ? (
            <div style={{ textAlign: "center", padding: "32px 20px", border: "1px dashed rgba(167,139,250,0.3)", borderRadius: "12px", background: "rgba(167,139,250,0.05)" }}>
              <Headphones size={40} style={{ color: "#a78bfa", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#a78bfa", marginBottom: "6px" }}>Listening Only Mode</p>
              <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>Passage is hidden — click Play Audio to listen</p>
            </div>
          ) : (
            <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.75 }}>{passage.passage}</p>
            </div>
          )}
        </div>

        {/* Question card */}
        <div className="dash-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Question {questionIdx + 1} of {passage.questions.length}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{Object.keys(answers).length}/{totalQ} answered</span>
              {!submitted && (
                <button onClick={toggleRemark}
                  style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                    background: remarked.has(currentKey) ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.04)",
                    borderColor: remarked.has(currentKey) ? "rgba(96,165,250,0.5)" : "var(--border-soft)",
                    color: remarked.has(currentKey) ? "#60a5fa" : "var(--text-dim)" }}>
                  <Bookmark size={11} fill={remarked.has(currentKey) ? "#60a5fa" : "none"} />
                  {remarked.has(currentKey) ? "Remarked" : "Remark"}
                </button>
              )}
            </div>
          </div>

          <p style={{ fontSize: "15px", fontWeight: 600, color: "white", marginBottom: "18px", lineHeight: 1.5 }}>{currentQ?.question}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {currentQ?.options.map((opt) => (
              <button key={opt.id} onClick={() => select(opt.id)} style={getOptStyle(opt.id)}>
                <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{opt.id}</span>
                {opt.text}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button onClick={goPrev} disabled={flatIdx === 0} className="btn-outline"
              style={{ padding: "8px 16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", opacity: flatIdx === 0 ? 0.4 : 1 }}>
              <ChevronLeft size={13} /> Previous
            </button>
            {submitted ? (
              <button onClick={() => setReviewing(true)} className="btn-teal"
                style={{ padding: "8px 18px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                <Eye size={13} /> Review All Answers
              </button>
            ) : (
              <button onClick={goNext} disabled={flatIdx === flat.length - 1} className="btn-outline"
                style={{ padding: "8px 16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px", opacity: flatIdx === flat.length - 1 ? 0.4 : 1 }}>
                Next <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: palette ── */}
      <QuestionPalette
        flat={flat}
        currentKey={currentKey}
        answers={answers}
        remarked={remarked}
        onJump={jumpTo}
        onSubmit={handleSubmit}
        submitted={submitted}
        results={results}
        totalQuestions={totalQ}
        reviewing={reviewing}
        onReview={() => setReviewing(true)}
      />
    </div>
  );
};

export default PassageSection;

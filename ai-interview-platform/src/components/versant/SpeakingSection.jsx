import React, { useState, useRef } from "react";
import { Mic, MicOff, Send, CheckCircle2, RotateCcw, AlertCircle, Eye } from "lucide-react";

const PALETTE_COLORS = {
  answered:    { bg: "rgba(74,222,128,0.18)",  border: "rgba(74,222,128,0.55)",  color: "#4ade80" },
  unattempted: { bg: "rgba(248,113,113,0.14)", border: "rgba(248,113,113,0.45)", color: "#f87171" },
  current:     { bg: "rgba(20,184,166,0.22)",  border: "rgba(20,184,166,0.7)",   color: "var(--teal-300)" },
};

const ScoreBar = ({ label, value }) => (
  <div style={{ marginBottom: "12px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--teal-400)", fontFamily: "JetBrains Mono,monospace" }}>{value}%</span>
    </div>
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value}%`, background: value >= 70 ? "linear-gradient(90deg,#0f9185,#14b8a6)" : value >= 50 ? "linear-gradient(90deg,#d97706,#fbbf24)" : "linear-gradient(90deg,#dc2626,#f87171)" }} />
    </div>
  </div>
);

const SpeakingPalette = ({ prompts, current, evaluated, onJump, onSubmitAll, submitted, results, onReview }) => {
  const total       = prompts.length;
  const doneCount   = evaluated.size;
  const unattempted = total - doneCount;
  const allDone     = doneCount === total;

  const getStyle = (i) => {
    const isCur  = i === current;
    const isDone = evaluated.has(i);
    let c = isDone ? PALETTE_COLORS.answered : PALETTE_COLORS.unattempted;
    if (isCur) c = PALETTE_COLORS.current;
    return { width: "36px", height: "36px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: `2px solid ${c.border}`, background: c.bg, color: c.color, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isCur ? `0 0 0 2px ${c.border}` : "none" };
  };

  return (
    <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="dash-card" style={{ padding: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Prompt Status</p>
        {[
          { label: "Evaluated",     count: doneCount,   ...PALETTE_COLORS.answered },
          { label: "Not Attempted", count: unattempted, ...PALETTE_COLORS.unattempted },
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

      <div className="dash-card" style={{ padding: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Prompts ({total})</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {prompts.map((_, i) => (
            <button key={i} onClick={() => onJump(i)} style={getStyle(i)}>{i + 1}</button>
          ))}
        </div>
      </div>

      {!submitted && (
        <div className="dash-card" style={{ padding: "16px" }}>
          {!allDone && (
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
              <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "11px", color: "#f87171", lineHeight: 1.5 }}>
                Evaluate all {unattempted} remaining prompt{unattempted > 1 ? "s" : ""} to submit.
              </p>
            </div>
          )}
          <button onClick={onSubmitAll} disabled={!allDone}
            className={allDone ? "btn-teal" : "btn-outline"}
            style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", opacity: allDone ? 1 : 0.5, cursor: allDone ? "pointer" : "not-allowed" }}>
            <Send size={14} /> {allDone ? "Submit All" : `${unattempted} Remaining`}
          </button>
        </div>
      )}

      {submitted && results && (
        <div className="dash-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", textAlign: "center" }}>
            <p style={{ fontSize: "26px", fontWeight: 800, color: "white", fontFamily: "Syne,sans-serif" }}>{results.scores?.overall}%</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Speaking score</p>
          </div>
          <button onClick={onReview} className="btn-teal"
            style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            <Eye size={14} /> Review Responses
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const SpeakingSection = ({ prompts, onSubmit, submitted, results }) => {
  const [current,         setCurrent]         = useState(0);
  const [recording,       setRecording]       = useState(false);
  const [transcripts,     setTranscripts]     = useState({});
  const [evaluated,       setEvaluated]       = useState(new Set());
  const [allResults,      setAllResults]      = useState({});
  const [recordingTime,   setRecordingTime]   = useState(0);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [reviewing,       setReviewing]       = useState(false);
  const recognitionRef = useRef(null);
  const timerRef       = useRef(null);

  const prompt     = prompts[current];
  const wordCount  = (transcripts[current] || "").trim().split(/\s+/).filter(Boolean).length;
  const isEvaluated = evaluated.has(current);

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition requires Chrome."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    let finalText = transcripts[current] || "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscripts((prev) => ({ ...prev, [current]: finalText + interim }));
    };
    rec.onerror = () => stopRecording();
    rec.onend   = () => { /* don't auto-restart */ };
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const resetTranscript = () => {
    stopRecording();
    setTranscripts((prev) => ({ ...prev, [current]: "" }));
    setEvaluated((prev) => { const n = new Set(prev); n.delete(current); return n; });
    setAllResults((prev) => { const n = { ...prev }; delete n[current]; return n; });
  };

  const handleEvaluate = async () => {
    const t = transcripts[current] || "";
    if (!t.trim()) return;
    setLocalSubmitting(true);
    try {
      await onSubmit({ questionId: String(prompt._id), transcript: t, promptIdx: current });
      setEvaluated((prev) => new Set([...prev, current]));
    } finally {
      setLocalSubmitting(false);
    }
  };

  const fmtTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!prompt) return null;

  // ── Review mode ──
  if (reviewing) {
    return (
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 700, color: "white" }}>Speaking Review</h2>
            <button onClick={() => setReviewing(false)} className="btn-outline"
              style={{ padding: "7px 16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <RotateCcw size={13} /> Back
            </button>
          </div>
          {results && (
            <div style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "14px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <p style={{ fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>OVERALL</p>
                <p style={{ fontSize: "20px", fontWeight: 800, color: "white" }}>{results.scores?.overall}%</p>
              </div>
              <div style={{ display: "flex", gap: "20px" }}>
                {[["Fluency", results.scores?.fluency], ["Pronunciation", results.scores?.pronunciation], ["Confidence", results.scores?.confidence]].map(([label, val]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "16px", fontWeight: 800, color: "var(--teal-400)" }}>{val}%</p>
                    <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {prompts.map((p, i) => (
            <div key={i} className="dash-card" style={{ padding: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "7px", background: evaluated.has(i) ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {evaluated.has(i) ? <CheckCircle2 size={15} style={{ color: "#4ade80" }} /> : <span style={{ fontSize: "12px", color: "#f87171" }}>—</span>}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Prompt {i + 1}</span>
                <span className={`diff-badge diff-${p.difficulty}`}>{p.difficulty}</span>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{p.topic}</span>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "white", lineHeight: 1.6, marginBottom: "14px" }}>{p.prompt}</p>
              {transcripts[i] ? (
                <div style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)", marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Your Response</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7 }}>{transcripts[i]}</p>
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic", marginBottom: "12px" }}>No response recorded.</p>
              )}
              {results?.sampleAnswer && evaluated.has(i) && (
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Sample Answer Guide</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{results.sampleAnswer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <SpeakingPalette prompts={prompts} current={current} evaluated={evaluated}
          onJump={(i) => { stopRecording(); setCurrent(i); }}
          onSubmitAll={() => onSubmit({ submitAll: true })}
          submitted={submitted} results={results} onReview={() => setReviewing(true)} />
      </div>
    );
  }

  // The last result shown is for the current prompt if evaluated
  const currentResult = isEvaluated ? results : null;

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      {/* ── Left ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Prompt tabs */}
        {prompts.length > 1 && (
          <div style={{ display: "flex", gap: "8px" }}>
            {prompts.map((_, i) => (
              <button key={i} onClick={() => { stopRecording(); setCurrent(i); }}
                style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                  background: i === current ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.04)",
                  borderColor: i === current ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                  color: i === current ? "var(--teal-400)" : "var(--text-muted)" }}>
                Prompt {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Prompt card */}
        <div className="dash-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span className={`diff-badge diff-${prompt.difficulty}`}>{prompt.difficulty}</span>
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{prompt.topic}</span>
          </div>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Speaking Prompt</p>
          <p style={{ fontSize: "17px", fontWeight: 600, color: "white", lineHeight: 1.6 }}>{prompt.prompt}</p>
        </div>

        {/* Recording area */}
        <div className="dash-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Response</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {recording && (
                <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono,monospace", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171", animation: "pulse 1s infinite" }} />
                  {fmtTime(recordingTime)}
                </span>
              )}
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{wordCount} words</span>
            </div>
          </div>

          <div style={{ minHeight: "120px", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${recording ? "rgba(248,113,113,0.4)" : isEvaluated ? "rgba(74,222,128,0.3)" : "var(--border-soft)"}`, marginBottom: "16px", transition: "border-color 0.2s" }}>
            {transcripts[current] ? (
              <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.7 }}>{transcripts[current]}</p>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic" }}>
                {recording ? "Listening... speak clearly." : "Click 'Start Recording' and speak your answer."}
              </p>
            )}
          </div>

          {!isEvaluated && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {!recording ? (
                <button onClick={startRecording} className="btn-teal"
                  style={{ padding: "10px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                  <Mic size={15} /> Start Recording
                </button>
              ) : (
                <button onClick={stopRecording}
                  style={{ padding: "10px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "11px", color: "var(--danger-400)", cursor: "pointer", fontWeight: 600 }}>
                  <MicOff size={15} /> Stop Recording
                </button>
              )}
              <button onClick={resetTranscript} className="btn-outline"
                style={{ padding: "10px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <RotateCcw size={13} /> Reset
              </button>
              <button onClick={handleEvaluate} disabled={!transcripts[current]?.trim() || localSubmitting} className="btn-teal"
                style={{ padding: "10px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", marginLeft: "auto", opacity: transcripts[current]?.trim() && !localSubmitting ? 1 : 0.5 }}>
                <Send size={14} /> {localSubmitting ? "Evaluating..." : "Evaluate"}
              </button>
            </div>
          )}

          {isEvaluated && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#4ade80", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={15} /> Evaluated
              </span>
              <button onClick={resetTranscript} className="btn-outline"
                style={{ padding: "7px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                <RotateCcw size={12} /> Redo
              </button>
            </div>
          )}
        </div>

        {/* Results for current prompt */}
        {isEvaluated && results && (
          <div className="dash-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <CheckCircle2 size={18} style={{ color: "#4ade80" }} />
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>Evaluation — Prompt {current + 1}</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "16px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 8px 20px rgba(20,184,166,0.3)" }}>
                <p style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>OVERALL</p>
                <p style={{ fontSize: "22px", fontWeight: 800, color: "white" }}>{results.scores?.overall}%</p>
              </div>
              <div style={{ flex: 1 }}>
                <ScoreBar label="Fluency"       value={results.scores?.fluency || 0} />
                <ScoreBar label="Pronunciation" value={results.scores?.pronunciation || 0} />
                <ScoreBar label="Confidence"    value={results.scores?.confidence || 0} />
              </div>
            </div>
            {results.feedback?.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                {results.feedback.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
                    <span style={{ color: "var(--teal-400)", fontSize: "14px", flexShrink: 0 }}>→</span>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}
            {results.sampleAnswer && (
              <div style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Sample Answer Guide</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{results.sampleAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: palette ── */}
      <SpeakingPalette
        prompts={prompts}
        current={current}
        evaluated={evaluated}
        onJump={(i) => { stopRecording(); setCurrent(i); }}
        onSubmitAll={() => onSubmit({ submitAll: true })}
        submitted={submitted}
        results={results}
        onReview={() => setReviewing(true)}
      />
    </div>
  );
};

export default SpeakingSection;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, Clock, CheckCircle2, ArrowLeft, Send, Sparkles, Target,
  Loader2, Mic, MicOff, RotateCcw, BarChart2, ChevronRight,
  AlertCircle, TrendingUp, TrendingDown, FileText, History,
  Star, Upload, ChevronDown, ChevronUp
} from "lucide-react";
import {
  startInterview, submitAnswer, getInterviewResult, getInterviewHistory, getMe
} from "../services/api";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import { useAuth } from "../context/AuthContext";
import InterviewSetup from "../components/InterviewSetup";

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "software-engineer",     label: "Software Engineer" },
  { value: "frontend-developer",    label: "Frontend Developer" },
  { value: "backend-developer",     label: "Backend Developer" },
  { value: "full-stack-developer",  label: "Full Stack Developer" },
  { value: "data-scientist",        label: "Data Scientist" },
  { value: "devops-engineer",       label: "DevOps Engineer" },
  { value: "product-manager",       label: "Product Manager" },
];

const SKILL_OPTIONS = [
  "React", "JavaScript", "TypeScript", "Node.js", "Python", "Java",
  "DSA", "System Design", "MongoDB", "SQL", "AWS", "Docker",
  "CSS", "Next.js", "Express", "GraphQL", "Redis", "Kubernetes",
];

const GUEST_QUESTIONS = [
  "Tell me about yourself and the kind of role you are preparing for.",
  "Describe a project where you solved a challenging technical problem.",
  "How do you prioritize tasks when deadlines are tight?",
  "Explain one core concept from your primary technology stack.",
  "What feedback did you receive recently, and how did you apply it?",
];

// ── Client-side scoring (used for guest mode) ─────────────────────────────────
const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "actually", "sort of", "kind of"];

const scoreAnswerLocally = (answer = "") => {
  const text = answer.trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Length score 0–4
  const lengthScore = wordCount >= 80 ? 4 : wordCount >= 40 ? 3 : wordCount >= 20 ? 2 : wordCount >= 8 ? 1 : 0;

  // Structure signals 0–3
  const signals = ["because", "therefore", "result", "solution", "approach", "implemented", "achieved", "example", "specifically", "first", "second", "finally"];
  const hits = signals.filter((s) => text.includes(s)).length;
  const structureScore = hits >= 4 ? 3 : hits >= 2 ? 2 : hits >= 1 ? 1 : 0;

  // Depth signals 0–3
  const depthSignals = ["experience", "project", "team", "challenge", "learned", "improved", "built", "designed", "optimized", "reduced", "increased"];
  const depthHits = depthSignals.filter((s) => text.includes(s)).length;
  const depthScore = depthHits >= 3 ? 3 : depthHits >= 2 ? 2 : depthHits >= 1 ? 1 : 0;

  const total = Math.min(10, lengthScore + structureScore + depthScore);

  let feedback = "";
  if (wordCount < 10) feedback = "Very short answer. Try to elaborate with examples and context.";
  else if (wordCount < 25) feedback = "Good start. Add more detail and specific examples to strengthen your answer.";
  else if (total >= 8) feedback = "Excellent answer! Well-structured with good depth.";
  else if (total >= 6) feedback = "Good answer. Adding more specific examples would make it stronger.";
  else if (total >= 4) feedback = "Decent response. Focus on structure: situation, action, and result.";
  else feedback = "Try to provide a more detailed and structured response using the STAR method.";

  return { score: total, feedback };
};

const computeCommunicationLocally = (answerTexts = []) => {
  if (!answerTexts.length) return { fluency: 0, confidence: 0, clarity: 0 };

  const allText = answerTexts.join(" ").toLowerCase();
  const words = allText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const avgWords = wordCount / answerTexts.length;

  const fillerCount = FILLER_WORDS.reduce((acc, fw) => {
    return acc + (allText.match(new RegExp(`\\b${fw}\\b`, "gi")) || []).length;
  }, 0);

  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : avgWords;

  // Fluency: reward longer answers, penalise fillers
  const fluencyLen  = avgWords >= 60 ? 45 : avgWords >= 30 ? 35 : avgWords >= 15 ? 25 : 15;
  const fluencySent = avgSentenceLen >= 6 && avgSentenceLen <= 30 ? 30 : 15;
  const fluencyFill = Math.max(0, 25 - fillerCount * 3);
  const fluency     = Math.min(100, Math.round(fluencyLen + fluencySent + fluencyFill));

  // Confidence: base on answer length + filler penalty
  const confBase = avgWords >= 40 ? 70 : avgWords >= 20 ? 55 : 40;
  const confFill = Math.max(0, 30 - fillerCount * 4);
  const confidence = Math.min(100, Math.round(confBase + confFill));

  // Clarity: sentence length sweet spot + content depth
  const clarLen  = avgWords >= 20 ? 40 : avgWords >= 10 ? 28 : 15;
  const clarSent = avgSentenceLen >= 5 && avgSentenceLen <= 25 ? 35 : 20;
  const clarFill = Math.max(0, 25 - fillerCount * 3);
  const clarity  = Math.min(100, Math.round(clarLen + clarSent + clarFill));

  return { fluency, confidence, clarity };
};

// ── Guest dynamic question generator ─────────────────────────────────────────
// Generates contextual questions for guest users without hitting the server
const GUEST_QUESTION_POOL = {
  intro: [
    { q: "Tell me about yourself and your experience as a developer.", skill: "Introduction" },
    { q: "Walk me through your background and the projects you're most proud of.", skill: "Introduction" },
  ],
  technical: [
    { q: "Explain how closures work in JavaScript and give a practical example.", skill: "JavaScript" },
    { q: "What is the difference between REST and GraphQL? When would you use each?", skill: "API Design" },
    { q: "How does React's reconciliation algorithm work?", skill: "React" },
    { q: "Explain the event loop in Node.js.", skill: "Node.js" },
    { q: "What are the SOLID principles? Give an example of one you've applied.", skill: "Architecture" },
    { q: "How do you approach database indexing and query optimisation?", skill: "Database" },
    { q: "Explain the difference between SQL and NoSQL databases.", skill: "Database" },
    { q: "What is memoisation and when would you use it?", skill: "Performance" },
    { q: "How does async/await work under the hood in JavaScript?", skill: "JavaScript" },
    { q: "Explain the concept of microservices vs monolithic architecture.", skill: "System Design" },
  ],
  problemSolving: [
    { q: "Describe the most complex bug you've debugged. How did you find and fix it?", skill: "Debugging" },
    { q: "How would you design a URL shortener like bit.ly?", skill: "System Design" },
    { q: "Walk me through how you'd optimise a slow API endpoint.", skill: "Performance" },
    { q: "How would you implement a rate limiter?", skill: "System Design" },
    { q: "Describe a time you had to refactor a large codebase. What was your approach?", skill: "Architecture" },
  ],
  behavioural: [
    { q: "Tell me about a time you disagreed with a technical decision. How did you handle it?", skill: "Soft Skills" },
    { q: "How do you handle tight deadlines and competing priorities?", skill: "Soft Skills" },
    { q: "Describe a time you mentored or helped a junior developer.", skill: "Leadership" },
    { q: "What feedback have you received recently and how did you act on it?", skill: "Growth" },
    { q: "How do you stay up to date with new technologies?", skill: "Learning" },
  ],
};

const generateGuestQuestion = ({ role, skills, difficulty, questionNumber, history = [] }) => {
  const usedQuestions = new Set(history.map((h) => h.question));

  // Q1 always intro
  if (questionNumber === 1) {
    const intro = GUEST_QUESTION_POOL.intro.find((q) => !usedQuestions.has(q.q));
    return { question: intro?.q || GUEST_QUESTION_POOL.intro[0].q, skill: "Introduction" };
  }

  // Q2-4: technical
  if (questionNumber <= 4) {
    const pool = GUEST_QUESTION_POOL.technical.filter((q) => !usedQuestions.has(q.q));
    const pick = pool[Math.floor(Math.random() * pool.length)] || GUEST_QUESTION_POOL.technical[0];
    return { question: pick.q, skill: pick.skill };
  }

  // Q5-7: problem solving
  if (questionNumber <= 7) {
    const pool = GUEST_QUESTION_POOL.problemSolving.filter((q) => !usedQuestions.has(q.q));
    const pick = pool[Math.floor(Math.random() * pool.length)] || GUEST_QUESTION_POOL.problemSolving[0];
    return { question: pick.q, skill: pick.skill };
  }

  // Q8+: behavioural
  const pool = GUEST_QUESTION_POOL.behavioural.filter((q) => !usedQuestions.has(q.q));
  const pick = pool[Math.floor(Math.random() * pool.length)] || GUEST_QUESTION_POOL.behavioural[0];
  return { question: pick.q, skill: pick.skill };
};

// ── Sub-components ────────────────────────────────────────────────────────────
const ProgressBar = ({ current, total }) => (
  <div className="flex items-center gap-3">
    <div className="progress-track flex-1">
      <div className="progress-fill" style={{ width: `${(current / total) * 100}%` }} />
    </div>
    <span className="text-sm font-bold" style={{ color: "var(--teal-400)", fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap" }}>
      {current}/{total}
    </span>
  </div>
);

const ScoreBar = ({ label, value, color = "var(--teal-400)" }) => (
  <div style={{ marginBottom: "10px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: "12px", fontWeight: 700, color, fontFamily: "JetBrains Mono,monospace" }}>{value}%</span>
    </div>
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value}%`, background: value >= 70 ? "linear-gradient(90deg,#0f9185,#14b8a6)" : value >= 50 ? "linear-gradient(90deg,#d97706,#fbbf24)" : "linear-gradient(90deg,#dc2626,#f87171)" }} />
    </div>
  </div>
);

// ── Setup Screen ──────────────────────────────────────────────────────────────
const SetupScreen = ({ onStart, loading }) => {
  const [role, setRole]           = useState("software-engineer");
  const [skills, setSkills]       = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [mode, setMode]           = useState("text");
  const [count, setCount]         = useState(7);

  const toggleSkill = (s) => setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px 60px" }}>
        <PageWrapper>
          <span className="teal-badge inline-flex mb-4" style={{ fontSize: "10px" }}>🎤 AI INTERVIEW</span>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
            Configure Your Interview
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
            Personalize your session — our AI will generate adaptive questions based on your selections.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Role */}
            <div className="dash-card" style={{ padding: "20px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Target Role</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {ROLES.map((r) => (
                  <button key={r.value} onClick={() => setRole(r.value)}
                    style={{ padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                      background: role === r.value ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.04)",
                      borderColor: role === r.value ? "rgba(20,184,166,0.5)" : "var(--border-soft)",
                      color: role === r.value ? "var(--teal-400)" : "var(--text-muted)" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="dash-card" style={{ padding: "20px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Skills to Focus On</p>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "12px" }}>Select up to 5 skills (optional)</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {SKILL_OPTIONS.map((s) => (
                  <button key={s} onClick={() => toggleSkill(s)}
                    disabled={!skills.includes(s) && skills.length >= 5}
                    style={{ padding: "6px 13px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.18s",
                      background: skills.includes(s) ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.04)",
                      borderColor: skills.includes(s) ? "rgba(20,184,166,0.5)" : "var(--border-soft)",
                      color: skills.includes(s) ? "var(--teal-400)" : "var(--text-muted)",
                      opacity: !skills.includes(s) && skills.length >= 5 ? 0.4 : 1 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty + Mode + Count */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div className="dash-card" style={{ padding: "18px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Difficulty</p>
                {["easy", "medium", "hard"].map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", marginBottom: "6px", textAlign: "left", transition: "all 0.18s",
                      background: difficulty === d ? "rgba(20,184,166,0.12)" : "transparent",
                      borderColor: difficulty === d ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                      color: difficulty === d ? "var(--teal-400)" : "var(--text-muted)" }}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>

              <div className="dash-card" style={{ padding: "18px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Input Mode</p>
                {[{ v: "text", l: "✍️ Text" }, { v: "voice", l: "🎤 Voice" }].map(({ v, l }) => (
                  <button key={v} onClick={() => setMode(v)}
                    style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", marginBottom: "6px", textAlign: "left", transition: "all 0.18s",
                      background: mode === v ? "rgba(20,184,166,0.12)" : "transparent",
                      borderColor: mode === v ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                      color: mode === v ? "var(--teal-400)" : "var(--text-muted)" }}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="dash-card" style={{ padding: "18px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Questions</p>
                {[5, 7, 10].map((n) => (
                  <button key={n} onClick={() => setCount(n)}
                    style={{ display: "block", width: "100%", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid", marginBottom: "6px", textAlign: "left", transition: "all 0.18s",
                      background: count === n ? "rgba(20,184,166,0.12)" : "transparent",
                      borderColor: count === n ? "rgba(20,184,166,0.4)" : "var(--border-soft)",
                      color: count === n ? "var(--teal-400)" : "var(--text-muted)" }}>
                    {n} questions
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => onStart({ role, skills, difficulty, mode, count })} disabled={loading}
              className="btn-teal"
              style={{ padding: "14px", fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", opacity: loading ? 0.7 : 1 }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating questions...</> : <><Sparkles size={16} /> Start AI Interview</>}
            </button>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

// ── Voice Recorder Hook ───────────────────────────────────────────────────────
const useVoiceRecorder = () => {
  const [recording, setRecording]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recTime, setRecTime]       = useState(0);
  const recognitionRef = useRef(null);
  const timerRef       = useRef(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome or Edge."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    let final = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final + interim);
    };
    rec.onerror = () => stop();
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
    setRecTime(0);
    timerRef.current = setInterval(() => setRecTime((t) => t + 1), 1000);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const reset = useCallback(() => { stop(); setTranscript(""); setRecTime(0); }, [stop]);

  const fmtTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return { recording, transcript, recTime, fmtTime, start, stop, reset };
};

// ── Question Card ─────────────────────────────────────────────────────────────
const QuestionCard = ({ question, index, total, skill, difficulty, mode, onSubmit, isSubmitting, lastFeedback }) => {
  const [answer, setAnswer]   = useState("");
  const textareaRef           = useRef(null);
  const voice                 = useVoiceRecorder();
  const wordCount             = (mode === "voice" ? voice.transcript : answer).trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => { setAnswer(""); voice.reset(); textareaRef.current?.focus(); }, [index]);

  const handleSubmit = () => {
    const finalAnswer = mode === "voice" ? voice.transcript : answer;
    if (!finalAnswer.trim()) return;
    if (mode === "voice") voice.stop();
    onSubmit({ answer: mode === "text" ? finalAnswer : "", transcript: mode === "voice" ? finalAnswer : "" });
  };

  const canSubmit = mode === "voice" ? voice.transcript.trim().length > 0 : answer.trim().length > 0;

  return (
    <div className="question-card fade-up">
      {/* Meta */}
      <div className="flex items-center gap-3 mb-5">
        <div className="q-number">Q{index + 1}</div>
        <div style={{ flex: 1 }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--teal-400)", letterSpacing: "0.08em" }}>
            Question {index + 1} of {total}
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            {skill && <span className="skill-tag neutral" style={{ fontSize: "10px", padding: "2px 8px" }}>{skill}</span>}
            <span className={`diff-badge diff-${difficulty}`}>{difficulty}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-dim)" }}>
          <Clock size={11} /> Take your time
        </div>
      </div>

      {/* Question */}
      <div className="question-text-block mb-5">
        <div className="flex items-start gap-3">
          <Brain size={16} style={{ color: "var(--teal-400)", flexShrink: 0, marginTop: "2px" }} />
          <p className="text-sm font-medium leading-relaxed text-white">{question}</p>
        </div>
      </div>

      {/* Previous feedback */}
      {lastFeedback && (
        <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "10px", background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.2)" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Previous Answer Feedback
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>{lastFeedback}</p>
        </div>
      )}

      {/* Answer area */}
      {mode === "text" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white">Your Answer</label>
            <span style={{ fontSize: "11px", color: wordCount > 20 ? "var(--teal-400)" : "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>
              {wordCount}w {wordCount > 20 ? "✓" : ""}
            </span>
          </div>
          <textarea ref={textareaRef} value={answer} onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) handleSubmit(); }}
            placeholder="Type your answer here... (Ctrl/Cmd + Enter to submit)"
            rows={6} className="dark-textarea" />
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>Tip: Use the STAR method — Situation, Task, Action, Result</p>
            <button className="btn-teal"
              style={{ padding: "9px 20px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "7px", opacity: (!canSubmit || isSubmitting) ? 0.5 : 1, cursor: (!canSubmit || isSubmitting) ? "not-allowed" : "pointer" }}
              onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Evaluating...</> : index === total - 1 ? <><CheckCircle2 size={13} /> Finish Interview</> : <><Send size={13} /> Next Question</>}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <label className="text-sm font-semibold text-white">Voice Response</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {voice.recording && (
                <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono,monospace", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171", animation: "pulse 1s infinite" }} />
                  {voice.fmtTime(voice.recTime)}
                </span>
              )}
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{wordCount}w</span>
            </div>
          </div>

          <div style={{ minHeight: "120px", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: `1px solid ${voice.recording ? "rgba(248,113,113,0.4)" : "var(--border-soft)"}`, marginBottom: "14px", transition: "border-color 0.2s" }}>
            {voice.transcript ? (
              <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.7 }}>{voice.transcript}</p>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic" }}>
                {voice.recording ? "Listening... speak clearly." : "Click Start Recording to begin."}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {!voice.recording ? (
              <button onClick={voice.start} className="btn-teal"
                style={{ padding: "9px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                <Mic size={14} /> Start Recording
              </button>
            ) : (
              <button onClick={voice.stop}
                style={{ padding: "9px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "11px", color: "var(--danger-400)", cursor: "pointer", fontWeight: 600 }}>
                <MicOff size={14} /> Stop Recording
              </button>
            )}
            <button onClick={voice.reset} className="btn-outline"
              style={{ padding: "9px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <RotateCcw size={13} /> Reset
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="btn-teal"
              style={{ padding: "9px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", marginLeft: "auto", opacity: (!canSubmit || isSubmitting) ? 0.5 : 1 }}>
              {isSubmitting ? <><Loader2 size={13} className="animate-spin" /> Evaluating...</> : index === total - 1 ? <><CheckCircle2 size={13} /> Finish</> : <><Send size={13} /> Next</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Result Screen ─────────────────────────────────────────────────────────────
const ResultScreen = ({ result, onRestart, onDashboard }) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const { overallScore, communicationScore, report, answers, role, skills } = result;

  const scoreColor = overallScore >= 70 ? "#4ade80" : overallScore >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 24px 60px" }}>
        <PageWrapper>
          <span className="teal-badge inline-flex mb-4" style={{ fontSize: "10px" }}>🎤 INTERVIEW COMPLETE</span>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "24px" }}>
            Performance Report
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            {/* Overall score */}
            <div className="dash-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "18px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 8px 24px rgba(20,184,166,0.3)" }}>
                <p style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>OVERALL</p>
                <p style={{ fontSize: "26px", fontWeight: 800, color: "white" }}>{overallScore}%</p>
              </div>
              <div>
                <p style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "white", marginBottom: "4px" }}>
                  {overallScore >= 80 ? "Excellent Performance" : overallScore >= 60 ? "Good Performance" : overallScore >= 40 ? "Average Performance" : "Needs Improvement"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{role} · {answers?.length || 0} questions answered</p>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                  {(skills || []).map((s) => <span key={s} className="skill-tag neutral" style={{ fontSize: "10px", padding: "2px 8px" }}>{s}</span>)}
                </div>
              </div>
            </div>

            {/* Communication */}
            <div className="dash-card" style={{ padding: "24px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Communication</p>
              <ScoreBar label="Fluency"    value={communicationScore?.fluency    || 0} />
              <ScoreBar label="Confidence" value={communicationScore?.confidence || 0} />
              <ScoreBar label="Clarity"    value={communicationScore?.clarity    || 0} />
            </div>
          </div>

          {/* Skill breakdown */}
          {report?.skillBreakdown && Object.keys(report.skillBreakdown).length > 0 && (
            <div className="dash-card" style={{ padding: "24px", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Skill Breakdown</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {Object.entries(report.skillBreakdown).map(([skill, pct]) => (
                  <div key={skill} style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "white" }}>{skill}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171", fontFamily: "JetBrains Mono,monospace" }}>{pct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: "5px" }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 70 ? "linear-gradient(90deg,#0f9185,#14b8a6)" : pct >= 50 ? "linear-gradient(90deg,#d97706,#fbbf24)" : "linear-gradient(90deg,#dc2626,#f87171)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            {report?.strengths?.length > 0 && (
              <div className="dash-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <TrendingUp size={16} style={{ color: "#4ade80" }} />
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Strengths</p>
                </div>
                {report.strengths.map((s) => (
                  <div key={s} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                    <CheckCircle2 size={13} style={{ color: "#4ade80", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {report?.weaknesses?.length > 0 && (
              <div className="dash-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <TrendingDown size={16} style={{ color: "#f87171" }} />
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Areas to Improve</p>
                </div>
                {report.weaknesses.map((w) => (
                  <div key={w} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                    <AlertCircle size={13} style={{ color: "#f87171", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {report?.suggestions?.length > 0 && (
            <div className="dash-card" style={{ padding: "20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Sparkles size={16} style={{ color: "var(--teal-400)" }} />
                <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>AI Suggestions</p>
              </div>
              {report.suggestions.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "5px", background: "rgba(20,184,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "var(--teal-400)", flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{s}</p>
                </div>
              ))}
            </div>
          )}

          {/* Per-answer review */}
          <div className="dash-card" style={{ padding: "20px", marginBottom: "20px" }}>
            <button onClick={() => setShowAnswers((v) => !v)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart2 size={16} style={{ color: "var(--teal-400)" }} />
                <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Answer Review ({answers?.length || 0} questions)</p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-dim)", transform: showAnswers ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {showAnswers && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {(answers || []).map((a, i) => {
                  const scoreColor = a.score >= 7 ? "#4ade80" : a.score >= 5 ? "#fbbf24" : "#f87171";
                  return (
                    <div key={i} style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: "rgba(20,184,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "var(--teal-400)", flexShrink: 0 }}>Q{i + 1}</span>
                          {a.skill && <span className="skill-tag neutral" style={{ fontSize: "10px", padding: "2px 8px" }}>{a.skill}</span>}
                          <span className={`diff-badge diff-${a.difficulty || "medium"}`}>{a.difficulty || "medium"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: scoreColor, fontFamily: "JetBrains Mono,monospace" }}>{a.score}/10</span>
                          {a.evaluationMethod === "ai" && <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(20,184,166,0.12)", color: "var(--teal-400)", fontWeight: 700 }}>AI</span>}
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "white", marginBottom: "8px", lineHeight: 1.5 }}>{a.question}</p>
                      <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)", marginBottom: "8px" }}>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>{a.answer || a.transcript || "No answer recorded."}</p>
                      </div>
                      {a.feedback && (
                        <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.5 }}>
                          <strong style={{ color: "var(--teal-400)" }}>Feedback: </strong>{a.feedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-outline" onClick={onDashboard}
              style={{ flex: 1, padding: "12px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              <ArrowLeft size={14} /> Dashboard
            </button>
            <button className="btn-teal" onClick={onRestart}
              style={{ flex: 1, padding: "12px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              <Sparkles size={14} /> New Interview
            </button>
          </div>
        </PageWrapper>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
};

// ── Main Interview Component ──────────────────────────────────────────────────
const Interview = () => {
  const [phase, setPhase]           = useState("setup"); // setup | loading | session | result
  const [sessionId, setSessionId]   = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [questionMeta, setQuestionMeta] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]       = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [elapsed, setElapsed]       = useState(0);
  const [lastFeedback, setLastFeedback] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState("medium");
  const [mode, setMode]             = useState("text");
  const [result, setResult]         = useState(null);
  const startTimeRef                = useRef(Date.now());
  const { isGuest }                 = useAuth();
  const navigate                    = useNavigate();

  // Timer
  useEffect(() => {
    if (phase !== "session") return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Start interview ──
  const handleStart = async ({ role, skills, difficulty, mode: m, count }) => {
    setMode(m);
    setCurrentDifficulty(difficulty);
    setPhase("loading");
    setError("");

    if (isGuest) {
      // Guest: generate dynamic questions client-side using the local pool
      const firstQ = generateGuestQuestion({ role, skills, difficulty, questionNumber: 1, history: [] });
      setQuestions([firstQ.question]);
      setQuestionMeta([{ skill: firstQ.skill, difficulty }]);
      setTotalQuestions(count);
      startTimeRef.current = Date.now();
      setPhase("session");
      return;
    }

    try {
      const res = await startInterview({ role, skills, difficulty, mode: m, count });
      const data = res.data;
      setSessionId(data.sessionId);
      // New API returns currentQuestion (single), not questions[]
      const firstQ = data.currentQuestion;
      setQuestions([firstQ.question]);
      setQuestionMeta([{ skill: firstQ.skill, difficulty: firstQ.difficulty }]);
      setTotalQuestions(data.totalQuestions);
      startTimeRef.current = Date.now();
      setPhase("session");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start interview. Please try again.");
      setPhase("setup");
    }
  };

  // ── Submit answer ──
  const handleSubmitAnswer = async ({ answer, transcript }) => {
    if (submitting) return;
    setSubmitting(true);
    setError("");

    const finalAnswer = answer || transcript;

    if (isGuest) {
      const { score, feedback } = scoreAnswerLocally(finalAnswer);
      const newAnswers = [...answers, {
        questionIndex: currentIndex,
        question: questions[currentIndex],
        answer: finalAnswer,
        score,
        feedback,
        skill: questionMeta[currentIndex]?.skill || "General",
        difficulty: currentDifficulty,
        evaluationMethod: "basic",
      }];
      setAnswers(newAnswers);
      setLastFeedback(feedback);

      const isLast = newAnswers.length >= totalQuestions;
      if (isLast) {
        const totalScore = newAnswers.reduce((s, a) => s + (a.score || 0), 0);
        const overallScore = Math.round((totalScore / (newAnswers.length * 10)) * 100);
        const commScore = computeCommunicationLocally(newAnswers.map((a) => a.answer));
        const strengths = overallScore >= 70 ? ["Clear communication", "Structured responses"] : [];
        const weaknesses = overallScore < 50 ? ["Answer depth", "Use of examples"] : [];
        setResult({
          overallScore,
          communicationScore: commScore,
          report: {
            skillBreakdown: { "General": overallScore },
            strengths,
            weaknesses,
            suggestions: [
              "Sign up for AI-powered evaluation and personalised feedback.",
              "Use the STAR method: Situation, Task, Action, Result.",
              "Aim for 40–80 words per answer with concrete examples.",
            ],
          },
          answers: newAnswers,
          role: "General",
          skills: [],
        });
        setPhase("result");
      } else {
        // Generate next guest question dynamically based on history
        const nextQ = generateGuestQuestion({
          role: "software-engineer",
          skills: questionMeta.map((m) => m.skill).filter(Boolean),
          difficulty: currentDifficulty,
          questionNumber: newAnswers.length + 1,
          history: newAnswers,
        });
        setQuestions((prev) => [...prev, nextQ.question]);
        setQuestionMeta((prev) => [...prev, { skill: nextQ.skill, difficulty: currentDifficulty }]);
        setCurrentIndex((i) => i + 1);
      }
      setSubmitting(false);
      return;
    }

    try {
      const res = await submitAnswer({
        sessionId,
        questionIndex: currentIndex,
        answer,
        transcript,
      });

      const evalData = res.data;
      setLastFeedback(evalData.feedback || "");
      setCurrentDifficulty(evalData.nextDifficulty || currentDifficulty);

      const newAnswers = [...answers, {
        questionIndex: currentIndex,
        question: questions[currentIndex],
        answer: finalAnswer,
        score: evalData.score,
        feedback: evalData.feedback,
        skill: questionMeta[currentIndex]?.skill || "",
        difficulty: currentDifficulty,
        evaluationMethod: evalData.evaluationMethod,
      }];
      setAnswers(newAnswers);

      if (evalData.isComplete) {
        try {
          const resultRes = await getInterviewResult(sessionId);
          setResult(resultRes.data);
        } catch {
          setResult({
            overallScore: Math.round(newAnswers.reduce((s, a) => s + (a.score || 0), 0) / (newAnswers.length * 10) * 100),
            communicationScore: { fluency: 0, confidence: 0, clarity: 0 },
            report: { skillBreakdown: {}, strengths: [], weaknesses: [], suggestions: [] },
            answers: newAnswers,
            role: "",
            skills: [],
          });
        }
        setPhase("result");
      } else {
        // Append the next question returned by the server
        const nextQ = evalData.nextQuestion;
        if (nextQ) {
          setQuestions((prev) => [...prev, nextQ.question]);
          setQuestionMeta((prev) => [...prev, { skill: nextQ.skill, difficulty: nextQ.difficulty }]);
        }
        setCurrentIndex((i) => i + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setPhase("setup"); setSessionId(null); setQuestions([]); setQuestionMeta([]);
    setTotalQuestions(10); setCurrentIndex(0); setAnswers([]); setError(""); setElapsed(0);
    setLastFeedback(""); setResult(null);
  };

  // ── Phases ──
  if (phase === "setup" || phase === "loading") {
    return <InterviewSetup onStart={handleStart} loading={phase === "loading"} />;
  }

  if (phase === "result" && result) {
    return <ResultScreen result={result} onRestart={handleRestart} onDashboard={() => navigate("/dashboard")} />;
  }

  // ── Session ──
  return (
    <div className="app-bg min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <PageWrapper>
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm mb-7 transition-colors"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={15} /> Exit Interview
          </button>

          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="teal-badge inline-flex mb-2" style={{ fontSize: "10px" }}>🎤 AI INTERVIEW</span>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                Technical Interview
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "JetBrains Mono, monospace" }}>
                <Clock size={13} style={{ color: "var(--teal-400)" }} /> {fmtTime(elapsed)}
              </div>
              <span className={`diff-badge diff-${currentDifficulty}`}>{currentDifficulty}</span>
            </div>
          </div>

          <div className="mb-6">
            <ProgressBar current={currentIndex + 1} total={totalQuestions} />
          </div>

          {error && (
            <div className="banner-error mb-4" style={{ marginBottom: "16px" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {questions.length > 0 && (
            <QuestionCard
              key={currentIndex}
              question={questions[currentIndex]}
              index={currentIndex}
              total={totalQuestions}
              skill={questionMeta[currentIndex]?.skill || ""}
              difficulty={currentDifficulty}
              mode={mode}
              onSubmit={handleSubmitAnswer}
              isSubmitting={submitting}
              lastFeedback={currentIndex > 0 ? lastFeedback : ""}
            />
          )}

          {currentIndex > 0 && (
            <p className="text-xs mt-3" style={{ color: "var(--text-dim)" }}>
              › {currentIndex} answer{currentIndex > 1 ? "s" : ""} saved
            </p>
          )}
        </PageWrapper>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
};

export default Interview;

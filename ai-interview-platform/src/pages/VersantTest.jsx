/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, CheckCircle2, BookOpen, Headphones, Mic2, FileText, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import GrammarSection from "../components/versant/GrammarSection";
import PassageSection from "../components/versant/PassageSection";
import SpeakingSection from "../components/versant/SpeakingSection";
import { getVersantModule, submitVersant, submitVersantSpeaking } from "../services/api";

const MODULES = [
  { key: "grammar",   label: "Module 1: Spot the Error",         icon: FileText,   color: "rgba(248,113,113,0.12)",  border: "rgba(248,113,113,0.3)",  text: "#f87171",  desc: "Identify grammatical errors in sentences" },
  { key: "reading",   label: "Module 2A: Reading Comprehension", icon: BookOpen,   color: "rgba(20,184,166,0.12)",   border: "rgba(20,184,166,0.3)",   text: "var(--teal-400)", desc: "Read passages and answer questions" },
  { key: "listening", label: "Module 2B: Listening Comprehension",icon: Headphones, color: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", text: "#a78bfa",  desc: "Listen to audio and answer questions" },
  { key: "speaking",  label: "Module 3: Speaking Assessment",    icon: Mic2,       color: "rgba(251,191,36,0.12)",   border: "rgba(251,191,36,0.3)",   text: "var(--amber-400)", desc: "Speak your answer and get AI evaluation" },
];

const VersantTest = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadModule = async (moduleKey) => {
    setLoading(true);
    setError("");
    setSubmitted(false);
    setResults(null);
    setQuestions([]);
    try {
      const res = await getVersantModule(moduleKey);
      setQuestions(res.data.data);
      setActiveModule(moduleKey);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load module. Make sure the server is running and the database is seeded.");
    } finally {
      setLoading(false);
    }
  };

  const handleMCQSubmit = async (answers) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      // For grammar: single question doc
      // For reading/listening: multiple passage docs — submit per passage
      if (activeModule === "grammar") {
        const res = await submitVersant({ module: activeModule, questionId: String(questions[0]?._id || ""), answers });
        setResults(res.data);
      } else {
        // Group answers by questionId (passage _id)
        const grouped = {};
        answers.forEach((a) => {
          if (!grouped[a.questionId]) grouped[a.questionId] = [];
          grouped[a.questionId].push(a);
        });
        let totalScore = 0, totalCount = 0;
        const allAnswers = [];
        for (const [qId, qAnswers] of Object.entries(grouped)) {
          const res = await submitVersant({ module: activeModule, questionId: qId, answers: qAnswers });
          totalScore += res.data.score;
          totalCount += res.data.total;
          allAnswers.push(...(res.data.answers || []));
        }
        const percentage = totalCount > 0 ? Math.round((totalScore / totalCount) * 100) : 0;
        setResults({ score: totalScore, total: totalCount, percentage, answers: allAnswers });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpeakingSubmit = async ({ questionId, transcript, promptIdx, submitAll }) => {
    if (submitAll) { setSubmitted(true); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await submitVersantSpeaking({ questionId, transcript });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Speaking evaluation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setActiveModule(null);
    setQuestions([]);
    setSubmitted(false);
    setResults(null);
    setError("");
  };

  const activeModuleMeta = MODULES.find((m) => m.key === activeModule);

  return (
    <div className="app-bg min-h-screen">
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px 60px" }}>
        <PageWrapper>
          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            {activeModule ? (
              <button onClick={handleBack}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", marginBottom: "16px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                <ArrowLeft size={14} /> Back to Modules
              </button>
            ) : null}
            <span className="teal-badge inline-flex mb-3" style={{ fontSize: "10px" }}>VERSANT ASSESSMENT</span>
            <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
              {activeModule ? activeModuleMeta?.label : "Versant English Assessment"}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {activeModule ? activeModuleMeta?.desc : "Evaluate your English proficiency across grammar, comprehension, and speaking."}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="banner-error mb-5" style={{ marginBottom: "20px" }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Module selection */}
          {!activeModule && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {MODULES.map(({ key, label, icon: Icon, color, border, text, desc }) => (
                <button key={key} onClick={() => loadModule(key)}
                  style={{ background: "var(--bg-card)", border: `1px solid var(--border-soft)`, borderRadius: "16px", padding: "24px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "var(--bg-card)"; }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: color, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                    <Icon size={20} style={{ color: text }} />
                  </div>
                  <p style={{ fontFamily: "Syne,sans-serif", fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "6px" }}>{label}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Loader2 size={32} style={{ color: "var(--teal-400)", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading module...</p>
            </div>
          )}

          {/* Submitting overlay */}
          {submitting && (
            <div style={{ textAlign: "center", padding: "20px", marginBottom: "16px" }}>
              <Loader2 size={20} style={{ color: "var(--teal-400)", animation: "spin 1s linear infinite", display: "inline-block" }} />
              <span style={{ fontSize: "13px", color: "var(--text-muted)", marginLeft: "10px" }}>Evaluating your answers...</span>
            </div>
          )}

          {/* Active module content */}
          {!loading && activeModule && questions.length > 0 && (
            <>
              {activeModule === "grammar" && (
                <GrammarSection
                  questions={questions}
                  onSubmit={handleMCQSubmit}
                  submitted={submitted}
                  results={results}
                />
              )}
              {activeModule === "reading" && (
                <PassageSection
                  passages={questions}
                  mode="reading"
                  onSubmit={handleMCQSubmit}
                  submitted={submitted}
                  results={results}
                />
              )}
              {activeModule === "listening" && (
                <PassageSection
                  passages={questions}
                  mode="listening"
                  onSubmit={handleMCQSubmit}
                  submitted={submitted}
                  results={results}
                />
              )}
              {activeModule === "speaking" && (
                <SpeakingSection
                  prompts={questions}
                  onSubmit={handleSpeakingSubmit}
                  submitted={submitted}
                  results={results}
                />
              )}
            </>
          )}
        </PageWrapper>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default VersantTest;

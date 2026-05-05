import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, CheckCircle2, XCircle, Lightbulb, Code2, BookOpen, Star } from "lucide-react";
import Editor from "@monaco-editor/react";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import { DSA_PROBLEMS } from "../data/dsaProblems";

const DSASolver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const problem = DSA_PROBLEMS.find((p) => p.id === parseInt(id));

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [testResults, setTestResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const LANGUAGES = [
    { key: "javascript", label: "JavaScript", color: "#f7df1e" },
    { key: "python", label: "Python", color: "#3776ab" },
    { key: "java", label: "Java", color: "#f89820" },
    { key: "cpp", label: "C++", color: "#00599c" },
  ];

  useEffect(() => {
    if (problem) {
      setCode(problem.starterCode[language] || "");
    }
  }, [problem, language]);

  if (!problem) {
    return (
      <div className="app-bg min-h-screen">
        <Navbar />
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>Problem not found.</p>
          <button className="btn-teal" onClick={() => navigate("/question-bank")} style={{ marginTop: "20px" }}>
            Back to Question Bank
          </button>
        </div>
      </div>
    );
  }

  const handleRun = () => {
    setRunning(true);
    setActiveTab("testcases");
    
    // Simulate test execution
    setTimeout(() => {
      const results = problem.testCases.map((tc, i) => ({
        ...tc,
        passed: Math.random() > 0.3, // Mock: 70% pass rate
        actual: i === 0 ? tc.expected : Math.random() > 0.5 ? tc.expected : "[]",
        runtime: `${Math.floor(Math.random() * 50 + 10)}ms`,
      }));
      setTestResults(results);
      setRunning(false);
    }, 1500);
  };

  const handleReset = () => {
    setCode(problem.starterCode[language] || "");
    setTestResults(null);
  };

  const handleSubmit = () => {
    handleRun();
  };

  const passedCount = testResults ? testResults.filter((r) => r.passed).length : 0;
  const totalCount = testResults ? testResults.length : 0;

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      
      <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate("/question-bank")}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft size={14} /> Back to Problems
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className={`diff-badge diff-${problem.difficulty}`}>{problem.difficulty.toUpperCase()}</span>
            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Acceptance: {problem.acceptance}</span>
          </div>
        </div>

        {/* Main split view */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          {/* Left: Problem description */}
          <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              {["description", "editorial", "solutions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: activeTab === tab ? "rgba(20,184,166,0.12)" : "transparent",
                    border: `1px solid ${activeTab === tab ? "rgba(20,184,166,0.3)" : "transparent"}`,
                    color: activeTab === tab ? "var(--teal-400)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
              {activeTab === "description" && (
                <div>
                  <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "white", marginBottom: "12px" }}>
                    {problem.id}. {problem.title}
                  </h1>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                    {problem.tags.map((tag) => (
                      <span key={tag} className="skill-tag neutral" style={{ fontSize: "11px", padding: "4px 10px" }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "24px", whiteSpace: "pre-wrap" }}>
                    {problem.description}
                  </div>

                  {problem.examples.map((ex, i) => (
                    <div key={i} style={{ marginBottom: "20px", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-dim)", marginBottom: "10px" }}>Example {i + 1}:</p>
                      <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "13px", marginBottom: "8px" }}>
                        <p style={{ color: "var(--text-muted)" }}><strong style={{ color: "white" }}>Input:</strong> {ex.input}</p>
                        <p style={{ color: "var(--text-muted)", marginTop: "6px" }}><strong style={{ color: "white" }}>Output:</strong> {ex.output}</p>
                      </div>
                      {ex.explanation && (
                        <p style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "8px" }}>
                          <strong>Explanation:</strong> {ex.explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  <div style={{ marginTop: "24px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "10px" }}>Constraints:</p>
                    <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.8 }}>
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Hints */}
                  <div style={{ marginTop: "28px", padding: "16px", borderRadius: "12px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <button
                      onClick={() => setShowHints(!showHints)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--amber-400)", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginBottom: showHints ? "12px" : 0 }}
                    >
                      <Lightbulb size={16} /> {showHints ? "Hide Hints" : `Show Hints (${problem.hints.length})`}
                    </button>
                    {showHints && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {problem.hints.map((hint, i) => (
                          <p key={i} style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, paddingLeft: "24px", position: "relative" }}>
                            <span style={{ position: "absolute", left: 0, color: "var(--amber-400)", fontWeight: 700 }}>{i + 1}.</span>
                            {hint}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "editorial" && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)" }}>
                  <BookOpen size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
                  <p style={{ fontSize: "14px" }}>Editorial coming soon. Try solving it first!</p>
                </div>
              )}

              {activeTab === "solutions" && (
                <div>
                  <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "16px" }}>
                    Solution
                  </h2>
                  {!showSolution ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", border: "1px dashed var(--border)", borderRadius: "12px" }}>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                        Try solving the problem first before viewing the solution.
                      </p>
                      <button className="btn-outline" onClick={() => setShowSolution(true)} style={{ padding: "9px 18px", fontSize: "13px" }}>
                        Reveal Solution
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-soft)" }}>
                      <pre style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6, overflow: "auto", whiteSpace: "pre-wrap" }}>
                        {problem.solution}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "testcases" && (
                <div>
                  <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "16px" }}>
                    Test Results
                  </h2>
                  {!testResults ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)", fontSize: "14px" }}>
                      Run your code to see test results here.
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "12px", background: passedCount === totalCount ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${passedCount === totalCount ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          {passedCount === totalCount ? (
                            <CheckCircle2 size={20} style={{ color: "#4ade80" }} />
                          ) : (
                            <XCircle size={20} style={{ color: "var(--danger-400)" }} />
                          )}
                          <p style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>
                            {passedCount === totalCount ? "All Tests Passed!" : `${passedCount} / ${totalCount} Tests Passed`}
                          </p>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {passedCount === totalCount ? "Great job! Your solution is correct." : "Some test cases failed. Review the results below."}
                        </p>
                      </div>

                      {testResults.map((result, i) => (
                        <div key={i} style={{ marginBottom: "12px", padding: "14px", borderRadius: "10px", background: "var(--bg-card)", border: `1px solid ${result.passed ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {result.passed ? (
                                <CheckCircle2 size={16} style={{ color: "#4ade80" }} />
                              ) : (
                                <XCircle size={16} style={{ color: "var(--danger-400)" }} />
                              )}
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>Test Case {i + 1}</span>
                            </div>
                            <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "JetBrains Mono,monospace" }}>{result.runtime}</span>
                          </div>
                          <div style={{ fontSize: "12px", fontFamily: "JetBrains Mono,monospace", color: "var(--text-muted)" }}>
                            <p><strong style={{ color: "white" }}>Input:</strong> {result.input}</p>
                            <p style={{ marginTop: "6px" }}><strong style={{ color: "white" }}>Expected:</strong> {result.expected}</p>
                            {!result.passed && (
                              <p style={{ marginTop: "6px", color: "var(--danger-400)" }}><strong>Actual:</strong> {result.actual}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Code editor */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Editor header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Code2 size={16} style={{ color: "var(--teal-400)" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>Code</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Custom language dropdown */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setLangDropdownOpen((o) => !o)}
                    onBlur={() => setTimeout(() => setLangDropdownOpen(false), 150)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: "130px",
                      justifyContent: "space-between",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <span style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: LANGUAGES.find((l) => l.key === language)?.color,
                        flexShrink: 0,
                      }} />
                      {LANGUAGES.find((l) => l.key === language)?.label}
                    </span>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.6, transform: langDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {langDropdownOpen && (
                    <div style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      minWidth: "150px",
                      background: "#1a2740",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      overflow: "hidden",
                      zIndex: 100,
                      boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                    }}>
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.key}
                          onMouseDown={() => {
                            setLanguage(lang.key);
                            setLangDropdownOpen(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            background: language === lang.key ? "rgba(20,184,166,0.12)" : "transparent",
                            border: "none",
                            color: language === lang.key ? "var(--teal-400)" : "var(--text-muted)",
                            fontSize: "13px",
                            fontWeight: language === lang.key ? 700 : 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            textAlign: "left",
                            transition: "background 0.15s",
                            fontFamily: "DM Sans, sans-serif",
                          }}
                          onMouseEnter={(e) => {
                            if (language !== lang.key) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            if (language !== lang.key) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span style={{
                            width: "10px", height: "10px", borderRadius: "50%",
                            background: lang.color, flexShrink: 0,
                            boxShadow: `0 0 6px ${lang.color}88`,
                          }} />
                          {lang.label}
                          {language === lang.key && (
                            <svg style={{ marginLeft: "auto" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2.5 7l3.5 3.5 5.5-6" stroke="var(--teal-400)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-strong)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : language}
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  padding: { top: 16, bottom: 16 },
                  fontFamily: "JetBrains Mono, Consolas, monospace",
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={handleRun}
                disabled={running}
                className="btn-outline"
                style={{
                  padding: "10px 20px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  opacity: running ? 0.6 : 1,
                }}
              >
                <Play size={14} /> {running ? "Running..." : "Run Code"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={running}
                className="btn-teal"
                style={{
                  padding: "10px 24px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  opacity: running ? 0.6 : 1,
                }}
              >
                <CheckCircle2 size={14} /> Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSASolver;

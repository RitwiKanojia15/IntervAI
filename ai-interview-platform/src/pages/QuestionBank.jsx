import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, ChevronRight, Zap, Code2, Brain, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";
import { DSA_PROBLEMS } from "../data/dsaProblems";

const CATEGORIES = [
  { icon: Code2,  label: "DSA",           count: 142, color: "rgba(99,102,241,0.15)",  text: "#a5b4fc" },
  { icon: Brain,  label: "System Design", count: 64,  color: "rgba(20,184,166,0.12)",  text: "var(--teal-400)" },
  { icon: Zap,    label: "Frontend",      count: 88,  color: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
  { icon: Users,  label: "Behavioral",    count: 55,  color: "rgba(236,72,153,0.12)",  text: "#f9a8d4" },
];

// Merge DSA problems from data file with the static list
const STATIC_QUESTIONS = [
  { id:"s2", title:"Design a URL Shortener",      category:"System Design", diff:"medium", tags:["system","scalability"],     asked:"Uber, Twitter",   hasSolver: false },
  { id:"s3", title:"React Hooks deep-dive",       category:"Frontend",      diff:"medium", tags:["react","hooks","state"],    asked:"Meta, Airbnb",    hasSolver: false },
  { id:"s5", title:"Tell me about a conflict",    category:"Behavioral",    diff:"easy",   tags:["leadership","conflict"],    asked:"All companies",   hasSolver: false },
  { id:"s6", title:"Design Twitter Feed",         category:"System Design", diff:"hard",   tags:["feed","ranking","system"],  asked:"Twitter, Meta",   hasSolver: false },
  { id:"s7", title:"Virtual DOM explanation",     category:"Frontend",      diff:"easy",   tags:["react","dom","rendering"],  asked:"Meta, Netflix",   hasSolver: false },
];

const DSA_QUESTIONS = DSA_PROBLEMS.map((p) => ({
  id: p.id,
  title: p.title,
  category: "DSA",
  diff: p.difficulty,
  tags: p.tags.map((t) => t.toLowerCase()),
  asked: p.companies.join(", "),
  hasSolver: true,
}));

const ALL_QUESTIONS = [...DSA_QUESTIONS, ...STATIC_QUESTIONS];

const QuestionBank = () => {
  const navigate = useNavigate();
  const [search, setSearch]   = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDiff, setActiveDiff]         = useState("All");
  const [saved, setSaved] = useState(new Set());

  const filtered = ALL_QUESTIONS.filter(q => {
    const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some(t => t.includes(search.toLowerCase()));
    const matchCat  = activeCategory === "All" || q.category === activeCategory;
    const matchDiff = activeDiff === "All" || q.diff === activeDiff.toLowerCase();
    return matchSearch && matchCat && matchDiff;
  });

  const toggleSave = (id) => {
    const s = new Set(saved);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSaved(s);
  };

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px" }}>
        <PageWrapper>
          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <span className="teal-badge inline-flex mb-2" style={{ fontSize: "10px" }}>
                <BookOpen size={10} /> QUESTION BANK
              </span>
              <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "26px", fontWeight: 800, color: "white" }}>
                Practice Questions
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                349 curated questions across 4 categories
              </p>
            </div>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6 fade-up">
            {CATEGORIES.map(({ icon: Icon, label, count, color, text }) => (
              <button key={label}
                onClick={() => setActiveCategory(activeCategory === label ? "All" : label)}
                style={{
                  background: activeCategory === label ? color : "var(--bg-card)",
                  border: `1px solid ${activeCategory === label ? text.replace("var(--teal-400)","rgba(20,184,166,0.4)") : "var(--border)"}`,
                  borderRadius: "14px", padding: "18px", cursor: "pointer",
                  textAlign: "left", transition: "all 0.2s", transform: activeCategory === label ? "translateY(-2px)" : "none"
                }}>
                <div style={{ width: "36px", height: "36px", background: color, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                  <Icon size={17} style={{ color: text }} />
                </div>
                <p style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "14px", color: "white", marginBottom: "3px" }}>{label}</p>
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2.5 mb-5 items-center fade-up delay-1">
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "9px 14px", flex: 1, maxWidth: "320px" }}>
              <Search size={14} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search questions..."
                style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: "13px", width: "100%", fontFamily: "DM Sans,sans-serif" }}
              />
            </div>
            {/* Difficulty filter */}
            {["All", "Easy", "Medium", "Hard"].map(d => (
              <button key={d} onClick={() => setActiveDiff(d)}
                style={{
                  padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                  background: activeDiff === d ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${activeDiff === d ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: activeDiff === d ? "var(--teal-400)" : "var(--text-muted)",
                  cursor: "pointer", fontFamily: "DM Sans,sans-serif"
                }}>{d}</button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-dim)" }}>{filtered.length} results</span>
          </div>

          {/* Question list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} className="fade-up delay-2">
            {filtered.map(q => (
              <div
                key={q.id}
                className="qbank-card"
                onClick={() => q.hasSolver ? navigate(`/question-bank/${q.id}`) : navigate(`/practice/${q.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span className={`diff-badge diff-${q.diff}`}>{q.diff}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{q.category}</span>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "white", marginBottom: "8px" }}>{q.title}</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    {q.tags.map(t => (
                      <span key={t} className="skill-tag neutral" style={{ fontSize: "10px", padding: "3px 8px" }}>{t}</span>
                    ))}
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", marginLeft: "4px" }}>Asked at: {q.asked}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                  <button onClick={(e) => { e.stopPropagation(); toggleSave(q.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: saved.has(q.id) ? "#fbbf24" : "var(--text-dim)", transition: "color 0.2s" }}>
                    {saved.has(q.id) ? "★" : "☆"}
                  </button>
                  <button
                    className="btn-teal"
                    onClick={(e) => {
                      e.stopPropagation();
                      q.hasSolver ? navigate(`/question-bank/${q.id}`) : navigate(`/practice/${q.id}`);
                    }}
                    style={{ padding: "7px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                  >
                    Practice <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", fontSize: "14px" }}>
                No questions match your filters. Try a different search.
              </div>
            )}
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};
export default QuestionBank;

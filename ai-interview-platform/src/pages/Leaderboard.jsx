import React, { useState } from "react";
import { Trophy, Flame, TrendingUp } from "lucide-react";
import Navbar from "../components/Navbar";
import PageWrapper from "../components/PageWrapper";

const LEADERS = [
  { rank:1,  name:"Aryan Mehta",    avatar:"A", score:962, streak:14, interviews:31, badge:"🥇", level:"Expert"      },
  { rank:2,  name:"Priya Sharma",   avatar:"P", score:941, streak:9,  interviews:28, badge:"🥈", level:"Expert"      },
  { rank:3,  name:"Karan Singh",    avatar:"K", score:908, streak:7,  interviews:24, badge:"🥉", level:"Advanced"    },
  { rank:4,  name:"Sneha Patel",    avatar:"S", score:877, streak:5,  interviews:19, badge:"",   level:"Advanced"    },
  { rank:5,  name:"Rohan Gupta",    avatar:"R", score:850, streak:4,  interviews:18, badge:"",   level:"Intermediate"},
  { rank:6,  name:"Meera Nair",     avatar:"M", score:821, streak:3,  interviews:15, badge:"",   level:"Intermediate"},
  { rank:7,  name:"Dev Joshi",      avatar:"D", score:798, streak:6,  interviews:14, badge:"",   level:"Intermediate"},
  { rank:8,  name:"You",            avatar:"U", score:735, streak:3,  interviews:11, badge:"",   level:"Beginner", isMe: true },
];

const Leaderboard = () => {
  const [scope, setScope] = useState("global");

  const top3 = LEADERS.slice(0, 3);
  const rest  = LEADERS.slice(3);

  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "28px 24px" }}>
        <PageWrapper>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <span className="teal-badge inline-flex mb-3" style={{ fontSize: "10px" }}>
              <Trophy size={10} /> LEADERBOARD
            </span>
            <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "28px", fontWeight: 800, color: "white", marginBottom: "8px" }}>
              Top Performers
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Compete with peers, climb the ranks, earn your spot at the top
            </p>
            <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "16px" }}>
              {["global","weekly","friends"].map(s => (
                <button key={s} onClick={() => setScope(s)}
                  style={{
                    padding: "7px 18px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                    background: scope === s ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${scope === s ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.08)"}`,
                    color: scope === s ? "var(--teal-400)" : "var(--text-muted)",
                    cursor: "pointer", fontFamily: "DM Sans,sans-serif", textTransform: "capitalize"
                  }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Podium top 3 */}
          <div className="fade-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "12px", marginBottom: "28px" }}>
            {[top3[1], top3[0], top3[2]].map((p, i) => {
              const heights = ["80px","100px","70px"];
              const orders  = [1,0,2];
              const rankColors = ["#c0c0c0","#fbbf24","#cd7f32"];
              const actualRank = orders[i];
              return (
                <div key={p.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "160px" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#0d9488,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "white", marginBottom: "8px", position: "relative", boxShadow: `0 0 20px ${rankColors[actualRank]}40` }}>
                    {p.avatar}
                    <div style={{ position: "absolute", top: "-8px", right: "-8px", fontSize: "16px" }}>{p.badge}</div>
                  </div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "white", marginBottom: "3px", textAlign: "center" }}>{p.name}</p>
                  <p style={{ fontSize: "13px", fontWeight: 800, color: rankColors[actualRank], fontFamily: "JetBrains Mono,monospace" }}>{p.score}</p>
                  <div style={{
                    width: "100%", height: heights[i],
                    background: `linear-gradient(180deg, ${rankColors[actualRank]}20, ${rankColors[actualRank]}08)`,
                    border: `1px solid ${rankColors[actualRank]}30`,
                    borderRadius: "10px 10px 0 0", marginTop: "10px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px", fontWeight: 800, color: rankColors[actualRank],
                    fontFamily: "Syne,sans-serif"
                  }}>#{p.rank}</div>
                </div>
              );
            })}
          </div>

          {/* Rest of rankings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} className="fade-up delay-1">
            {rest.map((p) => (
              <div key={p.rank} style={{
                display: "flex", alignItems: "center", gap: "14px",
                background: p.isMe ? "rgba(20,184,166,0.08)" : "var(--bg-card)",
                border: `1px solid ${p.isMe ? "rgba(20,184,166,0.3)" : "var(--border)"}`,
                borderRadius: "12px", padding: "14px 18px",
                transition: "all 0.2s"
              }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-dim)", fontFamily: "JetBrains Mono,monospace", width: "24px" }}>#{p.rank}</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: p.isMe ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "white" }}>{p.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>
                    {p.name} {p.isMe && <span className="teal-badge" style={{ fontSize: "9px", marginLeft: "6px" }}>YOU</span>}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>{p.level} · {p.interviews} interviews</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f97316", fontSize: "12px", fontWeight: 700 }}>
                  <Flame size={12} /> {p.streak}d
                </div>
                <span style={{ fontSize: "15px", fontWeight: 800, color: p.isMe ? "var(--teal-400)" : "var(--text-primary)", fontFamily: "JetBrains Mono,monospace" }}>{p.score}</span>
              </div>
            ))}
          </div>

          {/* Points breakdown CTA */}
          <div style={{ marginTop: "20px", background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <TrendingUp size={22} style={{ color: "var(--teal-400)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>Climb 3 more ranks to reach Top 5</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>Complete 2 more interviews this week to earn 115 XP</p>
            </div>
            <button className="btn-teal" style={{ fontSize: "13px", padding: "9px 18px", flexShrink: 0 }}>Practice Now</button>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};
export default Leaderboard;

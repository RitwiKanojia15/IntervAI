/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart2,
  Bell,
  BookOpen,
  ChevronDown,
  FileText,
  FlaskConical,
  Flame,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mic2,
  Search,
  Settings,
  Star,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";

const NAV_LINKS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FlaskConical, label: "Take Test", path: "/take-test" },
  { icon: Zap, label: "Live Tests", path: "/live-tests" },
  { icon: Mic2, label: "Interview", path: "/interview" },
  { icon: FileText, label: "Resume", path: "/upload-resume" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: BookOpen, label: "Question Bank", path: "/question-bank" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
];


const UserMenuItem = ({ icon: Icon, label, onClick, danger = false }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: "100%",
      border: "none",
      background: "transparent",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "11px 14px",
      color: danger ? "#fca5a5" : "var(--text-muted)",
      fontSize: "13px",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.16s ease",
    }}
    onMouseEnter={(ev) => {
      ev.currentTarget.style.background = danger
        ? "rgba(248,113,113,0.12)"
        : "rgba(255,255,255,0.06)";
      ev.currentTarget.style.color = danger ? "#fecaca" : "var(--text-primary)";
    }}
    onMouseLeave={(ev) => {
      ev.currentTarget.style.background = "transparent";
      ev.currentTarget.style.color = danger ? "#fca5a5" : "var(--text-muted)";
    }}
  >
    <Icon size={14} />
    {label}
  </button>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser]     = useState(false);
  const [searchVal, setSearchVal]   = useState("");

  const notifRef = useRef(null);
  const userRef  = useRef(null);

  // Dynamic data from stats
  const streak       = stats?.currentStreak ?? 0;
  const notifications = stats?.notifications ?? [];
  const unreadCount  = notifications.filter((n) => n.unread).length;

  // Map notification type to icon component
  const iconForType = (type) => {
    switch (type) {
      case "score":       return Target;
      case "streak":      return Flame;
      case "resume":      return FileText;
      case "achievement": return Trophy;
      case "reminder":    return Bell;
      default:            return Target;
    }
  };

  const initial = (user?.name?.[0] || user?.email?.[0] || "G").toUpperCase();
  const userName = user?.name || "Guest User";

  useEffect(() => {
    const onClick = (ev) => {
      if (notifRef.current && !notifRef.current.contains(ev.target)) {
        setShowNotifs(false);
      }
      if (userRef.current && !userRef.current.contains(ev.target)) {
        setShowUser(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="top-navbar">
      <button
        type="button"
        className="navbar-logo"
        onClick={() => navigate("/dashboard")}
        style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
      >
        <span className="navbar-logo-icon">
          <Zap size={16} />
        </span>
        <span>
          Interv<span style={{ color: "var(--teal-300)" }}>AI</span>
        </span>
      </button>

      <div className="navbar-divider" />

      <div className="navbar-links">
        {NAV_LINKS.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            type="button"
            className={`nav-link ${location.pathname === path ? "active" : ""}`}
            onClick={() => navigate(path)}
          >
            <span className="nav-dot" />
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <Search size={13} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
          <input
            value={searchVal}
            onChange={(ev) => setSearchVal(ev.target.value)}
            placeholder="Search questions, topics..."
          />
          {searchVal ? (
            <button
              type="button"
              onClick={() => setSearchVal("")}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-dim)",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              x
            </button>
          ) : null}
        </div>

        <div className="xp-chip">
          <Flame size={12} color="#fb923c" />
          {streak || 0}
        </div>

        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            type="button"
            className="notif-btn"
            onClick={() => {
              setShowNotifs((prev) => !prev);
              setShowUser(false);
            }}
          >
            <Bell size={15} />
            {unreadCount > 0 ? <span className="notif-badge" /> : null}
          </button>

          {showNotifs ? (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                width: "336px",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid var(--border-soft)",
                background: "linear-gradient(170deg, rgba(18,30,48,0.98), rgba(12,22,36,0.98))",
                boxShadow: "0 24px 56px rgba(0,0,0,0.5)",
                zIndex: 140,
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: "14px", fontWeight: 700 }}>
                  Notifications
                </span>
                <span className="teal-badge" style={{ fontSize: "9px", padding: "4px 9px" }}>
                  {unreadCount} new
                </span>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                  No notifications yet. Complete an interview to get started!
                </div>
              ) : notifications.map((item) => {
                const Icon = iconForType(item.type);
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "11px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      background: item.unread ? "rgba(20,184,166,0.08)" : "transparent",
                    }}
                  >
                    <span
                      style={{
                        width: "28px", height: "28px", borderRadius: "8px",
                        border: "1px solid var(--border-soft)", display: "inline-flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                        color: "var(--teal-300)", background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <Icon size={14} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.35 }}>{item.text}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>{item.time}</p>
                    </div>
                    {item.unread && (
                      <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--teal-400)", marginTop: "6px", flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  color: "var(--teal-300)",
                  padding: "11px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                View all notifications
              </button>
            </div>
          ) : null}
        </div>

        <div style={{ position: "relative" }} ref={userRef}>
          <button
            type="button"
            className="avatar-btn"
            onClick={() => {
              setShowUser((prev) => !prev);
              setShowNotifs(false);
            }}
          >
            <span className="avatar-ring">
              {initial}
              <span className="avatar-online" />
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                maxWidth: "110px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </span>
            <ChevronDown
              size={13}
              style={{
                color: "var(--text-dim)",
                transform: showUser ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>

          {showUser ? (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                width: "248px",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid var(--border-soft)",
                background: "linear-gradient(170deg, rgba(18,30,48,0.98), rgba(12,22,36,0.98))",
                boxShadow: "0 24px 56px rgba(0,0,0,0.5)",
                zIndex: 140,
              }}
            >
              <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="avatar-ring" style={{ width: "36px", height: "36px", fontSize: "14px" }}>
                    {initial}
                    <span className="avatar-online" />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{userName}</p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-dim)",
                        maxWidth: "160px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user?.email || "guest@intervai.local"}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span className="teal-badge" style={{ fontSize: "9px", padding: "4px 9px" }}>
                    Student
                  </span>
                  <span
                    style={{
                      borderRadius: "999px",
                      border: "1px solid rgba(251,191,36,0.28)",
                      background: "rgba(251,191,36,0.12)",
                      color: "#fbbf24",
                      padding: "4px 9px",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {streak} Streak
                  </span>
                </div>
              </div>

              <UserMenuItem icon={User} label="Profile" onClick={() => navigate("/profile")} />
              <UserMenuItem icon={BarChart2} label="My Analytics" onClick={() => navigate("/analytics")} />
              <UserMenuItem icon={Star} label="Achievements" onClick={() => navigate("/achievements")} />
              <UserMenuItem icon={Settings} label="Settings" onClick={() => navigate("/settings")} />
              <UserMenuItem icon={HelpCircle} label="Help & Support" onClick={() => {}} />

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "4px" }}>
                <UserMenuItem icon={LogOut} label="Sign out" onClick={onLogout} danger />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

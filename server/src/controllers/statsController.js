const asyncHandler = require("../utils/asyncHandler");
const Interview = require("../models/Interview");
const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

const softAuth = async (req) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const decoded = verifyToken(header.split(" ")[1]);
      return await User.findById(decoded.id).select("-password");
    }
  } catch { /* ignore */ }
  return null;
};

// ── GET /api/stats/me ─────────────────────────────────────────────────────────
// Returns all dynamic stats for the logged-in user
const getMyStats = asyncHandler(async (req, res) => {
  const user = await softAuth(req);
  if (!user) return res.status(200).json({ stats: null });

  const sessions = await Interview.find({ userId: user._id, status: "completed" })
    .sort({ completedAt: -1 })
    .lean();

  if (sessions.length === 0) {
    return res.status(200).json({
      stats: {
        avgScore: 0, totalInterviews: 0, hourspracticed: 0,
        currentStreak: 0, bestStreak: 0,
        scoreTrend: [], heatmap: [], recentSessions: [],
        skillBreakdown: {}, communicationAvg: { fluency: 0, confidence: 0, clarity: 0 },
        notifications: [],
      },
    });
  }

  // ── Avg score ──
  const avgScore = Math.round(
    sessions.reduce((s, i) => s + (i.overallScore || 0), 0) / sessions.length
  );

  // ── Total interviews ──
  const totalInterviews = sessions.length;

  // ── Hours practiced (estimate: avg 8 min per question) ──
  const totalMinutes = sessions.reduce((s, i) => s + (i.answers?.length || 0) * 8, 0);
  const hourspracticed = Math.round((totalMinutes / 60) * 10) / 10;

  // ── Streak calculation ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique activity days (interviews + any activity)
  const activityDays = new Set(
    sessions.map((s) => {
      const d = new Date(s.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let checkDay = new Date(today);

  // Current streak: count backwards from today
  for (let i = 0; i < 365; i++) {
    if (activityDays.has(checkDay.getTime())) {
      currentStreak++;
      checkDay.setDate(checkDay.getDate() - 1);
    } else if (i === 0) {
      // Today has no activity — check yesterday
      checkDay.setDate(checkDay.getDate() - 1);
      if (!activityDays.has(checkDay.getTime())) break;
    } else {
      break;
    }
  }

  // Best streak: scan all days
  const sortedDays = [...activityDays].sort((a, b) => a - b);
  tempStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (sortedDays[i] - sortedDays[i - 1]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, currentStreak, sortedDays.length > 0 ? 1 : 0);

  // ── Score trend (last 7 days) ──
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const scoreTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const daySessions = sessions.filter((s) => {
      const sd = new Date(s.completedAt);
      sd.setHours(0, 0, 0, 0);
      return sd.getTime() === d.getTime();
    });
    return {
      label: days[d.getDay()],
      score: daySessions.length > 0
        ? Math.round(daySessions.reduce((s, i) => s + (i.overallScore || 0), 0) / daySessions.length)
        : 0,
      sessions: daySessions.length,
    };
  });

  // ── Heatmap (last 49 days = 7 weeks) ──
  const heatmap = Array.from({ length: 49 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (48 - i));
    const count = sessions.filter((s) => {
      const sd = new Date(s.completedAt);
      sd.setHours(0, 0, 0, 0);
      return sd.getTime() === d.getTime();
    }).length;
    return count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
  });

  // ── Skill breakdown ──
  const skillMap = {};
  sessions.forEach((s) => {
    (s.answers || []).forEach((a) => {
      const skill = a.skill || "General";
      if (!skillMap[skill]) skillMap[skill] = { total: 0, count: 0 };
      skillMap[skill].total += a.score || 0;
      skillMap[skill].count += 1;
    });
  });
  const skillBreakdown = {};
  Object.entries(skillMap).forEach(([skill, data]) => {
    skillBreakdown[skill] = Math.round((data.total / (data.count * 10)) * 100);
  });

  // ── Communication avg ──
  const commSessions = sessions.filter((s) => s.communicationScore?.fluency > 0);
  const communicationAvg = commSessions.length > 0 ? {
    fluency:    Math.round(commSessions.reduce((s, i) => s + (i.communicationScore.fluency || 0), 0) / commSessions.length),
    confidence: Math.round(commSessions.reduce((s, i) => s + (i.communicationScore.confidence || 0), 0) / commSessions.length),
    clarity:    Math.round(commSessions.reduce((s, i) => s + (i.communicationScore.clarity || 0), 0) / commSessions.length),
  } : { fluency: 0, confidence: 0, clarity: 0 };

  // ── Recent sessions ──
  const recentSessions = sessions.slice(0, 5).map((s) => ({
    sessionId: s._id.toString(),
    role: s.role,
    skills: s.skills,
    score: s.overallScore,
    questionsAnswered: s.answers?.length || 0,
    completedAt: s.completedAt,
  }));

  // ── Dynamic notifications ──
  const notifications = buildNotifications({
    sessions, avgScore, currentStreak, totalInterviews, user,
  });

  res.status(200).json({
    stats: {
      avgScore, totalInterviews, hourspracticed,
      currentStreak, bestStreak,
      scoreTrend, heatmap, recentSessions,
      skillBreakdown, communicationAvg,
      notifications,
    },
  });
});

// ── Build contextual notifications from user activity ─────────────────────────
const buildNotifications = ({ sessions, avgScore, currentStreak, totalInterviews, user }) => {
  const notifs = [];
  const now = new Date();

  const fmtAgo = (date) => {
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Most recent session score improvement
  if (sessions.length >= 2) {
    const latest = sessions[0].overallScore || 0;
    const prev   = sessions[1].overallScore || 0;
    const diff   = latest - prev;
    if (diff > 0) {
      notifs.push({ id: "score-improve", type: "score", icon: "Target",
        text: `Your interview score improved by ${diff}%`, time: fmtAgo(sessions[0].completedAt), unread: true });
    } else if (diff < 0) {
      notifs.push({ id: "score-drop", type: "score", icon: "TrendingDown",
        text: `Score dropped by ${Math.abs(diff)}% — keep practicing!`, time: fmtAgo(sessions[0].completedAt), unread: true });
    }
  }

  // Streak notification
  if (currentStreak >= 2) {
    notifs.push({ id: "streak", type: "streak", icon: "Flame",
      text: `${currentStreak}-day practice streak. Keep going! 🔥`, time: "Today", unread: currentStreak >= 3 });
  }

  // Resume uploaded
  if (user?.resume?.uploadedAt) {
    notifs.push({ id: "resume", type: "resume", icon: "FileText",
      text: "Resume analysis complete", time: fmtAgo(user.resume.uploadedAt), unread: false });
  }

  // Achievement: first interview
  if (totalInterviews >= 1) {
    notifs.push({ id: "ach-first", type: "achievement", icon: "Trophy",
      text: "Earned 'First Interview' badge 🎯", time: fmtAgo(sessions[sessions.length - 1]?.completedAt || now), unread: false });
  }

  // Achievement: 5 interviews
  if (totalInterviews >= 5) {
    notifs.push({ id: "ach-5", type: "achievement", icon: "Star",
      text: "Earned 'Consistent Learner' badge — 5 interviews done!", time: fmtAgo(sessions[4]?.completedAt || now), unread: false });
  }

  // High score
  if (avgScore >= 80) {
    notifs.push({ id: "high-score", type: "score", icon: "Target",
      text: `Excellent! Your average score is ${avgScore}% — top performer!`, time: "Recently", unread: false });
  }

  // Encouragement if no recent activity
  const lastSession = sessions[0];
  if (lastSession) {
    const daysSince = Math.floor((now - new Date(lastSession.completedAt)) / (1000 * 60 * 60 * 24));
    if (daysSince >= 3) {
      notifs.push({ id: "inactive", type: "reminder", icon: "Bell",
        text: `It's been ${daysSince} days since your last session. Time to practice!`, time: `${daysSince}d ago`, unread: true });
    }
  }

  return notifs.slice(0, 6);
};

module.exports = { getMyStats };

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const testRoutes = require("./routes/testRoutes");
const liveTestRoutes = require("./routes/liveTestRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const authRoutes = require("./routes/authRoutes");
const versantRoutes = require("./routes/versantRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const statsRoutes = require("./routes/statsRoutes");
const gtgRoutes = require("./routes/groupDiscussionRoutes");
const gdRoutes  = require("./routes/gdRoutes");

const app = express();
const allowedOrigin = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json());

// Session needed only for Passport OAuth handshake
app.use(session({
  secret: process.env.SESSION_SECRET || "intervai_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 }, // 10 min — just for OAuth flow
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/test", testRoutes);
app.use("/api/live-tests", liveTestRoutes);
app.use("/api/live", liveTestRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/versant", versantRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/gtg", gtgRoutes);
app.use("/api/gd",  gdRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || "Unexpected server error.",
    ...(error.details ? { details: error.details } : {}),
  });
});

module.exports = app;

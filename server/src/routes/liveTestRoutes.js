const express = require("express");
const {
  createLive,
  createTest,
  getLiveLeaderboard,
  getLiveSessionByTest,
  getLeaderboard,
  getSession,
  joinLive,
  joinTest,
  recordWarning,
  saveLiveAnswer,
  saveAnswers,
  startTestDirect,
  startTest,
  submitLive,
  submitTest,
} = require("../controllers/liveTestController");

const router = express.Router();

router.post("/", createTest);
router.post("/join", joinLive);
router.post("/:testId/start", startTest);
router.get("/:testId/session", getSession);
router.patch("/:testId/answers", saveAnswers);
router.post("/:testId/submit", submitTest);
router.get("/:testId/leaderboard", getLeaderboard);
router.post("/:testId/warnings", recordWarning);

// Alias contract: /api/live/*
router.post("/create", createLive);
router.post("/start/:testId", startTestDirect);
router.get("/session/:testId", getLiveSessionByTest);
router.post("/answer", saveLiveAnswer);
router.post("/submit", submitLive);
router.get("/leaderboard/:testId", getLiveLeaderboard);

module.exports = router;

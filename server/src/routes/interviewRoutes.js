const express = require("express");
const {
  startInterview,
  getQuestion,
  submitAnswer,
  evaluateAnswer,
  getResult,
  getHistory,
} = require("../controllers/interviewController");

const router = express.Router();

router.post("/start",              startInterview);
router.get("/question/:sessionId", getQuestion);
router.post("/answer",             submitAnswer);
router.post("/evaluate",           evaluateAnswer);
router.get("/result/:sessionId",   getResult);
router.get("/history",             getHistory);

module.exports = router;

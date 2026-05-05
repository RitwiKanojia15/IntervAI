const express = require("express");
const { getModule, submitAnswers, submitSpeaking } = require("../controllers/versantController");

const router = express.Router();

// Public routes (auth optional — userId attached if token present)
router.get("/module/:type", getModule);
router.post("/submit", submitAnswers);
router.post("/speaking", submitSpeaking);

module.exports = router;

const express = require("express");
const { evaluateAnswer, startTest, submitTest } = require("../controllers/testController");

const router = express.Router();

router.get("/start", startTest);
router.post("/answer", evaluateAnswer);
router.post("/submit", submitTest);

module.exports = router;

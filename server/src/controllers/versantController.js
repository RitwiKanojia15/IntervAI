const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const {
  getGrammarQuestions,
  getReadingPassages,
  getListeningPassages,
  getSpeakingPrompts,
  submitMCQ,
  evaluateSpeaking,
} = require("../services/versantService");

// GET /api/versant/module/:type
const getModule = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const count = parseInt(req.query.count) || undefined;

  let data;
  switch (type) {
    case "grammar":
      data = await getGrammarQuestions(count || 20);
      break;
    case "reading":
      data = await getReadingPassages(count || 5);
      break;
    case "listening":
      data = await getListeningPassages(count || 5);
      break;
    case "speaking":
      data = await getSpeakingPrompts(count || 3);
      break;
    default:
      throw new AppError(`Unknown module type: ${type}`, 400);
  }

  res.status(200).json({ type, data });
});

// POST /api/versant/submit
const submitAnswers = asyncHandler(async (req, res) => {
  const { module, questionId, answers } = req.body;
  if (!module || !questionId || !Array.isArray(answers)) {
    throw new AppError("module, questionId, and answers[] are required.", 400);
  }

  const userId = req.user?._id || null;
  const result = await submitMCQ({ module, questionId, answers, userId });
  res.status(200).json({ message: "Submitted successfully.", ...result });
});

// POST /api/versant/speaking
const submitSpeaking = asyncHandler(async (req, res) => {
  const { questionId, transcript } = req.body;
  if (!questionId || !transcript) {
    throw new AppError("questionId and transcript are required.", 400);
  }

  const userId = req.user?._id || null;
  const result = await evaluateSpeaking({ questionId, transcript, userId });
  res.status(200).json({ message: "Speaking evaluated.", ...result });
});

module.exports = { getModule, submitAnswers, submitSpeaking };

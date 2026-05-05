const Question = require("../models/Question");
const TestSession = require("../models/TestSession");
const {
  buildAdaptivePool,
  buildQuestionMatch,
  calculateSubmissionResult,
  getNextDifficulty,
  normalizeCount,
  sampleQuestions,
  sanitizeQuestion,
  shuffleArray,
} = require("../utils/testUtils");

const fetchMixedQuestions = async () => {
  const quotas = [
    { category: "quantitative", count: 5 },
    { category: "logical-reasoning", count: 5 },
    { category: "technical", count: 5 },
  ];

  const selected = [];

  for (const quota of quotas) {
    const questions = await sampleQuestions({ category: quota.category }, quota.count);
    selected.push(...questions);
  }

  return shuffleArray(selected);
};

const startTest = async (req, res) => {
  try {
    const { category, topic, difficulty, adaptive, skills } = req.query;
    const count = category === "mixed" ? 15 : normalizeCount(req.query.count, 10);

    if (!category) {
      return res.status(400).json({ message: "category is required." });
    }

    let questionDocs = [];
    let mode = "standard";

    if (category === "mixed") {
      mode = "mixed";
      questionDocs = await fetchMixedQuestions();
    } else {
      const match = buildQuestionMatch({ category, topic, difficulty, skills });
      questionDocs =
        adaptive === "true" && !difficulty
          ? await buildAdaptivePool(match, count)
          : await sampleQuestions(match, count);
    }

    if (questionDocs.length === 0) {
      return res.status(404).json({ message: "No questions found for the selected test." });
    }

    const session = await TestSession.create({
      mode,
      category: category === "mixed" ? null : category,
      topic: topic || null,
      difficulty: difficulty || null,
      requestedCount: count,
      questionIds: questionDocs.map((question) => question._id),
      total: questionDocs.length,
    });

    return res.status(200).json({
      sessionId: session._id.toString(),
      mode,
      questions: questionDocs.map(sanitizeQuestion),
      meta: {
        count: questionDocs.length,
        category,
        topic: topic || null,
        difficulty: difficulty || null,
        adaptiveEnabled: adaptive === "true",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to start test.", error: error.message });
  }
};

const evaluateAnswer = async (req, res) => {
  try {
    const { sessionId, questionId, selectedOptionId, timeSpentSec = 0 } = req.body;

    if (!sessionId || !questionId) {
      return res.status(400).json({ message: "sessionId and questionId are required." });
    }

    const session = await TestSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Test session not found." });
    }

    const isPartOfSession = session.questionIds.some(
      (storedQuestionId) => storedQuestionId.toString() === questionId
    );

    if (!isPartOfSession) {
      return res.status(400).json({ message: "Question does not belong to the active session." });
    }

    const questionDoc = await Question.findById(questionId).select("difficulty marks answer");

    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found." });
    }

    const normalizedSelection = selectedOptionId || null;
    const isCorrect = normalizedSelection === questionDoc.answer.correctOptionId;
    const existingIndex = session.answers.findIndex(
      (answer) => answer.questionId.toString() === questionId
    );

    const answerEntry = {
      questionId,
      selectedOptionId: normalizedSelection,
      isCorrect,
      timeSpentSec: Number.isFinite(Number(timeSpentSec)) ? Number(timeSpentSec) : 0,
      answeredAt: new Date(),
    };

    if (existingIndex >= 0) {
      session.answers[existingIndex] = answerEntry;
    } else {
      session.answers.push(answerEntry);
    }

    await session.save();

    return res.status(200).json({
      correct: isCorrect,
      awardedMarks: isCorrect ? questionDoc.marks : 0,
      nextDifficulty: getNextDifficulty(questionDoc.difficulty, isCorrect),
      answeredCount: session.answers.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to evaluate answer.", error: error.message });
  }
};

const submitTest = async (req, res) => {
  try {
    const { sessionId, answers = {} } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "answers must be an object keyed by questionId." });
    }

    let questionDocs = [];
    let session = null;

    if (sessionId) {
      session = await TestSession.findById(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Test session not found." });
      }

      questionDocs = await Question.find({ _id: { $in: session.questionIds } }).sort({ createdAt: 1 });
    } else {
      questionDocs = await Question.find({ _id: { $in: Object.keys(answers) } });
    }

    if (questionDocs.length === 0) {
      return res.status(400).json({ message: "No valid questions were provided for submission." });
    }

    const result = calculateSubmissionResult(questionDocs, answers);

    if (session) {
      session.answers = result.feedback.map((item) => ({
        questionId: item.questionId,
        selectedOptionId: item.selectedOptionId,
        isCorrect: item.isCorrect,
        answeredAt: new Date(),
      }));
      session.score = result.score;
      session.correct = result.correct;
      session.wrong = result.wrong;
      session.total = result.total;
      session.status = "completed";
      session.completedAt = new Date();
      await session.save();
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Unable to submit test.", error: error.message });
  }
};

module.exports = {
  evaluateAnswer,
  startTest,
  submitTest,
};

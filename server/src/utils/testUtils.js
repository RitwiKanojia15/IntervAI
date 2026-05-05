const Question = require("../models/Question");

const CATEGORY_LABELS = {
  quantitative: "Quantitative",
  "logical-reasoning": "Logical Reasoning",
  technical: "Technical",
  "spatial-reasoning": "Spatial Reasoning",
  "logical-puzzles": "Logical Puzzles",
};

const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

const shuffleArray = (items) => {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
};

const sanitizeQuestion = (questionDoc) => ({
  id: questionDoc._id.toString(),
  category: questionDoc.category,
  categoryLabel: CATEGORY_LABELS[questionDoc.category] || questionDoc.category,
  topic: questionDoc.topic,
  difficulty: questionDoc.difficulty,
  type: questionDoc.type,
  question: questionDoc.question,
  options: questionDoc.options.map((option) => ({
    id: option.optionId,
    text: option.text,
  })),
  timeLimitSec: questionDoc.timeLimitSec,
  marks: questionDoc.marks,
});

const normalizeCount = (rawCount, fallback = 10) => {
  const parsed = Number.parseInt(rawCount, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), 30);
};

const buildQuestionMatch = ({ category, topic, difficulty, skills }) => {
  const match = {};

  if (category && category !== "mixed") {
    match.category = category;
  }

  if (topic) {
    match.topic = topic;
  }

  if (difficulty) {
    match.difficulty = difficulty;
  }

  if (skills && !topic) {
    const skillList = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (skillList.length > 0) {
      match.topic = { $in: skillList };
    }
  }

  return match;
};

const sampleQuestions = async (match, count, excludeIds = []) => {
  if (count <= 0) {
    return [];
  }

  const aggregateMatch = { ...match };

  if (excludeIds.length > 0) {
    aggregateMatch._id = { $nin: excludeIds };
  }

  return Question.aggregate([{ $match: aggregateMatch }, { $sample: { size: count } }]);
};

const buildAdaptivePool = async (match, count) => {
  const distribution = { easy: 0, medium: 0, hard: 0 };
  const base = Math.floor(count / DIFFICULTY_ORDER.length);
  const remainder = count % DIFFICULTY_ORDER.length;

  DIFFICULTY_ORDER.forEach((difficulty) => {
    distribution[difficulty] = base;
  });

  ["medium", "easy", "hard"].slice(0, remainder).forEach((difficulty) => {
    distribution[difficulty] += 1;
  });

  const selected = [];

  for (const difficulty of DIFFICULTY_ORDER) {
    const questions = await sampleQuestions({ ...match, difficulty }, distribution[difficulty]);
    selected.push(...questions);
  }

  if (selected.length < count) {
    const extraQuestions = await sampleQuestions(
      match,
      count - selected.length,
      selected.map((question) => question._id)
    );

    selected.push(...extraQuestions);
  }

  return shuffleArray(selected).slice(0, count);
};

const getNextDifficulty = (currentDifficulty, isCorrect) => {
  const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);
  const safeIndex = currentIndex === -1 ? 1 : currentIndex;
  const nextIndex = isCorrect ? safeIndex + 1 : safeIndex - 1;

  return DIFFICULTY_ORDER[Math.min(Math.max(nextIndex, 0), DIFFICULTY_ORDER.length - 1)];
};

const calculateSubmissionResult = (questionDocs, answersMap = {}) => {
  let score = 0;
  let correct = 0;

  const feedback = questionDocs.map((questionDoc) => {
    const questionId = questionDoc._id.toString();
    const selectedOptionId = answersMap[questionId] || null;
    const isCorrect = selectedOptionId === questionDoc.answer.correctOptionId;
    const marksAwarded = isCorrect ? questionDoc.marks : 0;

    if (isCorrect) {
      correct += 1;
      score += marksAwarded;
    }

    return {
      questionId,
      category: questionDoc.category,
      topic: questionDoc.topic,
      difficulty: questionDoc.difficulty,
      question: questionDoc.question,
      selectedOptionId,
      correctOptionId: questionDoc.answer.correctOptionId,
      isCorrect,
      marksAwarded,
      marks: questionDoc.marks,
      explanation: questionDoc.explanation,
      options: questionDoc.options.map((option) => ({
        id: option.optionId,
        text: option.text,
      })),
    };
  });

  return {
    score,
    correct,
    wrong: questionDocs.length - correct,
    total: questionDocs.length,
    feedback,
  };
};

module.exports = {
  buildAdaptivePool,
  buildQuestionMatch,
  calculateSubmissionResult,
  getNextDifficulty,
  normalizeCount,
  sampleQuestions,
  sanitizeQuestion,
  shuffleArray,
};

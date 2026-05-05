const crypto = require("crypto");

const LIVE_TEST_CATEGORIES = [
  "quantitative",
  "logical-reasoning",
  "technical",
  "spatial-reasoning",
  "logical-puzzles",
];

const FINAL_ATTEMPT_STATUSES = ["submitted", "expired", "disqualified"];
const DEFAULT_DIFFICULTY_DISTRIBUTION = {
  easy: 0.4,
  medium: 0.4,
  hard: 0.2,
};
const PUBLIC_QUESTION_FIELDS = "category topic difficulty type question options marks timeLimitSec";

const sanitizeJoinCode = (rawValue = "") =>
  rawValue
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const generateJoinCode = () => sanitizeJoinCode(crypto.randomBytes(4).toString("hex").slice(0, 6));

const stringToSeed = (value) => {
  let hash = 1779033703;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
};

const createSeededRandom = (seedValue) => {
  const seedFactory = stringToSeed(String(seedValue));
  let seed = seedFactory();

  return () => {
    seed += 0x6d2b79f5;
    let temp = seed;
    temp = Math.imul(temp ^ (temp >>> 15), temp | 1);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), temp | 61);
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = (items, seedValue) => {
  const clone = [...items];
  const random = createSeededRandom(seedValue);

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
};

const allocateDifficultyCounts = (
  totalQuestions,
  weights = DEFAULT_DIFFICULTY_DISTRIBUTION
) => {
  const entries = Object.entries(weights);
  const counts = { easy: 0, medium: 0, hard: 0 };

  let assigned = 0;
  const remainders = entries.map(([difficulty, weight]) => {
    const rawCount = totalQuestions * weight;
    const baseCount = Math.floor(rawCount);
    counts[difficulty] = baseCount;
    assigned += baseCount;
    return {
      difficulty,
      remainder: rawCount - baseCount,
    };
  });

  remainders
    .sort((left, right) => right.remainder - left.remainder)
    .slice(0, Math.max(totalQuestions - assigned, 0))
    .forEach(({ difficulty }) => {
      counts[difficulty] += 1;
    });

  return counts;
};

const buildQuestionSelectionMatch = ({ categories = [], topics = [] }) => {
  const match = {};

  if (categories.length > 0) {
    match.category = { $in: categories };
  }

  if (topics.length > 0) {
    match.topic = { $in: topics.map((topic) => topic.toLowerCase()) };
  }

  return match;
};

const normalizeTopics = (topics = []) =>
  topics
    .map((topic) => topic?.toString().trim().toLowerCase())
    .filter(Boolean);

const serializeQuestion = (questionDoc) => ({
  id: questionDoc._id.toString(),
  category: questionDoc.category,
  topic: questionDoc.topic,
  difficulty: questionDoc.difficulty,
  type: questionDoc.type,
  question: questionDoc.question,
  options: (questionDoc.options || []).map((option) => ({
    id: option.optionId,
    text: option.text,
  })),
  marks: questionDoc.marks,
  timeLimitSec: questionDoc.timeLimitSec,
});

const orderQuestionDocuments = (questionDocs, orderedIds) => {
  const questionMap = new Map(
    questionDocs.map((questionDoc) => [questionDoc._id.toString(), questionDoc])
  );

  return orderedIds
    .map((questionId) => questionMap.get(questionId.toString()))
    .filter(Boolean);
};

const computeRemainingTimeSec = (endAt, referenceDate = new Date()) =>
  Math.max(0, Math.floor((new Date(endAt).getTime() - referenceDate.getTime()) / 1000));

const normalizeSelectedOption = (selectedOptionId) => {
  if (!selectedOptionId) {
    return null;
  }

  return selectedOptionId.toString().trim().toUpperCase();
};

const normalizeAnswerLookup = (answerSource = {}) => {
  if (answerSource instanceof Map) {
    return answerSource;
  }

  return new Map(Object.entries(answerSource));
};

const calculateAttemptResult = (questionDocs, answerSource = {}) => {
  const answerLookup = normalizeAnswerLookup(answerSource);
  let score = 0;
  let correct = 0;

  const feedback = questionDocs.map((questionDoc) => {
    const questionId = questionDoc._id.toString();
    const rawAnswer = answerLookup.get(questionId);
    const selectedOptionId = normalizeSelectedOption(
      rawAnswer?.selectedOptionId ?? rawAnswer ?? null
    );
    const correctOptionId = normalizeSelectedOption(questionDoc.answer.correctOptionId);
    const isCorrect = selectedOptionId === correctOptionId;
    const marksAwarded = isCorrect ? questionDoc.marks : 0;

    if (isCorrect) {
      correct += 1;
      score += marksAwarded;
    }

    return {
      questionId,
      question: questionDoc.question,
      category: questionDoc.category,
      topic: questionDoc.topic,
      difficulty: questionDoc.difficulty,
      selectedOptionId,
      correctOptionId,
      isCorrect,
      marksAwarded,
      marks: questionDoc.marks,
      explanation: questionDoc.explanation,
      options: (questionDoc.options || []).map((option) => ({
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

const computeRankedEntries = (entries = []) => {
  let previousSignature = null;
  let visibleRank = 0;

  return entries.map((entry, index) => {
    const signature = `${entry.score}-${entry.timeTakenSec}-${entry.submittedAt?.toISOString?.() || entry.submittedAt || ""}`;

    if (signature !== previousSignature) {
      visibleRank = index + 1;
      previousSignature = signature;
    }

    return {
      ...entry,
      rank: visibleRank,
    };
  });
};

const buildParticipantKey = ({ userId, email, fallbackName }) =>
  [userId, email, fallbackName]
    .map((value) => value?.toString().trim().toLowerCase())
    .find(Boolean) || null;

module.exports = {
  DEFAULT_DIFFICULTY_DISTRIBUTION,
  FINAL_ATTEMPT_STATUSES,
  LIVE_TEST_CATEGORIES,
  PUBLIC_QUESTION_FIELDS,
  allocateDifficultyCounts,
  buildParticipantKey,
  buildQuestionSelectionMatch,
  calculateAttemptResult,
  computeRankedEntries,
  computeRemainingTimeSec,
  generateJoinCode,
  normalizeAnswerLookup,
  normalizeSelectedOption,
  normalizeTopics,
  orderQuestionDocuments,
  sanitizeJoinCode,
  serializeQuestion,
  shuffleWithSeed,
};

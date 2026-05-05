export const TEST_CATEGORIES = [
  {
    key: "quantitative",
    label: "Quantitative",
    description: "Percentages, ratios, averages, time and work, probability.",
    accent: "rgba(45,212,191,0.14)",
    border: "rgba(45,212,191,0.28)",
  },
  {
    key: "logical-reasoning",
    label: "Logical Reasoning",
    description: "Series, syllogisms, coding-decoding, directions, arrangements.",
    accent: "rgba(129,140,248,0.14)",
    border: "rgba(129,140,248,0.28)",
  },
  {
    key: "technical",
    label: "Technical",
    description: "C, C++, Python, JavaScript syntax and programming basics.",
    accent: "rgba(251,191,36,0.14)",
    border: "rgba(251,191,36,0.28)",
  },
  {
    key: "spatial-reasoning",
    label: "Spatial Reasoning",
    description: "Mirror images, rotations, paper folds, cube and figure puzzles.",
    accent: "rgba(56,189,248,0.14)",
    border: "rgba(56,189,248,0.28)",
  },
  {
    key: "logical-puzzles",
    label: "Logical Puzzles",
    description: "Truth tables, bridge puzzles, weighing, arrangement and clock puzzles.",
    accent: "rgba(244,114,182,0.14)",
    border: "rgba(244,114,182,0.28)",
  },
  {
    key: "mixed",
    label: "Mixed Test",
    description: "A blended test with quantitative, logical reasoning and technical questions.",
    accent: "rgba(20,184,166,0.18)",
    border: "rgba(20,184,166,0.38)",
  },
];

export const DIFFICULTY_OPTIONS = [
  { key: "", label: "Adaptive" },
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

export const COUNT_OPTIONS = [5, 10, 15];

export const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

export const formatCategoryLabel = (value) =>
  TEST_CATEGORIES.find((category) => category.key === value)?.label || value;

export const formatDifficultyLabel = (value) => {
  if (!value) {
    return "Adaptive";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const reorderQuestionsForAdaptivePath = (questions, currentIndex, targetDifficulty) => {
  if (!targetDifficulty || currentIndex >= questions.length - 1) {
    return questions;
  }

  const answered = questions.slice(0, currentIndex + 1);
  const remaining = questions.slice(currentIndex + 1);
  const preferred = [];
  const fallback = [];

  remaining.forEach((question) => {
    if (question.difficulty === targetDifficulty) {
      preferred.push(question);
    } else {
      fallback.push(question);
    }
  });

  return [...answered, ...preferred, ...fallback];
};

export const createInitialRemainingTimeMap = (questions) =>
  questions.reduce((accumulator, question) => {
    accumulator[question.id] = question.timeLimitSec;
    return accumulator;
  }, {});

export const getAccuracyPercentage = (correct, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((correct / total) * 100);
};

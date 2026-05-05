const VersantQuestion = require("../models/VersantQuestion");
const VersantResponse = require("../models/VersantResponse");
const AppError = require("../utils/appError");

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Strip correct answers before sending to frontend
const sanitizeGrammar = (doc) => ({
  _id: doc._id,
  type: doc.type,
  difficulty: doc.difficulty,
  sentence: doc.sentence,
  options: doc.options,
});

const sanitizePassage = (doc, isListening = false) => ({
  _id: doc._id,
  type: doc.type,
  difficulty: doc.difficulty,
  category: doc.category,
  title: doc.title,
  passage: isListening ? null : doc.passage, // hide passage for listening mode
  questions: doc.questions.map((q) => ({
    question: q.question,
    options: q.options,
    // correctOptionId intentionally omitted
  })),
});

const sanitizeSpeaking = (doc) => ({
  _id: doc._id,
  type: doc.type,
  difficulty: doc.difficulty,
  topic: doc.topic,
  prompt: doc.prompt,
});

// ─── GET QUESTIONS ────────────────────────────────────────────────────────────

const getGrammarQuestions = async (count = 20) => {
  const docs = await VersantQuestion.find({ type: "grammar" }).lean();
  if (!docs.length) throw new AppError("No grammar questions found. Please seed the database.", 404);
  return shuffle(docs).slice(0, count).map(sanitizeGrammar);
};

const getReadingPassages = async (count = 5) => {
  const docs = await VersantQuestion.find({ type: "reading" }).lean();
  if (!docs.length) throw new AppError("No reading passages found. Please seed the database.", 404);
  return shuffle(docs).slice(0, count).map((d) => sanitizePassage(d, false));
};

const getListeningPassages = async (count = 5) => {
  const docs = await VersantQuestion.find({ type: "listening" }).lean();
  if (!docs.length) throw new AppError("No listening passages found. Please seed the database.", 404);
  return shuffle(docs).slice(0, count).map((d) => sanitizePassage(d, true));
};

const getSpeakingPrompts = async (count = 3) => {
  const docs = await VersantQuestion.find({ type: "speaking" }).lean();
  if (!docs.length) throw new AppError("No speaking prompts found. Please seed the database.", 404);
  return shuffle(docs).slice(0, count).map(sanitizeSpeaking);
};

// ─── SUBMIT MCQ ───────────────────────────────────────────────────────────────

const submitMCQ = async ({ module, questionId, answers, userId }) => {
  const doc = await VersantQuestion.findById(questionId).lean();
  if (!doc) throw new AppError("Question not found.", 404);

  let correctAnswers;
  if (module === "grammar") {
    // answers: [{ questionId: doc._id, selectedOptionId }]
    correctAnswers = [{ id: String(doc._id), correctOptionId: doc.correctOptionId }];
  } else {
    // reading / listening: answers per sub-question index
    correctAnswers = doc.questions.map((q, i) => ({
      index: i,
      correctOptionId: q.correctOptionId,
    }));
  }

  let score = 0;
  const evaluated = answers.map((ans) => {
    let correct = false;
    if (module === "grammar") {
      correct = ans.selectedOptionId === doc.correctOptionId;
    } else {
      const match = correctAnswers.find((c) => c.index === ans.index);
      correct = match && ans.selectedOptionId === match.correctOptionId;
    }
    if (correct) score++;
    return { questionId: ans.questionId || String(doc._id), selectedOptionId: ans.selectedOptionId, isCorrect: correct };
  });

  const total = evaluated.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  await VersantResponse.create({
    userId: userId || null,
    module,
    questionId: doc._id,
    answers: evaluated,
    score,
    total,
    percentage,
  });

  // Return with correct answers for review
  const withAnswers = evaluated.map((e, i) => ({
    ...e,
    correctOptionId: module === "grammar" ? doc.correctOptionId : doc.questions[i]?.correctOptionId,
    explanation: module === "grammar" ? doc.explanation : doc.questions[i]?.explanation,
  }));

  return { score, total, percentage, answers: withAnswers };
};

// ─── SPEAKING EVALUATION ─────────────────────────────────────────────────────

const evaluateSpeaking = async ({ questionId, transcript, userId }) => {
  const doc = await VersantQuestion.findById(questionId).lean();
  if (!doc) throw new AppError("Speaking prompt not found.", 404);

  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;

  // Rule-based scoring
  const fluency = Math.min(100, Math.round(
    (wordCount >= 50 ? 40 : (wordCount / 50) * 40) +
    (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 20 ? 30 : 15) +
    (sentences.length >= 3 ? 30 : (sentences.length / 3) * 30)
  ));

  const fillerWords = ["um", "uh", "like", "you know", "basically", "literally"];
  const fillerCount = fillerWords.reduce((acc, fw) => acc + (transcript.toLowerCase().split(fw).length - 1), 0);
  const pronunciation = Math.min(100, Math.max(30, 90 - fillerCount * 8));

  const confidence = Math.min(100, Math.round(
    (wordCount >= 30 ? 50 : (wordCount / 30) * 50) +
    (fillerCount === 0 ? 30 : Math.max(0, 30 - fillerCount * 5)) +
    (sentences.length >= 2 ? 20 : 10)
  ));

  const overall = Math.round((fluency + pronunciation + confidence) / 3);

  const scores = { fluency, pronunciation, confidence, overall };

  await VersantResponse.create({
    userId: userId || null,
    module: "speaking",
    speakingEval: {
      questionId: doc._id,
      prompt: doc.prompt,
      transcript,
      scores,
    },
  });

  return {
    transcript,
    scores,
    sampleAnswer: doc.sampleAnswer,
    feedback: buildSpeakingFeedback(scores, wordCount),
  };
};

const buildSpeakingFeedback = (scores, wordCount) => {
  const tips = [];
  if (scores.fluency < 60) tips.push("Try to speak in longer, more complete sentences.");
  if (scores.pronunciation < 60) tips.push("Reduce filler words like 'um', 'uh', and 'like'.");
  if (scores.confidence < 60) tips.push("Aim for at least 50 words in your response.");
  if (wordCount < 20) tips.push("Your response was very short. Elaborate more on your answer.");
  if (scores.overall >= 80) tips.push("Excellent response! Keep up the great work.");
  else if (scores.overall >= 60) tips.push("Good effort. Focus on the areas above to improve.");
  return tips;
};

module.exports = {
  getGrammarQuestions,
  getReadingPassages,
  getListeningPassages,
  getSpeakingPrompts,
  submitMCQ,
  evaluateSpeaking,
};

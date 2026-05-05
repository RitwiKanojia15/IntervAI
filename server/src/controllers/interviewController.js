const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const Interview = require("../models/Interview");
const { getFirstQuestion, generateNextQuestion, analyzeCommunication } = require("../services/questionService");
const { evaluateBasic, evaluateWithAI, getNextDifficulty, generateReport } = require("../services/evaluationService");
const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

// ── Soft auth ─────────────────────────────────────────────────────────────────
const softAuth = async (req) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const decoded = verifyToken(header.split(" ")[1]);
      const user = await User.findById(decoded.id).select("-password");
      if (user) return user;
    }
  } catch { /* ignore */ }
  return null;
};

// ── POST /api/interview/start ─────────────────────────────────────────────────
const startInterview = asyncHandler(async (req, res) => {
  const { role = "software-engineer", skills = [], difficulty = "medium", mode = "text", count = 10 } = req.body;

  const user = await softAuth(req);

  // Enrich skills from resume if user didn't select any
  let enrichedSkills = Array.isArray(skills) ? [...skills] : [];
  let resumeData = null;
  if (user?.resume) {
    resumeData = user.resume;
    if (enrichedSkills.length === 0 && user.resume.skills?.length > 0) {
      enrichedSkills = user.resume.skills.slice(0, 5);
    }
  }

  const targetCount = Math.min(Math.max(count, 5), 15);

  // Generate only the FIRST question — rest are generated dynamically
  const firstQ = await getFirstQuestion({ role, skills: enrichedSkills, difficulty, resumeData });

  const session = await Interview.create({
    userId: user?._id || null,
    role,
    skills: enrichedSkills,
    difficulty,
    mode,
    status: "active",
    targetCount,
    questions: [firstQ.question],
    questionMeta: [{
      skill: firstQ.skill,
      difficulty: firstQ.difficulty,
      source: firstQ.source,
      expectedKeywords: firstQ.expectedKeywords || [],
    }],
    currentDifficulty: difficulty,
  });

  res.status(200).json({
    sessionId: session._id.toString(),
    role,
    skills: enrichedSkills,
    difficulty,
    mode,
    totalQuestions: targetCount,
    // Return only the first question — next questions come after each answer
    currentQuestion: {
      index: 0,
      question: firstQ.question,
      skill: firstQ.skill,
      difficulty: firstQ.difficulty,
    },
  });
});

// ── GET /api/interview/question/:sessionId ────────────────────────────────────
const getQuestion = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { index = 0 } = req.query;

  const session = await Interview.findById(sessionId);
  if (!session) throw new AppError("Interview session not found.", 404);
  if (session.status === "completed") throw new AppError("This interview session is already completed.", 400);

  const idx = parseInt(index);
  if (idx >= session.questions.length) throw new AppError("Question not yet generated. Submit your previous answer first.", 400);

  const meta = session.questionMeta[idx] || {};

  res.status(200).json({
    sessionId,
    questionIndex: idx,
    question: session.questions[idx],
    skill: meta.skill || "",
    difficulty: session.currentDifficulty,
    total: session.targetCount,
    mode: session.mode,
  });
});

// ── POST /api/interview/answer ────────────────────────────────────────────────
const submitAnswer = asyncHandler(async (req, res) => {
  const { sessionId, questionIndex, answer = "", transcript = "" } = req.body;

  if (!sessionId) throw new AppError("sessionId is required.", 400);

  const session = await Interview.findById(sessionId);
  if (!session) throw new AppError("Interview session not found.", 404);
  if (session.status === "completed") throw new AppError("Session already completed.", 400);

  const idx = parseInt(questionIndex);
  if (idx < 0 || idx >= session.questions.length) throw new AppError("Invalid question index.", 400);

  const meta = session.questionMeta[idx] || {};
  const finalAnswer = answer || transcript;
  if (!finalAnswer.trim()) throw new AppError("Answer cannot be empty.", 400);

  // ── Evaluate answer ──
  const user = await softAuth(req);
  let evaluation;
  if (user) {
    evaluation = await evaluateWithAI({
      question: session.questions[idx],
      answer: finalAnswer,
      skill: meta.skill,
      difficulty: session.currentDifficulty,
    });
  } else {
    evaluation = evaluateBasic({
      question: session.questions[idx],
      answer: finalAnswer,
      expectedKeywords: meta.expectedKeywords || [],
    });
  }

  // ── Adaptive difficulty ──
  const nextDifficulty = getNextDifficulty(session.currentDifficulty, evaluation.score);

  // ── Save answer ──
  const answerEntry = {
    questionIndex: idx,
    question: session.questions[idx],
    skill: meta.skill || "",
    difficulty: session.currentDifficulty,
    answer: finalAnswer,
    transcript: transcript || "",
    score: evaluation.score,
    feedback: evaluation.feedback,
    expectedKeywords: meta.expectedKeywords || [],
    evaluationMethod: evaluation.evaluationMethod,
  };

  const existingIdx = session.answers.findIndex((a) => a.questionIndex === idx);
  if (existingIdx >= 0) session.answers[existingIdx] = answerEntry;
  else session.answers.push(answerEntry);

  session.currentDifficulty = nextDifficulty;

  const isLast = session.answers.length >= session.targetCount;

  if (isLast) {
    // ── Complete session ──
    session.status = "completed";
    session.completedAt = new Date();

    const texts = session.answers.map((a) => a.transcript || a.answer).filter(Boolean);
    session.communicationScore = analyzeCommunication(texts);

    const totalScore = session.answers.reduce((s, a) => s + (a.score || 0), 0);
    session.overallScore = Math.round((totalScore / (session.answers.length * 10)) * 100);

    await session.save();

    return res.status(200).json({
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      nextDifficulty,
      nextQuestionIndex: null,
      nextQuestion: null,
      isComplete: true,
      evaluationMethod: evaluation.evaluationMethod,
    });
  }

  // ── Generate next question dynamically ──
  const nextIdx = idx + 1;
  const conversationHistory = session.answers.map((a) => ({
    question: a.question,
    answer: a.answer || a.transcript,
    score: a.score,
    skill: a.skill,
  }));

  const resumeData = user?.resume || null;
  const nextQ = await generateNextQuestion({
    role: session.role,
    skills: session.skills,
    difficulty: nextDifficulty,
    resumeData,
    conversationHistory,
    excludeTexts: session.questions,
    questionNumber: nextIdx + 1,
    totalQuestions: session.targetCount,
  });

  // Append next question to session
  session.questions.push(nextQ.question);
  session.questionMeta.push({
    skill: nextQ.skill,
    difficulty: nextQ.difficulty,
    source: nextQ.source,
    expectedKeywords: nextQ.expectedKeywords || [],
  });

  await session.save();

  res.status(200).json({
    score: evaluation.score,
    feedback: evaluation.feedback,
    strengths: evaluation.strengths || [],
    improvements: evaluation.improvements || [],
    nextDifficulty,
    nextQuestionIndex: nextIdx,
    nextQuestion: {
      index: nextIdx,
      question: nextQ.question,
      skill: nextQ.skill,
      difficulty: nextDifficulty,
    },
    isComplete: false,
    evaluationMethod: evaluation.evaluationMethod,
  });
});

// ── POST /api/interview/evaluate ──────────────────────────────────────────────
const evaluateAnswer = asyncHandler(async (req, res) => {
  const { question, answer, skill = "", difficulty = "medium" } = req.body;
  if (!question || !answer) throw new AppError("question and answer are required.", 400);

  const user = await softAuth(req);
  const evaluation = user
    ? await evaluateWithAI({ question, answer, skill, difficulty })
    : evaluateBasic({ question, answer });

  res.status(200).json(evaluation);
});

// ── GET /api/interview/result/:sessionId ──────────────────────────────────────
const getResult = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Interview.findById(sessionId);
  if (!session) throw new AppError("Interview session not found.", 404);

  const report = await generateReport(session);

  res.status(200).json({
    sessionId,
    role: session.role,
    skills: session.skills,
    difficulty: session.difficulty,
    mode: session.mode,
    status: session.status,
    totalQuestions: session.targetCount,
    answeredQuestions: session.answers.length,
    overallScore: session.overallScore || report.overallScore,
    communicationScore: session.communicationScore,
    answers: session.answers.map((a) => ({
      questionIndex: a.questionIndex,
      question: a.question,
      skill: a.skill,
      difficulty: a.difficulty,
      answer: a.answer,
      score: a.score,
      feedback: a.feedback,
      evaluationMethod: a.evaluationMethod,
    })),
    report,
    completedAt: session.completedAt,
    createdAt: session.createdAt,
  });
});

// ── GET /api/interview/history ────────────────────────────────────────────────
const getHistory = asyncHandler(async (req, res) => {
  const user = await softAuth(req);
  if (!user) return res.status(200).json({ sessions: [] });

  const sessions = await Interview.find({ userId: user._id, status: "completed" })
    .sort({ completedAt: -1 })
    .limit(20)
    .select("role skills difficulty mode overallScore communicationScore answers targetCount completedAt createdAt")
    .lean();

  res.status(200).json({
    sessions: sessions.map((s) => ({
      sessionId: s._id.toString(),
      role: s.role,
      skills: s.skills,
      difficulty: s.difficulty,
      mode: s.mode,
      overallScore: s.overallScore,
      communicationScore: s.communicationScore,
      questionsAnswered: s.answers?.length || 0,
      totalQuestions: s.targetCount,
      completedAt: s.completedAt,
      createdAt: s.createdAt,
    })),
  });
});

module.exports = { startInterview, getQuestion, submitAnswer, evaluateAnswer, getResult, getHistory };

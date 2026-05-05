const asyncHandler = require("../utils/asyncHandler");
const {
  createLiveTest,
  getLiveTestLeaderboard,
  getLiveTestSession,
  joinLiveTest,
  recordLiveTestWarning,
  saveLiveTestAnswerBySession,
  saveLiveTestAnswers,
  startLiveTestAsHost,
  startLiveTest,
  submitLiveTestBySession,
  submitLiveTest,
} = require("../services/liveTestService");

const createTest = asyncHandler(async (req, res) => {
  const liveTest = await createLiveTest(req.body);
  res.status(201).json(liveTest);
});

const joinTest = asyncHandler(async (req, res) => {
  const session = await joinLiveTest(req.body);
  res.status(200).json(session);
});

const getSession = asyncHandler(async (req, res) => {
  const session = await getLiveTestSession({
    testId: req.params.testId,
    participantKey: req.query.participantKey,
    sessionToken: req.query.sessionToken,
  });
  res.status(200).json(session);
});

const saveAnswers = asyncHandler(async (req, res) => {
  const payload = await saveLiveTestAnswers({
    testId: req.params.testId,
    participantKey: req.body.participantKey,
    sessionToken: req.body.sessionToken,
    answers: req.body.answers,
  });
  res.status(200).json(payload);
});

const submitTest = asyncHandler(async (req, res) => {
  const payload = await submitLiveTest({
    testId: req.params.testId,
    participantKey: req.body.participantKey,
    sessionToken: req.body.sessionToken,
  });
  res.status(200).json(payload);
});

const startTest = asyncHandler(async (req, res) => {
  const liveTest = await startLiveTestAsHost({
    testId: req.params.testId,
    hostId: req.body.hostId || req.body.userId || req.body.email || req.body.participantKey,
  });
  res.status(200).json(liveTest);
});

const startTestDirect = asyncHandler(async (req, res) => {
  const liveTest = await startLiveTestAsHost({
    testId: req.params.testId,
    hostId: req.body.hostId || req.body.userId || req.body.email || req.body.participantKey,
  });
  res.status(200).json(liveTest);
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const payload = await getLiveTestLeaderboard({
    testId: req.params.testId,
    limit: Number(req.query.limit) || undefined,
  });
  res.status(200).json(payload);
});

const recordWarning = asyncHandler(async (req, res) => {
  const payload = await recordLiveTestWarning({
    testId: req.params.testId,
    participantKey: req.body.participantKey,
    sessionToken: req.body.sessionToken,
    reason: req.body.reason,
  });
  res.status(200).json(payload);
});

const createLive = asyncHandler(async (req, res) => {
  const liveTest = await createLiveTest({
    title: req.body.title,
    createdBy: req.body.hostId || req.body.createdBy || req.body.userId || req.body.email,
    categories: req.body.categories,
    topics: req.body.topics,
    questionCount: req.body.totalQuestions || req.body.questionCount,
  });
  res.status(201).json(liveTest);
});

const joinLive = asyncHandler(async (req, res) => {
  const session = await joinLiveTest({
    joinCode: req.body.joinCode,
    userId: req.body.userId,
    email: req.body.email,
    participantName: req.body.participantName,
    resumeExisting: req.body.resumeExisting,
  });
  res.status(200).json(session);
});

const getLiveSessionByTest = asyncHandler(async (req, res) => {
  const session = await getLiveTestSession({
    testId: req.params.testId,
    participantKey: req.query.participantKey,
    sessionToken: req.query.sessionToken,
  });
  res.status(200).json(session);
});

const saveLiveAnswer = asyncHandler(async (req, res) => {
  const payload = await saveLiveTestAnswerBySession({
    sessionId: req.body.sessionId,
    questionId: req.body.questionId,
    answer: req.body.answer,
  });
  res.status(200).json(payload);
});

const submitLive = asyncHandler(async (req, res) => {
  const payload = await submitLiveTestBySession({
    sessionId: req.body.sessionId,
  });
  res.status(200).json(payload);
});

const getLiveLeaderboard = asyncHandler(async (req, res) => {
  const payload = await getLiveTestLeaderboard({
    testId: req.params.testId,
    limit: Number(req.query.limit) || undefined,
  });
  res.status(200).json(payload);
});

module.exports = {
  createLive,
  createTest,
  getLiveLeaderboard,
  getLiveSessionByTest,
  getLeaderboard,
  getSession,
  joinLive,
  joinTest,
  recordWarning,
  saveLiveAnswer,
  saveAnswers,
  startTestDirect,
  startTest,
  submitLive,
  submitTest,
};

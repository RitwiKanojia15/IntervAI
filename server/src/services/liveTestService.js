const crypto = require("crypto");
const Question = require("../models/Question");
const LiveTest = require("../models/LiveTest");
const LiveTestAttempt = require("../models/LiveTestAttempt");
const AppError = require("../utils/appError");
const {
  DEFAULT_DIFFICULTY_DISTRIBUTION,
  LIVE_TEST_CATEGORIES,
  FINAL_ATTEMPT_STATUSES,
  PUBLIC_QUESTION_FIELDS,
  allocateDifficultyCounts,
  buildParticipantKey,
  buildQuestionSelectionMatch,
  calculateAttemptResult,
  computeRankedEntries,
  computeRemainingTimeSec,
  generateJoinCode,
  normalizeSelectedOption,
  normalizeTopics,
  orderQuestionDocuments,
  sanitizeJoinCode,
  serializeQuestion,
  shuffleWithSeed,
} = require("../utils/liveTestUtils");
const {
  emitLiveTestLeaderboardUpdate,
  emitLiveTestViolation,
  emitTestStarted,
  emitLiveTestUpdate,
} = require("./socketService");

const DEFAULT_LEADERBOARD_LIMIT = 20;
const HEARTBEAT_WRITE_WINDOW_MS = 5000;

const toObjectIdStrings = (values = []) => values.map((value) => value.toString());

const ensureLiveTestStatus = async (liveTestDoc) => {
  if (!liveTestDoc) {
    return null;
  }

  if (liveTestDoc.status === "waiting") {
    return liveTestDoc;
  }

  const remainingTimeSec = computeRemainingTimeSec(liveTestDoc.endAt);
  const now = new Date();

  if (liveTestDoc.status === "scheduled" && now >= liveTestDoc.startAt && remainingTimeSec > 0) {
    liveTestDoc.status = "live";
    await liveTestDoc.save();
  }

  if (remainingTimeSec <= 0 && !["completed", "expired"].includes(liveTestDoc.status)) {
    liveTestDoc.status = "expired";
    await liveTestDoc.save();
  }

  return liveTestDoc;
};

const assertLiveTestAvailability = (liveTestDoc) => {
  if (!liveTestDoc) {
    throw new AppError("Live test not found.", 404);
  }

  if (liveTestDoc.status === "completed" || liveTestDoc.status === "expired") {
    throw new AppError("This live test has already ended.", 410);
  }
};

const assertLiveTestStarted = (liveTestDoc) => {
  if (!liveTestDoc) {
    throw new AppError("Live test not found.", 404);
  }

  if (liveTestDoc.status === "waiting" || liveTestDoc.status === "scheduled") {
    throw new AppError("The host has not started this live test yet.", 409);
  }
};

const assertAttemptAccess = (attemptDoc, sessionToken) => {
  if (!attemptDoc) {
    throw new AppError("Live test session not found.", 404);
  }

  if (!sessionToken || attemptDoc.sessionToken !== sessionToken) {
    throw new AppError("Invalid live test session.", 401);
  }
};

const getPublicQuestionsByOrder = async (questionOrder = []) => {
  const questionDocs = await Question.find({ _id: { $in: questionOrder } })
    .select(PUBLIC_QUESTION_FIELDS)
    .lean();

  return orderQuestionDocuments(questionDocs, questionOrder).map(serializeQuestion);
};

const getEvaluationQuestionsByOrder = async (questionOrder = []) => {
  const questionDocs = await Question.find({ _id: { $in: questionOrder } })
    .select(`${PUBLIC_QUESTION_FIELDS} answer explanation`)
    .lean();

  return orderQuestionDocuments(questionDocs, questionOrder);
};

const sampleQuestionIds = async (match, count, excludeIds = []) => {
  if (count <= 0) {
    return [];
  }

  const aggregateMatch = { ...match };

  if (excludeIds.length > 0) {
    aggregateMatch._id = { $nin: excludeIds };
  }

  const questionDocs = await Question.aggregate([
    { $match: aggregateMatch },
    { $project: { _id: 1 } },
    { $sample: { size: count } },
  ]);

  return questionDocs.map((questionDoc) => questionDoc._id);
};

const selectQuestionIdsForLiveTest = async ({
  categories = [],
  topics = [],
  questionCount,
  difficultyDistribution = DEFAULT_DIFFICULTY_DISTRIBUTION,
  seedValue,
}) => {
  const selectionMatch = buildQuestionSelectionMatch({
    categories,
    topics,
  });

  const countsByDifficulty = allocateDifficultyCounts(questionCount, difficultyDistribution);
  const selectedIds = [];

  for (const [difficulty, expectedCount] of Object.entries(countsByDifficulty)) {
    const sampledIds = await sampleQuestionIds(
      { ...selectionMatch, difficulty },
      expectedCount,
      selectedIds
    );
    selectedIds.push(...sampledIds);
  }

  if (selectedIds.length < questionCount) {
    const remainderIds = await sampleQuestionIds(
      selectionMatch,
      questionCount - selectedIds.length,
      selectedIds
    );
    selectedIds.push(...remainderIds);
  }

  if (selectedIds.length === 0) {
    throw new AppError("No questions matched the requested live test filters.", 404);
  }

  return shuffleWithSeed(selectedIds, seedValue).slice(0, questionCount);
};

const countAnsweredEntries = (answerMap) => {
  let answeredCount = 0;

  answerMap.forEach((answerEntry) => {
    if (answerEntry?.selectedOptionId) {
      answeredCount += 1;
    }
  });

  return answeredCount;
};

const serializeAttemptAnswers = (answers = new Map()) => {
  const serialized = {};

  answers.forEach((value, key) => {
    serialized[key] = value?.selectedOptionId || null;
  });

  return serialized;
};

const serializeParticipant = (attemptDoc) => ({
  participantKey: attemptDoc.participantKey,
  participantName: attemptDoc.participantName,
  sessionToken: attemptDoc.sessionToken,
  warnings: attemptDoc.warnings,
  tabSwitchCount: attemptDoc.tabSwitchCount,
  fullscreenExits: attemptDoc.fullscreenExits,
  status: attemptDoc.status,
});

const buildLiveTestSessionPayload = async (liveTestDoc, attemptDoc) => {
  const includeQuestions = liveTestDoc.status === "live" || liveTestDoc.status === "completed";
  const publicQuestions = includeQuestions
    ? await getPublicQuestionsByOrder(attemptDoc.questionOrder)
    : [];
  const remainingTimeSec = liveTestDoc.endAt
    ? computeRemainingTimeSec(liveTestDoc.endAt)
    : liveTestDoc.totalDurationSec;

  return {
    testId: liveTestDoc._id.toString(),
    title: liveTestDoc.title,
    joinCode: liveTestDoc.joinCode,
    status: liveTestDoc.status,
    questionCount: liveTestDoc.questionIds.length,
    totalDurationSec: liveTestDoc.totalDurationSec,
    startAt: liveTestDoc.startAt,
    endAt: liveTestDoc.endAt,
    remainingTimeSec,
    serverNow: new Date().toISOString(),
    participant: serializeParticipant(attemptDoc),
    isHost: attemptDoc.participantKey === liveTestDoc.createdBy,
    antiCheat: {
      enabled: liveTestDoc.settings?.antiCheatEnabled ?? true,
      maxWarnings: liveTestDoc.settings?.maxWarnings ?? 3,
    },
    questions: publicQuestions,
    answers: serializeAttemptAnswers(attemptDoc.answers),
    answeredCount: attemptDoc.answeredCount,
    leaderboardVersion: liveTestDoc.leaderboardVersion,
  };
};

const getLeaderboard = async (testId, limit = DEFAULT_LEADERBOARD_LIMIT) => {
  const attemptDocs = await LiveTestAttempt.find({
    testId,
    status: { $in: FINAL_ATTEMPT_STATUSES },
  })
    .select("participantName participantKey status score correct wrong total timeTakenSec submittedAt")
    .sort({ score: -1, timeTakenSec: 1, submittedAt: 1 })
    .limit(limit)
    .lean();

  return computeRankedEntries(
    attemptDocs.map((attemptDoc) => ({
      id: attemptDoc._id.toString(),
      participantKey: attemptDoc.participantKey,
      participantName: attemptDoc.participantName,
      status: attemptDoc.status,
      score: attemptDoc.score,
      correct: attemptDoc.correct,
      wrong: attemptDoc.wrong,
      total: attemptDoc.total,
      timeTakenSec: attemptDoc.timeTakenSec,
      submittedAt: attemptDoc.submittedAt,
    }))
  );
};

const getParticipantRank = async (attemptDoc) => {
  if (!attemptDoc || !FINAL_ATTEMPT_STATUSES.includes(attemptDoc.status)) {
    return null;
  }

  const higherRankCount = await LiveTestAttempt.countDocuments({
    testId: attemptDoc.testId,
    status: { $in: FINAL_ATTEMPT_STATUSES },
    $or: [
      { score: { $gt: attemptDoc.score } },
      {
        score: attemptDoc.score,
        timeTakenSec: { $lt: attemptDoc.timeTakenSec },
      },
      {
        score: attemptDoc.score,
        timeTakenSec: attemptDoc.timeTakenSec,
        submittedAt: { $lt: attemptDoc.submittedAt },
      },
    ],
  });

  return higherRankCount + 1;
};

const buildLeaderboardPayload = async (testId, limit = DEFAULT_LEADERBOARD_LIMIT) => {
  const liveTestDoc = await LiveTest.findById(testId).select("title joinCode leaderboardVersion");

  if (!liveTestDoc) {
    throw new AppError("Live test not found.", 404);
  }

  return {
    testId: liveTestDoc._id.toString(),
    title: liveTestDoc.title,
    joinCode: liveTestDoc.joinCode,
    leaderboardVersion: liveTestDoc.leaderboardVersion,
    leaderboard: await getLeaderboard(liveTestDoc._id, limit),
  };
};

const emitLeaderboardIfNeeded = async (testId) => {
  const payload = await buildLeaderboardPayload(testId);
  emitLiveTestLeaderboardUpdate(testId.toString(), payload);
  return payload;
};

const finalizeAttemptIfExpired = async (liveTestDoc, attemptDoc) => {
  if (liveTestDoc.status === "waiting" || !liveTestDoc.endAt) {
    return attemptDoc;
  }

  const remainingTimeSec = computeRemainingTimeSec(liveTestDoc.endAt);

  if (remainingTimeSec > 0 || FINAL_ATTEMPT_STATUSES.includes(attemptDoc.status)) {
    return attemptDoc;
  }

  const evaluationQuestions = await getEvaluationQuestionsByOrder(attemptDoc.questionOrder);
  const submissionResult = calculateAttemptResult(evaluationQuestions, attemptDoc.answers);

  attemptDoc.score = submissionResult.score;
  attemptDoc.correct = submissionResult.correct;
  attemptDoc.wrong = submissionResult.wrong;
  attemptDoc.total = submissionResult.total;
  attemptDoc.timeTakenSec = liveTestDoc.totalDurationSec;
  attemptDoc.status = "expired";
  attemptDoc.submittedAt = new Date();
  await attemptDoc.save();

  await LiveTest.findByIdAndUpdate(liveTestDoc._id, {
    $inc: { leaderboardVersion: 1 },
    $set: {
      status: "expired",
      lastLeaderboardUpdateAt: new Date(),
    },
  });

  await emitLeaderboardIfNeeded(liveTestDoc._id);

  return attemptDoc;
};

const createLiveTest = async ({
  title,
  createdBy,
  categories,
  topics,
  questionCount,
  totalDurationSec,
  difficultyDistribution,
  settings,
}) => {
  const resolvedCategories = categories?.length ? categories : LIVE_TEST_CATEGORIES;
  const normalizedCategories = resolvedCategories;
  const normalizedTopics = normalizeTopics(topics);
  const resolvedQuestionCount = Math.min(Math.max(Number(questionCount) || 10, 1), 100);
  const resolvedDurationSec = resolvedQuestionCount * 60;
  const joinCode = generateJoinCode();
  const seedValue = `${title || "live-test"}-${joinCode}`;
  const questionIds = await selectQuestionIdsForLiveTest({
    categories: normalizedCategories,
    topics: normalizedTopics,
    questionCount: resolvedQuestionCount,
    difficultyDistribution: difficultyDistribution || DEFAULT_DIFFICULTY_DISTRIBUTION,
    seedValue,
  });

  const liveTestDoc = await LiveTest.create({
    title: title?.trim() || "Live Assessment",
    joinCode,
    createdBy: createdBy || null,
    categories: normalizedCategories,
    topics: normalizedTopics,
    questionCount: questionIds.length,
    questionIds,
    totalDurationSec: resolvedDurationSec,
    startAt: null,
    endAt: null,
    difficultyDistribution: difficultyDistribution || DEFAULT_DIFFICULTY_DISTRIBUTION,
    settings: settings || {},
    status: "waiting",
  });

  return {
    testId: liveTestDoc._id.toString(),
    title: liveTestDoc.title,
    joinCode: liveTestDoc.joinCode,
    status: liveTestDoc.status,
    questionCount: liveTestDoc.questionIds.length,
    totalDurationSec: liveTestDoc.totalDurationSec,
    categories: liveTestDoc.categories,
    topics: liveTestDoc.topics,
    startAt: liveTestDoc.startAt,
    endAt: liveTestDoc.endAt,
  };
};

const joinLiveTest = async ({
  joinCode,
  userId,
  email,
  participantName,
  resumeExisting = true,
}) => {
  const participantKey = buildParticipantKey({
    userId,
    email,
    fallbackName: participantName,
  });

  if (!participantKey) {
    throw new AppError("A valid user identity is required to join the live test.", 400);
  }

  const normalizedJoinCode = sanitizeJoinCode(joinCode);

  if (!normalizedJoinCode || normalizedJoinCode.length < 4) {
    throw new AppError("A valid join code is required.", 400);
  }

  let liveTestDoc = await LiveTest.findOne({ joinCode: normalizedJoinCode });
  liveTestDoc = await ensureLiveTestStatus(liveTestDoc);
  assertLiveTestAvailability(liveTestDoc);

  let attemptDoc = await LiveTestAttempt.findOne({
    testId: liveTestDoc._id,
    participantKey,
  });

  if (attemptDoc) {
    if (!resumeExisting && liveTestDoc.settings?.preventMultipleSessions) {
      throw new AppError("You already have an active session for this live test.", 409);
    }

    await finalizeAttemptIfExpired(liveTestDoc, attemptDoc);
    return buildLiveTestSessionPayload(liveTestDoc, attemptDoc);
  }

  attemptDoc = await LiveTestAttempt.create({
    testId: liveTestDoc._id,
    participantKey,
    participantName: participantName?.trim() || email || "Participant",
    sessionToken: crypto.randomUUID(),
    questionOrder: liveTestDoc.questionIds,
    total: liveTestDoc.questionIds.length,
  });

  return buildLiveTestSessionPayload(liveTestDoc, attemptDoc);
};

const getLiveTestSession = async ({ testId, participantKey, sessionToken }) => {
  let liveTestDoc = await LiveTest.findById(testId);
  liveTestDoc = await ensureLiveTestStatus(liveTestDoc);

  const attemptDoc = await LiveTestAttempt.findOne({ testId, participantKey });
  assertAttemptAccess(attemptDoc, sessionToken);
  await finalizeAttemptIfExpired(liveTestDoc, attemptDoc);

  return buildLiveTestSessionPayload(liveTestDoc, attemptDoc);
};

const saveLiveTestAnswers = async ({
  testId,
  participantKey,
  sessionToken,
  answers = {},
}) => {
  let liveTestDoc = await LiveTest.findById(testId);
  liveTestDoc = await ensureLiveTestStatus(liveTestDoc);
  assertLiveTestAvailability(liveTestDoc);
  assertLiveTestStarted(liveTestDoc);

  const attemptDoc = await LiveTestAttempt.findOne({ testId, participantKey });
  assertAttemptAccess(attemptDoc, sessionToken);

  if (attemptDoc.status !== "joined") {
    throw new AppError("This live test session can no longer be updated.", 409);
  }

  const questionOrderSet = new Set(toObjectIdStrings(attemptDoc.questionOrder));
  let changedCount = 0;

  Object.entries(answers).forEach(([questionId, selectedOptionId]) => {
    if (!questionOrderSet.has(questionId.toString())) {
      return;
    }

    const normalizedOptionId = normalizeSelectedOption(selectedOptionId);
    const previousEntry = attemptDoc.answers.get(questionId);
    const previousOptionId = previousEntry?.selectedOptionId || null;

    if (previousOptionId === normalizedOptionId) {
      return;
    }

    attemptDoc.answers.set(questionId, {
      selectedOptionId: normalizedOptionId,
      answeredAt: new Date(),
    });
    changedCount += 1;
  });

  const lastSeenDelta = Date.now() - new Date(attemptDoc.lastSeenAt).getTime();

  if (changedCount === 0 && lastSeenDelta < HEARTBEAT_WRITE_WINDOW_MS) {
    return {
      saved: false,
      changedCount: 0,
      answeredCount: attemptDoc.answeredCount,
      remainingTimeSec: computeRemainingTimeSec(liveTestDoc.endAt),
      serverNow: new Date().toISOString(),
    };
  }

  if (changedCount > 0) {
    attemptDoc.answeredCount = countAnsweredEntries(attemptDoc.answers);
  }

  attemptDoc.lastSeenAt = new Date();
  await attemptDoc.save();

  return {
    saved: true,
    changedCount,
    answeredCount: attemptDoc.answeredCount,
    remainingTimeSec: computeRemainingTimeSec(liveTestDoc.endAt),
    serverNow: new Date().toISOString(),
  };
};

const submitLiveTest = async ({ testId, participantKey, sessionToken }) => {
  let liveTestDoc = await LiveTest.findById(testId);
  liveTestDoc = await ensureLiveTestStatus(liveTestDoc);
  assertLiveTestStarted(liveTestDoc);

  const attemptDoc = await LiveTestAttempt.findOne({ testId, participantKey });
  assertAttemptAccess(attemptDoc, sessionToken);

  if (attemptDoc.status === "submitted") {
    return {
      result: {
        score: attemptDoc.score,
        correct: attemptDoc.correct,
        wrong: attemptDoc.wrong,
        total: attemptDoc.total,
        timeTakenSec: attemptDoc.timeTakenSec,
        participantRank: await getParticipantRank(attemptDoc),
        feedback: [],
      },
      leaderboard: await getLeaderboard(testId),
    };
  }

  if (attemptDoc.status === "disqualified") {
    return {
      result: {
        score: attemptDoc.score,
        correct: attemptDoc.correct,
        wrong: attemptDoc.wrong,
        total: attemptDoc.total,
        timeTakenSec: attemptDoc.timeTakenSec,
        participantRank: await getParticipantRank(attemptDoc),
        feedback: [],
      },
      leaderboard: await getLeaderboard(testId),
    };
  }

  const evaluationQuestions = await getEvaluationQuestionsByOrder(attemptDoc.questionOrder);
  const submissionResult = calculateAttemptResult(evaluationQuestions, attemptDoc.answers);
  const remainingTimeSec = computeRemainingTimeSec(liveTestDoc.endAt);

  attemptDoc.score = submissionResult.score;
  attemptDoc.correct = submissionResult.correct;
  attemptDoc.wrong = submissionResult.wrong;
  attemptDoc.total = submissionResult.total;
  attemptDoc.timeTakenSec = Math.max(
    liveTestDoc.totalDurationSec - remainingTimeSec,
    0
  );
  attemptDoc.status = remainingTimeSec <= 0 ? "expired" : "submitted";
  attemptDoc.submittedAt = new Date();
  attemptDoc.lastSeenAt = new Date();
  await attemptDoc.save();

  await LiveTest.findByIdAndUpdate(testId, {
    $inc: { leaderboardVersion: 1 },
    $set: {
      status: remainingTimeSec <= 0 ? "expired" : liveTestDoc.status,
      lastLeaderboardUpdateAt: new Date(),
    },
  });

  const [participantRank, leaderboardPayload] = await Promise.all([
    getParticipantRank(attemptDoc),
    emitLeaderboardIfNeeded(testId),
  ]);

  return {
    result: {
      ...submissionResult,
      timeTakenSec: attemptDoc.timeTakenSec,
      participantRank,
    },
    leaderboard: leaderboardPayload.leaderboard,
  };
};

const getLiveTestLeaderboard = async ({ testId, limit = DEFAULT_LEADERBOARD_LIMIT }) =>
  buildLeaderboardPayload(testId, limit);

const recordLiveTestWarning = async ({
  testId,
  participantKey,
  sessionToken,
  reason = "tab-switch",
}) => {
  let liveTestDoc = await LiveTest.findById(testId);
  liveTestDoc = await ensureLiveTestStatus(liveTestDoc);

  const attemptDoc = await LiveTestAttempt.findOne({ testId, participantKey });
  assertAttemptAccess(attemptDoc, sessionToken);

  if (attemptDoc.status !== "joined") {
    return {
      warnings: attemptDoc.warnings,
      tabSwitchCount: attemptDoc.tabSwitchCount,
      locked: attemptDoc.status === "disqualified",
      reason,
    };
  }

  attemptDoc.warnings += 1;
  attemptDoc.tabSwitchCount    += reason === "tab-switch"      ? 1 : 0;
  attemptDoc.fullscreenExits   += reason === "fullscreen-exit" ? 1 : 0;
  attemptDoc.lastSeenAt = new Date();

  const warningLimit = liveTestDoc.settings?.maxWarnings ?? 3;
  const shouldLockSession =
    liveTestDoc.settings?.antiCheatEnabled && attemptDoc.warnings >= warningLimit;

  if (shouldLockSession) {
    attemptDoc.status = "disqualified";
    attemptDoc.submittedAt = new Date();
    attemptDoc.timeTakenSec = Math.max(
      liveTestDoc.totalDurationSec - computeRemainingTimeSec(liveTestDoc.endAt),
      0
    );
    attemptDoc.score = 0;
    attemptDoc.correct = 0;
    attemptDoc.wrong = attemptDoc.total;
  }

  await attemptDoc.save();

  if (shouldLockSession) {
    await LiveTest.findByIdAndUpdate(testId, {
      $inc: { leaderboardVersion: 1 },
      $set: { lastLeaderboardUpdateAt: new Date() },
    });
    await emitLeaderboardIfNeeded(testId);
  }

  // Broadcast violation to all room members so the host panel updates in real-time
  emitLiveTestViolation(testId.toString(), {
    participantKey: attemptDoc.participantKey,
    participantName: attemptDoc.participantName,
    warnings: attemptDoc.warnings,
    maxWarnings: liveTestDoc.settings?.maxWarnings ?? 3,
    reason,
    locked: shouldLockSession,
  });

  return {
    warnings: attemptDoc.warnings,
    tabSwitchCount: attemptDoc.tabSwitchCount,
    locked: shouldLockSession,
    reason,
  };
};

const startLiveTest = async (testId) => {
  const liveTestDoc = await LiveTest.findById(testId);
  if (!liveTestDoc) {
    throw new AppError("Live test not found.", 404);
  }
  if (liveTestDoc.status !== "waiting") {
    throw new AppError("Test cannot be started.", 400);
  }
  liveTestDoc.status = "live";
  liveTestDoc.startAt = new Date();
  liveTestDoc.endAt = new Date(Date.now() + liveTestDoc.totalDurationSec * 1000);
  await liveTestDoc.save();

  const payload = { status: "live", startAt: liveTestDoc.startAt, endAt: liveTestDoc.endAt };
  emitLiveTestUpdate(testId, payload);
  emitTestStarted(testId, payload);

  return {
    testId: liveTestDoc._id.toString(),
    status: liveTestDoc.status,
    startAt: liveTestDoc.startAt,
    endAt: liveTestDoc.endAt,
  };
};

const startLiveTestAsHost = async ({ testId, hostId }) => {
  const liveTestDoc = await LiveTest.findById(testId);
  if (!liveTestDoc) {
    throw new AppError("Live test not found.", 404);
  }

  const normalizedHostId = hostId?.toString().trim().toLowerCase();
  const normalizedCreatedBy = liveTestDoc.createdBy?.toString().trim().toLowerCase();
  if (!normalizedHostId || !normalizedCreatedBy || normalizedHostId !== normalizedCreatedBy) {
    throw new AppError("Only host can start this test.", 403);
  }

  return startLiveTest(testId);
};

const saveLiveTestAnswerBySession = async ({
  sessionId,
  questionId,
  answer,
}) => {
  const attemptDoc = await LiveTestAttempt.findById(sessionId);
  if (!attemptDoc) {
    throw new AppError("Live session not found.", 404);
  }

  const liveTestDoc = await LiveTest.findById(attemptDoc.testId);
  await ensureLiveTestStatus(liveTestDoc);
  assertLiveTestAvailability(liveTestDoc);
  assertLiveTestStarted(liveTestDoc);

  const questionIdString = questionId?.toString();
  const inOrder = attemptDoc.questionOrder.some((id) => id.toString() === questionIdString);
  if (!inOrder) {
    throw new AppError("Question does not belong to this live session.", 400);
  }

  const normalizedOptionId = normalizeSelectedOption(answer);
  const previousEntry = attemptDoc.answers.get(questionIdString);
  const previousOptionId = previousEntry?.selectedOptionId || null;

  if (previousOptionId !== normalizedOptionId) {
    attemptDoc.answers.set(questionIdString, {
      selectedOptionId: normalizedOptionId,
      answeredAt: new Date(),
    });
    attemptDoc.answeredCount = countAnsweredEntries(attemptDoc.answers);
  }

  attemptDoc.lastSeenAt = new Date();
  await attemptDoc.save();

  return {
    sessionId: attemptDoc._id.toString(),
    saved: previousOptionId !== normalizedOptionId,
    answeredCount: attemptDoc.answeredCount,
    remainingTimeSec: computeRemainingTimeSec(liveTestDoc.endAt),
    serverNow: new Date().toISOString(),
  };
};

const submitLiveTestBySession = async ({ sessionId }) => {
  const attemptDoc = await LiveTestAttempt.findById(sessionId);
  if (!attemptDoc) {
    throw new AppError("Live session not found.", 404);
  }

  return submitLiveTest({
    testId: attemptDoc.testId.toString(),
    participantKey: attemptDoc.participantKey,
    sessionToken: attemptDoc.sessionToken,
  });
};

module.exports = {
  createLiveTest,
  getLiveTestLeaderboard,
  getLiveTestSession,
  joinLiveTest,
  recordLiveTestWarning,
  saveLiveTestAnswers,
  saveLiveTestAnswerBySession,
  startLiveTestAsHost,
  startLiveTest,
  submitLiveTestBySession,
  submitLiveTest,
};

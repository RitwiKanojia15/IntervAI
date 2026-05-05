const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const {
  createRoom, joinRoom, getRoom, getRoomByCode,
  startDiscussion, endDiscussion, getResults,
} = require("../services/groupDiscussionService");

// POST /api/gtg/create
const create = asyncHandler(async (req, res) => {
  const { title, topic, hostKey, hostName, durationMinutes } = req.body;
  const room = await createRoom({ title, topic, hostKey, hostName, durationMinutes });
  res.status(201).json({ room });
});

// POST /api/gtg/join
const join = asyncHandler(async (req, res) => {
  const { joinCode, participantKey, name } = req.body;
  const room = await joinRoom({ joinCode, participantKey, name });
  res.status(200).json({ room });
});

// GET /api/gtg/room/:roomId
const getById = asyncHandler(async (req, res) => {
  const room = await getRoom(req.params.roomId);
  res.status(200).json({ room });
});

// GET /api/gtg/code/:joinCode
const getByCode = asyncHandler(async (req, res) => {
  const room = await getRoomByCode(req.params.joinCode);
  res.status(200).json({ room });
});

// POST /api/gtg/start
const start = asyncHandler(async (req, res) => {
  const { roomId, hostKey } = req.body;
  const room = await startDiscussion({ roomId, hostKey });
  res.status(200).json({ room });
});

// POST /api/gtg/end
const end = asyncHandler(async (req, res) => {
  const { roomId, hostKey } = req.body;
  const room = await endDiscussion({ roomId, hostKey });
  res.status(200).json({ room });
});

// GET /api/gtg/results/:roomId
const results = asyncHandler(async (req, res) => {
  const room = await getResults(req.params.roomId);
  res.status(200).json({ room });
});

module.exports = { create, join, getById, getByCode, start, end, results };

const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const GDRoom    = require("../models/GDRoom");
const GDMessage = require("../models/GDMessage");
const GDResult  = require("../models/GDResult");

// ── Helpers ───────────────────────────────────────────────────────────────────
const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const extractKeywords = (topic) => {
  const stop = new Set(["the","a","an","is","are","was","were","be","been","have","has","do","does","will","would","could","should","may","might","can","to","of","in","for","on","with","at","by","from","and","but","or","not","this","that","it","its","we","they","you","he","she","i","my","our","your","his","her","them","us"]);
  return topic.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && !stop.has(w));
};

const PROFANITY = ["damn","hell","crap","shit","fuck","ass","bitch"];
const filterProfanity = (text) => {
  let out = text;
  PROFANITY.forEach((w) => { out = out.replace(new RegExp(`\\b${w}\\b`, "gi"), "***"); });
  return out;
};

// ── POST /api/gd/create ───────────────────────────────────────────────────────
const createRoom = asyncHandler(async (req, res) => {
  const { hostId, hostName, topic, durationSec = 600 } = req.body;
  if (!hostId || !hostName || !topic) throw new AppError("hostId, hostName and topic are required.", 400);

  let joinCode, attempts = 0;
  do {
    joinCode = genCode();
    if (++attempts > 20) throw new AppError("Could not generate unique code.", 500);
  } while (await GDRoom.findOne({ joinCode }));

  const room = await GDRoom.create({
    joinCode, hostId, hostName, topic,
    durationSec: Math.min(Math.max(durationSec, 60), 1800),
    topicKeywords: extractKeywords(topic),
    participants: [{ userId: hostId, name: hostName }],
  });

  res.status(201).json({ room });
});

// ── POST /api/gd/join ─────────────────────────────────────────────────────────
const joinRoom = asyncHandler(async (req, res) => {
  const { joinCode, userId, name } = req.body;
  if (!joinCode || !userId || !name) throw new AppError("joinCode, userId and name are required.", 400);

  const room = await GDRoom.findOne({ joinCode: joinCode.toUpperCase() });
  if (!room) throw new AppError("Room not found. Check your join code.", 404);
  if (room.status === "ended") throw new AppError("This discussion has already ended.", 400);
  if (room.status === "live")  throw new AppError("Discussion already started. Cannot join now.", 400);

  const existing = room.participants.find((p) => p.userId === userId);
  if (existing) { existing.online = true; await room.save(); return res.status(200).json({ room }); }

  if (room.participants.length >= room.maxParticipants) {
    throw new AppError(`Room is full (max ${room.maxParticipants} participants).`, 400);
  }

  room.participants.push({ userId, name });
  await room.save();
  res.status(200).json({ room });
});

// ── GET /api/gd/room/:roomId ──────────────────────────────────────────────────
const getRoom = asyncHandler(async (req, res) => {
  const room = await GDRoom.findById(req.params.roomId);
  if (!room) throw new AppError("Room not found.", 404);
  res.status(200).json({ room });
});

// ── POST /api/gd/start/:roomId ────────────────────────────────────────────────
const startRoom = asyncHandler(async (req, res) => {
  const { hostId } = req.body;
  const room = await GDRoom.findById(req.params.roomId);
  if (!room) throw new AppError("Room not found.", 404);
  if (room.hostId !== hostId) throw new AppError("Only the host can start.", 403);
  if (room.status !== "waiting") throw new AppError("Room already started or ended.", 400);

  // Need at least 2 non-host participants
  const nonHost = room.participants.filter((p) => p.userId !== hostId);
  if (nonHost.length < 1) throw new AppError("Need at least 1 participant (besides host) to start.", 400);

  room.status    = "live";
  room.startTime = new Date();
  room.endTime   = new Date(Date.now() + room.durationSec * 1000);
  await room.save();
  res.status(200).json({ room });
});

// ── POST /api/gd/end/:roomId ──────────────────────────────────────────────────
const endRoom = asyncHandler(async (req, res) => {
  const { hostId } = req.body;
  const room = await GDRoom.findById(req.params.roomId);
  if (!room) throw new AppError("Room not found.", 404);
  if (room.hostId !== hostId) throw new AppError("Only the host can end.", 403);
  if (room.status === "ended") throw new AppError("Already ended.", 400);

  room.status  = "ended";
  room.endTime = new Date();
  await room.save();

  // Compute and store results
  const messages = await GDMessage.find({ roomId: room._id });
  await computeResults(room, messages);

  res.status(200).json({ room });
});

// ── POST /api/gd/message ──────────────────────────────────────────────────────
const saveMessage = asyncHandler(async (req, res) => {
  const { roomId, userId, name, message } = req.body;
  if (!roomId || !userId || !name || !message) throw new AppError("All fields required.", 400);
  if (message.trim().length < 10) throw new AppError("Message must be at least 10 characters.", 400);

  const room = await GDRoom.findById(roomId);
  if (!room || room.status !== "live") throw new AppError("Room is not live.", 400);

  const clean = filterProfanity(message.trim());
  const msg = await GDMessage.create({ roomId, userId, name, message: clean });
  res.status(201).json({ message: msg });
});

// ── GET /api/gd/result/:roomId ────────────────────────────────────────────────
const getResults = asyncHandler(async (req, res) => {
  const room = await GDRoom.findById(req.params.roomId);
  if (!room) throw new AppError("Room not found.", 404);

  let results = await GDResult.find({ roomId: room._id }).sort({ rank: 1 });

  // If results not yet computed (e.g. auto-ended), compute now
  if (results.length === 0 && room.status === "ended") {
    const messages = await GDMessage.find({ roomId: room._id });
    results = await computeResults(room, messages);
  }

  const messages = await GDMessage.find({ roomId: room._id }).sort({ timestamp: 1 });
  res.status(200).json({ room, results, messages });
});

// ── Scoring ───────────────────────────────────────────────────────────────────
const computeResults = async (room, messages) => {
  const keywords = room.topicKeywords || [];

  // Delete old results
  await GDResult.deleteMany({ roomId: room._id });

  // Only score non-host participants
  const participants = room.participants.filter((p) => p.userId !== room.hostId);
  if (participants.length === 0) return [];

  const maxMsgs = Math.max(...participants.map((p) => messages.filter((m) => m.userId === p.userId).length), 1);

  const scored = participants.map((p) => {
    const myMsgs = messages.filter((m) => m.userId === p.userId);
    const msgCount   = myMsgs.length;
    const totalChars = myMsgs.reduce((s, m) => s + m.message.length, 0);
    const avgLen     = msgCount > 0 ? totalChars / msgCount : 0;
    const allText    = myMsgs.map((m) => m.message.toLowerCase()).join(" ");
    const kwHits     = keywords.filter((kw) => allText.includes(kw)).length;

    // Participation 0–10
    const participation = Math.min(10, Math.round((msgCount / maxMsgs) * 10 * 10) / 10);

    // Communication 0–10: avg message length sweet spot 30–80 chars
    let communication = 0;
    if (avgLen >= 30 && avgLen <= 80) communication = 10;
    else if (avgLen >= 15 && avgLen < 30) communication = 7;
    else if (avgLen > 80 && avgLen <= 150) communication = 8;
    else if (avgLen > 150) communication = 5;
    else if (avgLen > 0) communication = 4;

    // Relevance 0–10
    const relevance = keywords.length > 0
      ? Math.min(10, Math.round((kwHits / keywords.length) * 10 * 10) / 10)
      : participation > 0 ? 5 : 0;

    const overall = Math.round(((participation * 0.4) + (communication * 0.3) + (relevance * 0.3)) * 10) / 10;

    const feedback = buildFeedback({ participation, communication, relevance, overall, msgCount, avgLen });

    return { userId: p.userId, name: p.name, scores: { participation, communication, relevance, overall }, stats: { messageCount: msgCount, totalChars, avgMsgLength: Math.round(avgLen), keywordHits: kwHits }, feedback };
  });

  // Rank
  scored.sort((a, b) => b.scores.overall - a.scores.overall);
  scored.forEach((s, i) => { s.rank = i + 1; });

  const docs = await GDResult.insertMany(scored.map((s) => ({ roomId: room._id, ...s })));
  return docs;
};

const buildFeedback = ({ participation, communication, relevance, overall, msgCount, avgLen }) => {
  if (msgCount === 0) return "Did not participate in the discussion.";
  const tips = [];
  if (participation < 4) tips.push("Participate more — share your views frequently.");
  if (relevance < 4) tips.push("Stay on topic and reference the discussion subject.");
  if (communication < 5) {
    if (avgLen < 15) tips.push("Write more complete thoughts — aim for 30+ characters per message.");
    else if (avgLen > 150) tips.push("Be more concise — shorter, focused messages are more effective.");
  }
  if (overall >= 8) tips.push("Excellent contribution! Well-balanced and relevant.");
  else if (overall >= 6) tips.push("Good effort. Keep engaging consistently.");
  else if (tips.length === 0) tips.push("Focus on relevance and clear communication.");
  return tips.join(" ");
};

module.exports = { createRoom, joinRoom, getRoom, startRoom, endRoom, saveMessage, getResults };

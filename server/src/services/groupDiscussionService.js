const GroupDiscussion = require("../models/GroupDiscussion");
const AppError = require("../utils/appError");

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateJoinCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const extractKeywords = (topic) => {
  const stopWords = new Set(["the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","shall","can","need","dare","ought","used","to","of","in","for","on","with","at","by","from","up","about","into","through","during","before","after","above","below","between","out","off","over","under","again","further","then","once","and","but","or","nor","so","yet","both","either","neither","not","only","own","same","than","too","very","just","because","as","until","while","although","though","even","if","unless","since","when","where","who","which","that","this","these","those","it","its","we","our","they","their","you","your","he","his","she","her","i","my","me","us","them","him","her"]);
  return topic.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && !stopWords.has(w));
};

// ── Create room ───────────────────────────────────────────────────────────────
const createRoom = async ({ title, topic, hostKey, hostName, durationMinutes = 10 }) => {
  if (!title || !topic || !hostKey || !hostName) {
    throw new AppError("title, topic, hostKey and hostName are required.", 400);
  }

  let joinCode;
  let attempts = 0;
  do {
    joinCode = generateJoinCode();
    attempts++;
    if (attempts > 20) throw new AppError("Could not generate unique join code.", 500);
  } while (await GroupDiscussion.findOne({ joinCode }));

  // Host is NOT added to participants — host is moderator only, not scored
  const room = await GroupDiscussion.create({
    title,
    topic,
    joinCode,
    hostKey,
    hostName,
    durationMinutes: Math.min(Math.max(durationMinutes, 2), 60),
    topicKeywords: extractKeywords(topic),
    participants: [], // participants only — host excluded
  });

  return room;
};

// ── Join room ─────────────────────────────────────────────────────────────────
const joinRoom = async ({ joinCode, participantKey, name }) => {
  if (!joinCode || !participantKey || !name) {
    throw new AppError("joinCode, participantKey and name are required.", 400);
  }

  const room = await GroupDiscussion.findOne({ joinCode: joinCode.toUpperCase() });
  if (!room) throw new AppError("Room not found. Check your join code.", 404);
  if (room.status === "completed") throw new AppError("This discussion has already ended.", 400);

  // Check if already in room
  const existing = room.participants.find((p) => p.participantKey === participantKey);
  if (existing) {
    existing.online = true;
    await room.save();
    return room;
  }

  if (room.status === "active") throw new AppError("Discussion has already started. You cannot join now.", 400);

  room.participants.push({ participantKey, name, isHost: false });
  await room.save();
  return room;
};

// ── Get room ──────────────────────────────────────────────────────────────────
const getRoom = async (roomId) => {
  const room = await GroupDiscussion.findById(roomId);
  if (!room) throw new AppError("Room not found.", 404);
  return room;
};

const getRoomByCode = async (joinCode) => {
  const room = await GroupDiscussion.findOne({ joinCode: joinCode.toUpperCase() });
  if (!room) throw new AppError("Room not found.", 404);
  return room;
};

// ── Start discussion ──────────────────────────────────────────────────────────
const startDiscussion = async ({ roomId, hostKey }) => {
  const room = await GroupDiscussion.findById(roomId);
  if (!room) throw new AppError("Room not found.", 404);
  if (room.hostKey !== hostKey) throw new AppError("Only the host can start the discussion.", 403);
  if (room.status !== "waiting") throw new AppError("Discussion already started or ended.", 400);
  // Need at least 2 participants (host is not a participant)
  if (room.participants.length < 2) throw new AppError("Need at least 2 participants to start the discussion.", 400);

  room.status = "active";
  room.startedAt = new Date();
  await room.save();
  return room;
};

// ── Save message — host cannot send messages ──────────────────────────────────
const saveMessage = async ({ roomId, participantKey, name, text }) => {
  const room = await GroupDiscussion.findById(roomId);
  if (!room) throw new AppError("Room not found.", 404);
  if (room.status !== "active") throw new AppError("Discussion is not active.", 400);

  // Block host from sending messages
  if (room.hostKey === participantKey) {
    throw new AppError("The host cannot send messages. You are the moderator.", 403);
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  room.messages.push({ participantKey, name, text: text.trim(), wordCount });

  // Update participant stats
  const participant = room.participants.find((p) => p.participantKey === participantKey);
  if (participant) {
    participant.messageCount += 1;
    participant.totalWords += wordCount;
  }

  await room.save();
  return room.messages[room.messages.length - 1];
};

// ── End discussion + score ────────────────────────────────────────────────────
const endDiscussion = async ({ roomId, hostKey }) => {
  const room = await GroupDiscussion.findById(roomId);
  if (!room) throw new AppError("Room not found.", 404);
  if (room.hostKey !== hostKey) throw new AppError("Only the host can end the discussion.", 403);
  if (room.status !== "active") throw new AppError("Discussion is not active.", 400);

  room.status = "completed";
  room.endedAt = new Date();

  // Score all participants
  scoreParticipants(room);

  await room.save();
  return room;
};

// ── Auto-end when timer expires ───────────────────────────────────────────────
const autoEndDiscussion = async (roomId) => {
  const room = await GroupDiscussion.findById(roomId);
  if (!room || room.status !== "active") return null;

  room.status = "completed";
  room.endedAt = new Date();
  scoreParticipants(room);
  await room.save();
  return room;
};

// ── Scoring logic ─────────────────────────────────────────────────────────────
const scoreParticipants = (room) => {
  const totalMessages = room.messages.length || 1;
  const keywords = room.topicKeywords || [];

  // Find max stats for normalisation
  const maxMessages = Math.max(...room.participants.map((p) => p.messageCount), 1);
  const maxWords    = Math.max(...room.participants.map((p) => p.totalWords), 1);

  room.participants.forEach((p) => {
    // 1. Participation (0–10): based on message count relative to most active
    const participationRaw = (p.messageCount / maxMessages) * 10;
    const participation = Math.min(10, Math.round(participationRaw * 10) / 10);

    // 2. Relevance (0–10): keyword hits in their messages
    const myMessages = room.messages.filter((m) => m.participantKey === p.participantKey);
    const allText = myMessages.map((m) => m.text.toLowerCase()).join(" ");
    const keywordHits = keywords.filter((kw) => allText.includes(kw)).length;
    const relevance = keywords.length > 0
      ? Math.min(10, Math.round((keywordHits / keywords.length) * 10 * 10) / 10)
      : participation > 0 ? 5 : 0;

    // 3. Communication (0–10): avg words per message (sweet spot 10–30 words)
    const avgWords = p.messageCount > 0 ? p.totalWords / p.messageCount : 0;
    let communication = 0;
    if (avgWords >= 10 && avgWords <= 30) communication = 10;
    else if (avgWords >= 5 && avgWords < 10) communication = 7;
    else if (avgWords > 30 && avgWords <= 50) communication = 8;
    else if (avgWords > 50) communication = 6;
    else if (avgWords > 0) communication = 4;

    const overall = Math.round(((participation + relevance + communication) / 3) * 10) / 10;

    p.scores = { participation, relevance, communication, overall };
    p.feedback = buildFeedback({ participation, relevance, communication, overall, avgWords, messageCount: p.messageCount });
  });

  // Rank by overall score
  const sorted = [...room.participants].sort((a, b) => b.scores.overall - a.scores.overall);
  sorted.forEach((p, i) => {
    const participant = room.participants.find((x) => x.participantKey === p.participantKey);
    if (participant) participant.rank = i + 1;
  });
};

const buildFeedback = ({ participation, relevance, communication, overall, avgWords, messageCount }) => {
  const tips = [];
  if (messageCount === 0) return "Did not participate in the discussion.";
  if (participation < 4) tips.push("Participate more actively — share your views frequently.");
  if (relevance < 4) tips.push("Stay on topic — reference the discussion subject in your messages.");
  if (communication < 5) {
    if (avgWords < 5) tips.push("Write more complete sentences to express your ideas clearly.");
    else if (avgWords > 50) tips.push("Be more concise — shorter, focused messages are more effective.");
  }
  if (overall >= 8) tips.push("Excellent contribution! Well-balanced participation and communication.");
  else if (overall >= 6) tips.push("Good effort. Keep engaging with the topic consistently.");
  else if (tips.length === 0) tips.push("Keep practicing — focus on relevance and clear communication.");
  return tips.join(" ");
};

// ── Get results ───────────────────────────────────────────────────────────────
const getResults = async (roomId) => {
  const room = await GroupDiscussion.findById(roomId);
  if (!room) throw new AppError("Room not found.", 404);
  if (room.status !== "completed") throw new AppError("Discussion not yet completed.", 400);
  return room;
};

module.exports = {
  createRoom, joinRoom, getRoom, getRoomByCode,
  startDiscussion, saveMessage, endDiscussion, autoEndDiscussion, getResults,
};

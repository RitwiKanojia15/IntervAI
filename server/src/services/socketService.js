const { saveMessage, autoEndDiscussion } = require("./groupDiscussionService");
const GDRoom    = require("../models/GDRoom");
const GDMessage = require("../models/GDMessage");
const GDResult  = require("../models/GDResult");

let ioInstance = null;

const getLiveTestRoomName = (testId) => `live-test:${testId}`;
const getGtgRoomName      = (roomId) => `gtg:${roomId}`;
const getGdRoomName       = (roomId) => `gd:${roomId}`;

const gtgTimers = {};
const gtgBells  = {};
const gdTimers  = {};
const gdBells   = {};

const initializeSocketServer = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {

    // ── Live Test ─────────────────────────────────────────────────────────────
    socket.on("live-test:join-room", ({ testId }) => {
      if (!testId) return;
      socket.join(getLiveTestRoomName(testId));
    });
    socket.on("live-test:leave-room", ({ testId }) => {
      if (!testId) return;
      socket.leave(getLiveTestRoomName(testId));
    });

    // ── GTG: room membership ──────────────────────────────────────────────────
    socket.on("gtg:join", ({ roomId, participantKey, name }) => {
      if (!roomId) return;
      socket.join(getGtgRoomName(roomId));
      socket.data.gtgRoomId      = roomId;
      socket.data.participantKey = participantKey;
      socket.data.name           = name;
      // Tell everyone else this person joined
      socket.to(getGtgRoomName(roomId)).emit("gtg:participant-joined", { participantKey, name });
    });

    socket.on("gtg:leave", ({ roomId, participantKey }) => {
      if (!roomId) return;
      socket.leave(getGtgRoomName(roomId));
      socket.to(getGtgRoomName(roomId)).emit("gtg:participant-left", { participantKey });
    });

    // ── GTG: text chat (kept for host read-only transcript) ───────────────────
    socket.on("gtg:message", async ({ roomId, participantKey, name, text }) => {
      if (!roomId || !text?.trim()) return;
      try {
        const msg = await saveMessage({ roomId, participantKey, name, text });
        io.to(getGtgRoomName(roomId)).emit("gtg:message", {
          _id: msg._id, participantKey, name,
          text: msg.text, wordCount: msg.wordCount, sentAt: msg.sentAt,
        });
      } catch (err) {
        socket.emit("gtg:error", { message: err.message });
      }
    });

    // ── GTG: host starts discussion ───────────────────────────────────────────
    socket.on("gtg:started", ({ roomId, durationMinutes }) => {
      if (!roomId) return;
      io.to(getGtgRoomName(roomId)).emit("gtg:started", { durationMinutes });

      // Clear stale timers
      if (gtgTimers[roomId]) clearTimeout(gtgTimers[roomId]);
      if (gtgBells[roomId])  clearTimeout(gtgBells[roomId]);

      const totalMs   = durationMinutes * 60 * 1000;
      const bellMs    = totalMs - 2 * 60 * 1000; // 2 min before end

      // Bell at 2-min warning
      if (bellMs > 0) {
        gtgBells[roomId] = setTimeout(() => {
          io.to(getGtgRoomName(roomId)).emit("gtg:bell", { secondsLeft: 120 });
          delete gtgBells[roomId];
        }, bellMs);
      }

      // Auto-end when timer expires
      gtgTimers[roomId] = setTimeout(async () => {
        try {
          const room = await autoEndDiscussion(roomId);
          if (room) {
            io.to(getGtgRoomName(roomId)).emit("gtg:ended", {
              participants: room.participants,
              messages:     room.messages,
            });
          }
        } catch { /* ignore */ }
        delete gtgTimers[roomId];
      }, totalMs);
    });

    // ── GTG: host manually ends ───────────────────────────────────────────────
    socket.on("gtg:ended", ({ roomId }) => {
      if (!roomId) return;
      if (gtgTimers[roomId]) { clearTimeout(gtgTimers[roomId]); delete gtgTimers[roomId]; }
      if (gtgBells[roomId])  { clearTimeout(gtgBells[roomId]);  delete gtgBells[roomId]; }
      io.to(getGtgRoomName(roomId)).emit("gtg:ended", {});
    });

    // ── GTG: WebRTC signaling ─────────────────────────────────────────────────
    // Relay WebRTC offer from one peer to another
    socket.on("gtg:webrtc-offer", ({ roomId, to, from, offer }) => {
      if (!roomId) return;
      // Find the target socket and send directly
      socket.to(getGtgRoomName(roomId)).emit("gtg:webrtc-offer", { from, offer });
    });

    // Relay WebRTC answer
    socket.on("gtg:webrtc-answer", ({ roomId, to, from, answer }) => {
      if (!roomId) return;
      socket.to(getGtgRoomName(roomId)).emit("gtg:webrtc-answer", { from, answer });
    });

    // Relay ICE candidates
    socket.on("gtg:ice-candidate", ({ roomId, to, from, candidate }) => {
      if (!roomId) return;
      socket.to(getGtgRoomName(roomId)).emit("gtg:ice-candidate", { from, candidate });
    });

    // Mic/camera state change — broadcast to room so others can update UI
    socket.on("gtg:media-state", ({ roomId, participantKey, micOn, cameraOn }) => {
      if (!roomId) return;
      socket.to(getGtgRoomName(roomId)).emit("gtg:media-state", { participantKey, micOn, cameraOn });
    });

    // ── GD: WebRTC Group Discussion ───────────────────────────────────────────

    socket.on("gd:join", ({ roomId, userId, name }) => {
      if (!roomId) return;
      socket.join(getGdRoomName(roomId));
      socket.data.gdRoomId = roomId;
      socket.data.gdUserId = userId;
      socket.data.gdName   = name;
      // Tell everyone else in the room
      socket.to(getGdRoomName(roomId)).emit("gd:user-joined", { userId, name, socketId: socket.id });
    });

    socket.on("gd:leave", ({ roomId, userId }) => {
      if (!roomId) return;
      socket.leave(getGdRoomName(roomId));
      socket.to(getGdRoomName(roomId)).emit("gd:user-left", { userId });
    });

    // WebRTC signaling — relay offer/answer/ICE between peers
    socket.on("gd:offer", ({ roomId, to, from, offer }) => {
      if (!roomId) return;
      // Send only to the target peer, not broadcast to everyone
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.data.gdRoomId === roomId && s.data.gdUserId === to
      );
      if (targetSocket) {
        targetSocket.emit("gd:offer", { from, offer });
      } else {
        // Fallback: broadcast to room (peer will filter by 'from')
        socket.to(getGdRoomName(roomId)).emit("gd:offer", { from, offer });
      }
    });

    socket.on("gd:answer", ({ roomId, to, from, answer }) => {
      if (!roomId) return;
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.data.gdRoomId === roomId && s.data.gdUserId === to
      );
      if (targetSocket) {
        targetSocket.emit("gd:answer", { from, answer });
      } else {
        socket.to(getGdRoomName(roomId)).emit("gd:answer", { from, answer });
      }
    });

    socket.on("gd:ice-candidate", ({ roomId, to, from, candidate }) => {
      if (!roomId) return;
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.data.gdRoomId === roomId && s.data.gdUserId === to
      );
      if (targetSocket) {
        targetSocket.emit("gd:ice-candidate", { from, candidate });
      } else {
        socket.to(getGdRoomName(roomId)).emit("gd:ice-candidate", { from, candidate });
      }
    });

    // Media state (mic/camera toggle)
    socket.on("gd:media-state", ({ roomId, userId, micOn, cameraOn }) => {
      if (!roomId) return;
      socket.to(getGdRoomName(roomId)).emit("gd:media-state", { userId, micOn, cameraOn });
    });

    // Host forces a participant's mic/camera on or off
    socket.on("gd:force-media", ({ roomId, targetUserId, micOn, cameraOn }) => {
      if (!roomId || !targetUserId) return;
      // Broadcast to everyone so the target participant receives it
      io.to(getGdRoomName(roomId)).emit("gd:force-media", { targetUserId, micOn, cameraOn });
    });

    // Host kicks a participant
    socket.on("gd:kick", ({ roomId, targetUserId }) => {
      if (!roomId || !targetUserId) return;
      // Notify the kicked user and everyone else
      io.to(getGdRoomName(roomId)).emit("gd:kicked", { targetUserId });
    });

    // Chat message — save to DB and broadcast
    socket.on("gd:chat", async ({ roomId, userId, name, message }) => {
      if (!roomId || !message?.trim()) return;
      if (message.trim().length < 10) {
        socket.emit("gd:error", { message: "Message must be at least 10 characters." });
        return;
      }
      try {
        const PROFANITY = ["damn","hell","crap","shit","fuck","ass","bitch"];
        let clean = message.trim();
        PROFANITY.forEach((w) => { clean = clean.replace(new RegExp(`\\b${w}\\b`, "gi"), "***"); });
        const msg = await GDMessage.create({ roomId, userId, name, message: clean });
        io.to(getGdRoomName(roomId)).emit("gd:chat", {
          _id: msg._id, userId, name, message: clean, timestamp: msg.timestamp,
        });
      } catch (err) {
        socket.emit("gd:error", { message: "Failed to save message." });
      }
    });

    // Host starts discussion
    socket.on("gd:started", ({ roomId, durationSec, endTime }) => {
      if (!roomId) return;
      io.to(getGdRoomName(roomId)).emit("gd:started", { durationSec, endTime });

      // Clear stale timers
      if (gdTimers[roomId]) clearTimeout(gdTimers[roomId]);
      if (gdBells[roomId])  clearTimeout(gdBells[roomId]);

      const totalMs = durationSec * 1000;
      const bellMs  = totalMs - 2 * 60 * 1000;

      // 2-min warning bell
      if (bellMs > 0) {
        gdBells[roomId] = setTimeout(() => {
          io.to(getGdRoomName(roomId)).emit("gd:bell", { secondsLeft: 120 });
          delete gdBells[roomId];
        }, bellMs);
      }

      // Auto-end
      gdTimers[roomId] = setTimeout(async () => {
        try {
          const room = await GDRoom.findById(roomId);
          if (room && room.status === "live") {
            room.status  = "ended";
            room.endTime = new Date();
            await room.save();
            const messages = await GDMessage.find({ roomId: room._id });
            // Compute results inline
            const keywords = room.topicKeywords || [];
            const participants = room.participants.filter((p) => p.userId !== room.hostId);
            const maxMsgs = Math.max(...participants.map((p) => messages.filter((m) => m.userId === p.userId).length), 1);
            await GDResult.deleteMany({ roomId: room._id });
            const scored = participants.map((p) => {
              const myMsgs = messages.filter((m) => m.userId === p.userId);
              const msgCount = myMsgs.length;
              const totalChars = myMsgs.reduce((s, m) => s + m.message.length, 0);
              const avgLen = msgCount > 0 ? totalChars / msgCount : 0;
              const allText = myMsgs.map((m) => m.message.toLowerCase()).join(" ");
              const kwHits = keywords.filter((kw) => allText.includes(kw)).length;
              const participation = Math.min(10, Math.round((msgCount / maxMsgs) * 10 * 10) / 10);
              let communication = 0;
              if (avgLen >= 30 && avgLen <= 80) communication = 10;
              else if (avgLen >= 15) communication = 7;
              else if (avgLen > 0) communication = 4;
              const relevance = keywords.length > 0 ? Math.min(10, Math.round((kwHits / keywords.length) * 10 * 10) / 10) : participation > 0 ? 5 : 0;
              const overall = Math.round(((participation * 0.4) + (communication * 0.3) + (relevance * 0.3)) * 10) / 10;
              return { userId: p.userId, name: p.name, scores: { participation, communication, relevance, overall }, stats: { messageCount: msgCount, totalChars, avgMsgLength: Math.round(avgLen), keywordHits: kwHits }, feedback: "" };
            });
            scored.sort((a, b) => b.scores.overall - a.scores.overall);
            scored.forEach((s, i) => { s.rank = i + 1; });
            await GDResult.insertMany(scored.map((s) => ({ roomId: room._id, ...s })));
            io.to(getGdRoomName(roomId)).emit("gd:ended", { roomId });
          }
        } catch { /* ignore */ }
        delete gdTimers[roomId];
      }, totalMs);
    });

    // Host manually ends
    socket.on("gd:ended", ({ roomId }) => {
      if (!roomId) return;
      if (gdTimers[roomId]) { clearTimeout(gdTimers[roomId]); delete gdTimers[roomId]; }
      if (gdBells[roomId])  { clearTimeout(gdBells[roomId]);  delete gdBells[roomId]; }
      io.to(getGdRoomName(roomId)).emit("gd:ended", { roomId });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const { gtgRoomId, participantKey, gdRoomId, gdUserId } = socket.data;
      if (gtgRoomId && participantKey) {
        socket.to(getGtgRoomName(gtgRoomId)).emit("gtg:participant-offline", { participantKey });
      }
      if (gdRoomId && gdUserId) {
        socket.to(getGdRoomName(gdRoomId)).emit("gd:user-left", { userId: gdUserId });
      }
    });
  });
};

// ── Emit helpers ──────────────────────────────────────────────────────────────
const emitLiveTestLeaderboardUpdate = (testId, payload) => {
  if (!ioInstance || !testId) return;
  ioInstance.to(getLiveTestRoomName(testId)).emit("live-test:leaderboard:update", payload);
};
const emitLiveTestUpdate = (testId, payload) => {
  if (!ioInstance || !testId) return;
  ioInstance.to(getLiveTestRoomName(testId)).emit("live-test:update", payload);
};
const emitTestStarted = (testId, payload) => {
  if (!ioInstance || !testId) return;
  ioInstance.to(getLiveTestRoomName(testId)).emit("testStarted", payload);
};

/**
 * Broadcast a participant violation event to everyone in the test room.
 * The host/admin listens for this to update the participant status panel in real-time.
 *
 * payload: { participantKey, participantName, warnings, maxWarnings, reason, locked }
 */
const emitLiveTestViolation = (testId, payload) => {
  if (!ioInstance || !testId) return;
  ioInstance.to(getLiveTestRoomName(testId)).emit("live-test:violation", payload);
};

const emitGtgUpdate = (roomId, event, payload) => {
  if (!ioInstance || !roomId) return;
  ioInstance.to(getGtgRoomName(roomId)).emit(event, payload);
};

module.exports = {
  emitLiveTestLeaderboardUpdate,
  emitLiveTestViolation,
  emitTestStarted,
  emitLiveTestUpdate,
  emitGtgUpdate,
  getLiveTestRoomName,
  getGtgRoomName,
  initializeSocketServer,
};

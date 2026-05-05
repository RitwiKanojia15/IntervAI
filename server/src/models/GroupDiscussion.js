const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    participantKey: { type: String, required: true },
    name:           { type: String, required: true },
    text:           { type: String, required: true, trim: true },
    wordCount:      { type: Number, default: 0 },
    sentAt:         { type: Date, default: Date.now },
  },
  { _id: true }
);

const participantSchema = new mongoose.Schema(
  {
    participantKey: { type: String, required: true },
    name:           { type: String, required: true },
    isHost:         { type: Boolean, default: false },
    joinedAt:       { type: Date, default: Date.now },
    socketId:       { type: String, default: null },
    online:         { type: Boolean, default: true },

    // Scoring
    messageCount:   { type: Number, default: 0 },
    totalWords:     { type: Number, default: 0 },
    scores: {
      participation:  { type: Number, default: 0 },  // 0–10
      relevance:      { type: Number, default: 0 },  // 0–10
      communication:  { type: Number, default: 0 },  // 0–10
      overall:        { type: Number, default: 0 },  // 0–10
    },
    feedback: { type: String, default: "" },
    rank:     { type: Number, default: 0 },
  },
  { _id: false }
);

const groupDiscussionSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    topic:     { type: String, required: true, trim: true },
    joinCode:  { type: String, required: true, unique: true, uppercase: true, index: true },
    hostKey:   { type: String, required: true },
    hostName:  { type: String, required: true },

    status: {
      type: String,
      enum: ["waiting", "active", "completed"],
      default: "waiting",
      index: true,
    },

    durationMinutes: { type: Number, default: 10, min: 2, max: 60 },
    startedAt:       { type: Date, default: null },
    endedAt:         { type: Date, default: null },

    participants: { type: [participantSchema], default: [] },
    messages:     { type: [messageSchema],     default: [] },

    // Topic keywords for relevance scoring
    topicKeywords: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupDiscussion", groupDiscussionSchema);

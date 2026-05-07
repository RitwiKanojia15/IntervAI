const mongoose = require("mongoose");

const answerEntrySchema = new mongoose.Schema(
  {
    selectedOptionId: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const liveTestAttemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveTest",
      required: true,
      index: true,
    },
    participantKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    participantName: {
      type: String,
      required: true,
      trim: true,
    },
    sessionToken: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    answers: {
      type: Map,
      of: answerEntrySchema,
      default: () => new Map(),
    },
    answeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    score: {
      type: Number,
      default: 0,
      index: true,
    },
    correct: {
      type: Number,
      default: 0,
      min: 0,
    },
    wrong: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeTakenSec: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    warnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    fullscreenExits: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["joined", "submitted", "expired", "disqualified"],
      default: "joined",
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

liveTestAttemptSchema.index({ testId: 1, participantKey: 1 }, { unique: true });
liveTestAttemptSchema.index({ testId: 1, status: 1, score: -1, timeTakenSec: 1, submittedAt: 1 });

module.exports = mongoose.model("LiveTestAttempt", liveTestAttemptSchema);

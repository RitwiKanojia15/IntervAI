const mongoose = require("mongoose");
const { LIVE_TEST_CATEGORIES } = require("../utils/liveTestUtils");

const difficultyDistributionSchema = new mongoose.Schema(
  {
    easy: { type: Number, default: 0.4, min: 0 },
    medium: { type: Number, default: 0.4, min: 0 },
    hard: { type: Number, default: 0.2, min: 0 },
  },
  { _id: false }
);

const liveTestSettingsSchema = new mongoose.Schema(
  {
    preventMultipleSessions: {
      type: Boolean,
      default: true,
    },
    antiCheatEnabled: {
      type: Boolean,
      default: true,
    },
    maxWarnings: {
      type: Number,
      default: 3,
      min: 0,
      max: 20,
    },
  },
  { _id: false }
);

const liveTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    joinCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "waiting", "live", "completed", "expired"],
      default: "waiting",
      index: true,
    },
    createdBy: {
      type: String,
      default: null,
      index: true,
    },
    categories: {
      type: [String],
      enum: LIVE_TEST_CATEGORIES,
      default: LIVE_TEST_CATEGORIES,
    },
    topics: {
      type: [String],
      default: [],
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
      max: 200,
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    totalDurationSec: {
      type: Number,
      required: true,
      min: 30,
    },
    startAt: {
      type: Date,
      index: true,
    },
    endAt: {
      type: Date,
      index: true,
    },
    difficultyDistribution: {
      type: difficultyDistributionSchema,
      default: () => ({}),
    },
    settings: {
      type: liveTestSettingsSchema,
      default: () => ({}),
    },
    leaderboardVersion: {
      type: Number,
      default: 0,
    },
    lastLeaderboardUpdateAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

liveTestSchema.index({ status: 1, endAt: 1 });
liveTestSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model("LiveTest", liveTestSchema);

const mongoose = require("mongoose");

const answeredQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOptionId: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    timeSpentSec: {
      type: Number,
      min: 0,
      default: 0,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const testSessionSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["standard", "mixed"],
      default: "standard",
    },
    category: {
      type: String,
      default: null,
    },
    topic: {
      type: String,
      default: null,
    },
    difficulty: {
      type: String,
      default: null,
    },
    requestedCount: {
      type: Number,
      required: true,
      min: 1,
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    answers: {
      type: [answeredQuestionSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    correct: {
      type: Number,
      default: 0,
    },
    wrong: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestSession", testSessionSchema);

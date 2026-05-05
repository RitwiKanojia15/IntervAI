const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    correctOptionId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "quantitative",
        "logical-reasoning",
        "technical",
        "spatial-reasoning",
        "logical-puzzles",
      ],
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      index: true,
    },
    type: {
      type: String,
      required: true,
      default: "mcq",
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [optionSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: "At least two options are required.",
      },
    },
    answer: {
      type: answerSchema,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    timeLimitSec: {
      type: Number,
      required: true,
      min: 15,
      default: 60,
    },
  },
  { timestamps: true }
);

questionSchema.index({ category: 1, topic: 1, difficulty: 1 });
questionSchema.index({ category: 1, difficulty: 1, topic: 1, createdAt: -1 });

module.exports = mongoose.model("Question", questionSchema);

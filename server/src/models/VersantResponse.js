const mongoose = require("mongoose");

const mcqAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    selectedOptionId: { type: String, default: null },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const speakingEvalSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "VersantQuestion" },
    prompt: { type: String },
    transcript: { type: String, default: "" },
    scores: {
      fluency: { type: Number, default: 0 },
      pronunciation: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const versantResponseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    module: { type: String, required: true, enum: ["grammar", "reading", "listening", "speaking"] },

    // Grammar / Reading / Listening
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "VersantQuestion", default: null },
    answers: { type: [mcqAnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },

    // Speaking
    speakingEval: { type: speakingEvalSchema, default: null },

    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VersantResponse", versantResponseSchema);

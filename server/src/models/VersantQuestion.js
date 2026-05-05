const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  { id: { type: String, required: true }, text: { type: String, required: true } },
  { _id: false }
);

const mcqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [optionSchema], required: true },
    correctOptionId: { type: String, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const versantQuestionSchema = new mongoose.Schema(
  {
    // "grammar" | "reading" | "listening" | "speaking"
    type: { type: String, required: true, enum: ["grammar", "reading", "listening", "speaking"], index: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    topic: { type: String, default: "" },
    category: { type: String, default: "" }, // e.g. Technology, Science, History

    // Grammar: sentence with error
    sentence: { type: String, default: "" },
    options: { type: [optionSchema], default: [] },
    correctOptionId: { type: String, default: "" },
    explanation: { type: String, default: "" },

    // Reading / Listening: passage + questions
    title: { type: String, default: "" },
    passage: { type: String, default: "" },       // hidden for listening
    questions: { type: [mcqSchema], default: [] },

    // Speaking: prompt
    prompt: { type: String, default: "" },
    sampleAnswer: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VersantQuestion", versantQuestionSchema);

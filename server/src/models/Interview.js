const mongoose = require("mongoose");

const answerEntrySchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    question:      { type: String, required: true },
    skill:         { type: String, default: "" },
    difficulty:    { type: String, default: "medium" },
    answer:        { type: String, default: "" },
    transcript:    { type: String, default: "" }, // voice transcript
    score:         { type: Number, default: 0, min: 0, max: 10 },
    feedback:      { type: String, default: "" },
    keywords:      [{ type: String }],
    expectedKeywords: [{ type: String }],
    evaluationMethod: { type: String, enum: ["basic", "ai"], default: "basic" },
    answeredAt:    { type: Date, default: Date.now },
  },
  { _id: false }
);

const communicationSchema = new mongoose.Schema(
  {
    fluency:    { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    clarity:    { type: Number, default: 0 },
    fillerCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    role:     { type: String, required: true, trim: true },
    skills:   [{ type: String, trim: true }],
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    mode:     { type: String, enum: ["text", "voice"], default: "text" },
    status:   { type: String, enum: ["active", "completed"], default: "active" },

    questions: [{ type: String }],           // question texts (grows dynamically)
    questionMeta: [                           // per-question metadata
      {
        skill:      { type: String, default: "" },
        difficulty: { type: String, default: "medium" },
        source:     { type: String, enum: ["db", "ai"], default: "ai" },
        expectedKeywords: [{ type: String }],
        _id: false,
      },
    ],
    targetCount: { type: Number, default: 10 }, // total questions planned

    answers:   { type: [answerEntrySchema], default: [] },
    currentDifficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },

    overallScore:       { type: Number, default: 0 },
    communicationScore: { type: communicationSchema, default: () => ({}) },

    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);

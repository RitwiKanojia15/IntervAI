const mongoose = require("mongoose");

const gdResultSchema = new mongoose.Schema({
  roomId:    { type: mongoose.Schema.Types.ObjectId, ref: "GDRoom", required: true, index: true },
  userId:    { type: String, required: true },
  name:      { type: String, required: true },
  scores: {
    participation:  { type: Number, default: 0 },
    communication:  { type: Number, default: 0 },
    relevance:      { type: Number, default: 0 },
    overall:        { type: Number, default: 0 },
  },
  stats: {
    messageCount:   { type: Number, default: 0 },
    totalChars:     { type: Number, default: 0 },
    avgMsgLength:   { type: Number, default: 0 },
    keywordHits:    { type: Number, default: 0 },
  },
  feedback: { type: String, default: "" },
  rank:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("GDResult", gdResultSchema);

const mongoose = require("mongoose");

const gdMessageSchema = new mongoose.Schema({
  roomId:    { type: mongoose.Schema.Types.ObjectId, ref: "GDRoom", required: true, index: true },
  userId:    { type: String, required: true },
  name:      { type: String, required: true },
  message:   { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model("GDMessage", gdMessageSchema);

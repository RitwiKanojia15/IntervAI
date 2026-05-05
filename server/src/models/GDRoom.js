const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  name:      { type: String, required: true },
  socketId:  { type: String, default: null },
  joinedAt:  { type: Date, default: Date.now },
  online:    { type: Boolean, default: true },
  micOn:     { type: Boolean, default: true },
  cameraOn:  { type: Boolean, default: true },
}, { _id: false });

const gdRoomSchema = new mongoose.Schema({
  joinCode:     { type: String, required: true, unique: true, uppercase: true, index: true },
  hostId:       { type: String, required: true },
  hostName:     { type: String, required: true },
  topic:        { type: String, required: true, trim: true },
  status:       { type: String, enum: ["waiting", "live", "ended"], default: "waiting", index: true },
  durationSec:  { type: Number, default: 600, min: 60, max: 1800 },
  startTime:    { type: Date, default: null },
  endTime:      { type: Date, default: null },
  participants: { type: [participantSchema], default: [] },
  maxParticipants: { type: Number, default: 6 },
  topicKeywords:   [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("GDRoom", gdRoomSchema);

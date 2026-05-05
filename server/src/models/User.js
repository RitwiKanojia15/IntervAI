const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const resumeAnalysisSchema = new mongoose.Schema(
  {
    filename: { type: String },
    languages: [{ type: String }],
    skills: [{ type: String }],
    projectTitles: [{ type: String }],
    technicalStrengths: [{ type: String }],
    summary: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, default: null },
    role: { type: String, default: "" },
    college: { type: String, default: "" },
    bio: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    resume: { type: resumeAnalysisSchema, default: null },
    oauthProvider: { type: String, enum: ["google", "microsoft", null], default: null },
    oauthId: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false; // OAuth users have no password
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);

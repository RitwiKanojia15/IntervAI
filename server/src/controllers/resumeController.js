const multer = require("multer");
const asyncHandler = require("../utils/asyncHandler");
const { processResumeUpload } = require("../services/resumeService");
const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Soft auth — attaches req.user if a valid token is present, but doesn't block the request
const softAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    }
  } catch {
    // token invalid — continue without user
  }
  next();
};

const uploadResume = asyncHandler(async (req, res) => {
  const payload = await processResumeUpload(req.file);

  // Persist analysis to the user's profile if authenticated
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      resume: {
        filename: payload.filename,
        ...payload.analysis,
        uploadedAt: new Date(),
      },
    });
  }

  res.status(200).json({
    message: "Resume uploaded and analyzed successfully.",
    ...payload,
  });
});

module.exports = { upload, softAuth, uploadResume };

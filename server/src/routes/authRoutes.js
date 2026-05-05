const express = require("express");
const passport = require("passport");
const { register, login, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { signToken } = require("../utils/jwt");

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ── Email/password ────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id_here") {
    return res.redirect(`${CLIENT_URL}/login?oauthError=google_not_configured`);
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${CLIENT_URL}/login?oauthError=google_failed` }),
  (req, res) => {
    const token = signToken({ id: req.user._id });
    res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`);
  }
);

// ── Microsoft OAuth ───────────────────────────────────────────────────────────
router.get("/microsoft", (req, res, next) => {
  if (!process.env.MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID === "your_microsoft_client_id_here") {
    return res.redirect(`${CLIENT_URL}/login?oauthError=microsoft_not_configured`);
  }
  passport.authenticate("microsoft", { session: false })(req, res, next);
});

router.get("/microsoft/callback",
  passport.authenticate("microsoft", { session: false, failureRedirect: `${CLIENT_URL}/login?oauthError=microsoft_failed` }),
  (req, res) => {
    const token = signToken({ id: req.user._id });
    res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`);
  }
);

module.exports = router;

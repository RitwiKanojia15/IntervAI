const passport = require("passport");
const User = require("../models/User");

// ── Google Strategy (only if credentials are configured) ─────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here") {
  const GoogleStrategy = require("passport-google-oauth20").Strategy;
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  `${process.env.SERVER_URL || "http://localhost:5001"}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"), null);

          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              name:          profile.displayName || email.split("@")[0],
              email,
              password:      null,
              oauthProvider: "google",
              oauthId:       profile.id,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log("✓ Google OAuth strategy registered");
} else {
  console.log("⚠ Google OAuth not configured — add GOOGLE_CLIENT_ID to .env");
}

// ── Microsoft Strategy (only if credentials are configured) ──────────────────
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_ID !== "your_microsoft_client_id_here") {
  const MicrosoftStrategy = require("passport-microsoft").Strategy;
  passport.use(
    new MicrosoftStrategy(
      {
        clientID:     process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL:  `${process.env.SERVER_URL || "http://localhost:5001"}/api/auth/microsoft/callback`,
        scope: ["user.read"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value ||
            profile._json?.mail ||
            profile._json?.userPrincipalName;

          if (!email) return done(new Error("No email from Microsoft"), null);

          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              name:          profile.displayName || email.split("@")[0],
              email,
              password:      null,
              oauthProvider: "microsoft",
              oauthId:       profile.id,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log("✓ Microsoft OAuth strategy registered");
} else {
  console.log("⚠ Microsoft OAuth not configured — add MICROSOFT_CLIENT_ID to .env");
}

passport.serializeUser((user, done) => done(null, user._id.toString()));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;

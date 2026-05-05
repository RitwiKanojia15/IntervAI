const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required.", 401);
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new AppError("Invalid or expired token.", 401);
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) throw new AppError("User no longer exists.", 401);

  req.user = user;
  next();
});

module.exports = { protect };

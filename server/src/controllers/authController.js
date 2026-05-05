const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new AppError("Name, email and password are required.", 400);

  const existing = await User.findOne({ email });
  if (existing) throw new AppError("An account with this email already exists.", 409);

  const user = await User.create({ name, email, password });
  const token = signToken({ id: user._id });

  res.status(201).json({ message: "Account created successfully.", token, user: user.toSafeObject() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email and password are required.", 400);

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signToken({ id: user._id });
  res.status(200).json({ message: "Login successful.", token, user: user.toSafeObject() });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "role", "college", "bio", "github", "linkedin"];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select("-password");
  res.status(200).json({ message: "Profile updated.", user });
});

module.exports = { register, login, getMe, updateProfile };

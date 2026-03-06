const User       = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");


// ================= GET PROFILE =================
// GET /api/users/profile

exports.getProfile = catchAsync(async (req, res) => {
  // req.user is already attached by protect middleware
  // but re-fetch to get latest data and strip password
  const user = await User.findById(req.user._id)
    .select("-password")
    .lean();

  if (!user) throw new AppError("User not found", 404);

  res.json({ success: true, user });
});


// ================= GET SOLVED PROBLEMS =================
// GET /api/users/solved

exports.getSolvedProblems = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("solvedProblems")
    .lean();

  if (!user) throw new AppError("User not found", 404);

  res.json({ success: true, solvedProblems: user.solvedProblems });
});
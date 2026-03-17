const catchAsync = require("../utils/catchAsync");
const User       = require("../models/User");
const Submission = require("../models/Submission");
const Problem    = require("../models/Problem");


// ================= CLEAR SUBMISSION CACHE =================
// POST /api/admin/cache/clear
// Recomputes acceptanceRate on all problems from scratch

exports.clearCache = catchAsync(async (req, res) => {
  // Recompute acceptance rates for every problem in one aggregation
  const stats = await Submission.aggregate([
    {
      $group: {
        _id:      "$problemId",
        total:    { $sum: 1 },
        accepted: {
          $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
        },
      },
    },
  ]);

  const bulkOps = stats.map((s) => ({
    updateOne: {
      filter: { _id: s._id },
      update: {
        $set: {
          totalSubmissions: s.total,
          acceptanceRate:   s.total > 0
            ? Math.round((s.accepted / s.total) * 100)
            : 0,
        },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await Problem.bulkWrite(bulkOps);
  }

  res.json({
    success: true,
    message: `Cache cleared — updated ${bulkOps.length} problem(s)`,
    updated: bulkOps.length,
  });
});


// ================= RECALCULATE LEADERBOARD =================
// POST /api/admin/leaderboard/recalculate
// Rebuilds totalSolved, easySolved, mediumSolved, hardSolved for every user

exports.recalculateLeaderboard = catchAsync(async (req, res) => {
  // Single aggregation: unique (userId, problemId) pairs that are Accepted
  const solved = await Submission.aggregate([
    { $match: { status: "Accepted" } },
    // Unique accepted problem per user
    {
      $group: {
        _id: { userId: "$userId", problemId: "$problemId" },
      },
    },
    // Join problem to get difficulty
    {
      $lookup: {
        from:         "problems",
        localField:   "_id.problemId",
        foreignField: "_id",
        as:           "problem",
      },
    },
    { $unwind: { path: "$problem", preserveNullAndEmpty: true } },
    // Group by user
    {
      $group: {
        _id:          "$_id.userId",
        totalSolved:  { $sum: 1 },
        easySolved:   { $sum: { $cond: [{ $eq: ["$problem.difficulty", "Easy"] },   1, 0] } },
        mediumSolved: { $sum: { $cond: [{ $eq: ["$problem.difficulty", "Medium"] }, 1, 0] } },
        hardSolved:   { $sum: { $cond: [{ $eq: ["$problem.difficulty", "Hard"] },   1, 0] } },
      },
    },
  ]);

  const bulkOps = solved.map((s) => ({
    updateOne: {
      filter: { _id: s._id },
      update: {
        $set: {
          totalSolved:  s.totalSolved,
          easySolved:   s.easySolved,
          mediumSolved: s.mediumSolved,
          hardSolved:   s.hardSolved,
        },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps);
  }

  res.json({
    success: true,
    message: `Leaderboard recalculated for ${bulkOps.length} user(s)`,
    updated: bulkOps.length,
  });
});
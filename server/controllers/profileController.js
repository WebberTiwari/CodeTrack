const Submission = require("../models/Submission");
const User       = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");


// ================= HELPERS =================

// Returns YYYY-MM-DD string offset by `days` from a given date string
const offsetDate = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Calculates current submission streak (consecutive days ending today)
const calcStreak = async (userId) => {
  try {
    const subs = await Submission.find({ status: "Accepted", userId })
      .select("createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (!subs.length) return 0;

    // Unique days with accepted submissions
    const days = [...new Set(
      subs.map((s) => new Date(s.createdAt).toISOString().slice(0, 10))
    )];

    const today = new Date().toISOString().slice(0, 10);
    let streak  = 0;

    for (let i = 0; i < days.length; i++) {
      if (days[i] === offsetDate(today, -i)) streak++;
      else break;
    }

    return streak;
  } catch {
    return 0;
  }
};


// ================= PROFILE STATS =================
// GET /api/profile/stats

exports.getProfileStats = catchAsync(async (req, res) => {
  const userId = req.user._id;

  // 1. Run all heavy queries in parallel
  const [acceptedSubs, user, allUserSolvedCounts, totalUsers, streak] =
    await Promise.all([
      // Accepted submissions for this user with problem difficulty
      Submission.find({ status: "Accepted", userId })
        .populate("problemId", "difficulty")
        .lean(),

      // User's contest + rating data only
      User.findById(userId)
        .select("rating maxRating contestsPlayed contestsWon ratingHistory")
        .lean(),

      // Platform-wide: how many unique problems each user has solved
      Submission.aggregate([
        { $match: { status: "Accepted" } },
        { $group: { _id: { userId: "$userId", problemId: "$problemId" } } },
        { $group: { _id: "$_id.userId", totalSolved: { $sum: 1 } } },
      ]),

      // Total registered users (for rank denominator)
      User.countDocuments(),

      // Streak (runs its own query internally)
      calcStreak(userId),
    ]);

  if (!user) throw new AppError("User not found", 404);

  // 2. Count unique solved problems by difficulty
  const solvedSet = new Set();
  let easy = 0, medium = 0, hard = 0;

  for (const sub of acceptedSubs) {
    if (!sub.problemId) continue;
    const pid = sub.problemId._id.toString();
    if (solvedSet.has(pid)) continue;
    solvedSet.add(pid);

    const diff = sub.problemId.difficulty;
    if      (diff === "Easy")   easy++;
    else if (diff === "Medium") medium++;
    else if (diff === "Hard")   hard++;
  }

  const totalSolved = solvedSet.size;

  // 3. Compute rank — users who solved MORE problems than current user
  const usersAhead = allUserSolvedCounts.filter(
    (u) => u.totalSolved > totalSolved
  ).length;

  const rank = usersAhead + 1; // rank #1 = most solved

  // 4. Respond
  res.json({
    success: true,
    totalSolved,
    easy,
    medium,
    hard,
    rating:        user.rating         ?? 1200,
    maxRating:     user.maxRating      ?? user.rating ?? 1200,
    contests:      user.contestsPlayed ?? 0,
    contestsWon:   user.contestsWon    ?? 0,
    ratingHistory: user.ratingHistory  ?? [],
    rank,
    totalUsers,
    streak,
  });
});


// ================= SOLVED PROBLEMS LIST =================
// GET /api/profile/solved

exports.getSolved = catchAsync(async (req, res) => {
  const acceptedSubs = await Submission.find({
    status: "Accepted",
    userId: req.user._id,
  })
    .populate("problemId", "title slug difficulty")
    .sort({ createdAt: -1 })
    .lean();

  // Deduplicate — keep only the first (most recent) accepted sub per problem
  const seen   = new Set();
  const result = [];

  for (const sub of acceptedSubs) {
    if (!sub.problemId) continue;
    const pid = sub.problemId._id.toString();
    if (seen.has(pid)) continue;
    seen.add(pid);

    result.push({
      problemId:    pid,
      submissionId: sub._id,
      title:        sub.problemId.title,
      slug:         sub.problemId.slug,
      difficulty:   sub.problemId.difficulty,
    });
  }

  res.json({ success: true, solved: result });
});
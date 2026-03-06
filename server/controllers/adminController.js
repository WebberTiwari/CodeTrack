const User       = require("../models/User");
const Problem    = require("../models/Problem");
const Submission = require("../models/Submission");
const TestCase   = require("../models/TestCase");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");


// ================= HELPERS =================

const LANG_LABELS = { 54: "C++", 71: "Python", 62: "Java" };
const langLabel   = (id) => LANG_LABELS[id] || "Code";

const slugify = (title) =>
  title.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");


// ================= DASHBOARD STATS =================
// GET /api/admin/stats

exports.getStats = catchAsync(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalProblems,
    totalSubmissions,
    acceptedSubmissions,
    newUsersToday,
  ] = await Promise.all([
    User.countDocuments(),
    Problem.countDocuments(),
    Submission.countDocuments(),
    Submission.countDocuments({ status: "Accepted" }),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
  ]);

  const acceptanceRate = totalSubmissions > 0
    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
    : 0;

  res.json({
    success: true,
    totalUsers,
    totalProblems,
    totalSubmissions,
    acceptedSubmissions,
    acceptanceRate,
    newUsersToday,
    activeToday:     newUsersToday,
    totalContests:   0,
    activeContests:  0,
    pendingProblems: 0,
  });
});


// ================= ACTIVITY (last 30 days) =================
// GET /api/admin/activity
// Uses aggregation instead of 30 sequential DB calls

exports.getActivity = catchAsync(async (req, res) => {
  const daysBack  = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (daysBack - 1));
  startDate.setHours(0, 0, 0, 0);

  // Single aggregation pipeline — replaces 30 individual countDocuments calls
  const raw = await Submission.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in zeros for days with no submissions
  const countMap = Object.fromEntries(raw.map((r) => [r._id, r.count]));

  const result = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: d.toISOString(), count: countMap[key] || 0 });
  }

  res.json({ success: true, activity: result });
});


// ================= GET ALL USERS =================
// GET /api/admin/users
// Fixed N+1: was doing 1 query per user — now 2 queries total

exports.getUsers = catchAsync(async (req, res) => {
  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  // Single aggregation to get solved counts for ALL users at once
  const solvedCounts = await Submission.aggregate([
    { $match: { status: "Accepted" } },
    { $group: { _id: { userId: "$userId", problemId: "$problemId" } } },
    { $group: { _id: "$_id.userId", totalSolved: { $sum: 1 } } },
  ]);

  const solvedMap = Object.fromEntries(
    solvedCounts.map((s) => [s._id.toString(), s.totalSolved])
  );

  const result = users.map((u) => ({
    ...u,
    totalSolved: solvedMap[u._id.toString()] || 0,
  }));

  res.json({ success: true, users: result });
});


// ================= PROMOTE USER TO ADMIN =================
// PUT /api/admin/users/:id/promote

exports.promoteUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: "admin" },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, user });
});


// ================= BAN USER =================
// PUT /api/admin/users/:id/ban

exports.banUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },  // uses isActive field from updated User model
    { new: true }
  ).select("-password");

  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, user });
});


// ================= GET ALL PROBLEMS (with stats) =================
// GET /api/admin/problems
// Fixed N+1: was doing 2 queries per problem — now 2 queries total

exports.getProblems = catchAsync(async (req, res) => {
  const problems = await Problem.find()
    .sort({ createdAt: -1 })
    .lean();

  // Single aggregation for submission stats across ALL problems
  const submissionStats = await Submission.aggregate([
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

  const statsMap = Object.fromEntries(
    submissionStats.map((s) => [s._id.toString(), s])
  );

  const result = problems.map((p) => {
    const stats          = statsMap[p._id.toString()] || { total: 0, accepted: 0 };
    const acceptanceRate = stats.total > 0
      ? Math.round((stats.accepted / stats.total) * 100)
      : 0;
    return { ...p, totalSubmissions: stats.total, acceptanceRate };
  });

  res.json({ success: true, problems: result });
});


// ================= GET RECENT SUBMISSIONS =================
// GET /api/admin/submissions

exports.getSubmissions = catchAsync(async (req, res) => {
  const limit = Math.min(200, parseInt(req.query.limit || "100"));

  const subs = await Submission.find()
    .populate("userId",    "username name email")
    .populate("problemId", "title slug")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const result = subs.map((s) => ({
    _id:          s._id,
    username:     s.userId?.username || s.userId?.name || "—",
    email:        s.userId?.email    || "—",
    problemTitle: s.problemId?.title || "—",
    problemSlug:  s.problemId?.slug  || "—",
    verdict:      s.status,
    language:     langLabel(s.languageId),
    runtime:      s.runtime,
    createdAt:    s.createdAt,
  }));

  res.json({ success: true, submissions: result });
});


// ================= GET USER SUBMISSIONS =================
// GET /api/admin/users/:id/submissions

exports.getUserSubmissions = catchAsync(async (req, res) => {
  const subs = await Submission.find({ userId: req.params.id })
    .populate("problemId", "title difficulty slug")
    .sort({ createdAt: -1 })
    .lean();

  const mapped = subs.map((s) => ({
    ...s,
    problemTitle: s.problemId?.title,
    difficulty:   s.problemId?.difficulty,
  }));

  res.json({ success: true, submissions: mapped });
});


// ================= GET USER CONTEST HISTORY =================
// GET /api/admin/users/:id/contests

exports.getUserContests = catchAsync(async (req, res) => {
  const { Contest } = require("../models/Contest");

  const contests = await Contest.find({ "participants.userId": req.params.id })
    .select("title startTime endTime problems")
    .lean();

  res.json({ success: true, contests });
});


// ================= GET USER STATS =================
// GET /api/admin/users/:id/stats

exports.getUserStats = catchAsync(async (req, res) => {
  const [user, subs] = await Promise.all([
    User.findById(req.params.id).lean(),
    Submission.find({ userId: req.params.id }).lean(),
  ]);

  if (!user) throw new AppError("User not found", 404);

  const accepted = subs.filter((s) => s.status === "Accepted");

  res.json({
    success:     true,
    totalSubs:   subs.length,
    totalSolved: accepted.length,
    streak:      user.streak      || 0,
    easy:        user.easySolved  || 0,
    medium:      user.mediumSolved || 0,
    hard:        user.hardSolved  || 0,
  });
});


// ================= BULK SINGLE PROBLEM IMPORT =================
// POST /api/admin/problems/bulk-single

exports.bulkSingleImport = catchAsync(async (req, res) => {
  const {
    title, difficulty, description, topics, constraints,
    sample_input_1, sample_output_1,
    sample_input_2, sample_output_2,
    hidden_input_1, hidden_output_1,
    hidden_input_2, hidden_output_2,
    hidden_input_3, hidden_output_3,
    modelSolution,
  } = req.body;

  if (!title || !difficulty || !description) {
    throw new AppError("title, difficulty and description are required", 400);
  }

  const slug = slugify(title);

  const existing = await Problem.findOne({ slug }).lean();
  if (existing) throw new AppError(`Problem with slug "${slug}" already exists`, 409);

  const problem = await Problem.create({
    title, slug, difficulty, description, constraints,
    topics: Array.isArray(topics)
      ? topics
      : (topics ? topics.split(";").map((t) => t.trim()) : []),
    samples: [
      { input: sample_input_1, output: sample_output_1 },
      { input: sample_input_2, output: sample_output_2 },
    ].filter((s) => s.input),
    modelSolution:   modelSolution || "",
    modelLanguageId: 54,
  });

  const hiddenTests = [
    { input: hidden_input_1, output: hidden_output_1 },
    { input: hidden_input_2, output: hidden_output_2 },
    { input: hidden_input_3, output: hidden_output_3 },
  ].filter((t) => t.input);

  if (hiddenTests.length > 0) {
    await TestCase.insertMany(
      hiddenTests.map((tc) => ({
        problemId: problem._id,
        input:     tc.input,
        output:    tc.output,
        isHidden:  true,
      }))
    );
  }

  res.status(201).json({ success: true, message: "Problem created", problem });
});
const Problem        = require("../models/Problem");
const Submission     = require("../models/Submission");
const { Contest }    = require("../models/Contest");
const judgeSubmission = require("../judge/judgeWorker");
const catchAsync     = require("../utils/catchAsync");
const AppError       = require("../utils/AppError");


// ================= HELPERS =================

const paginationMeta = (total, pageNum, limitNum) => ({
  total,
  page:       pageNum,
  limit:      limitNum,
  totalPages: Math.ceil(total / limitNum),
  hasNext:    pageNum < Math.ceil(total / limitNum),
  hasPrev:    pageNum > 1,
});

const parsePage = (query) => {
  const pageNum  = Math.max(1, parseInt(query.page  || "1"));
  const limitNum = Math.min(50, Math.max(1, parseInt(query.limit || "10")));
  const skip     = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, skip };
};


// ================= SUBMIT CODE =================
// POST /api/submissions

exports.submitCode = catchAsync(async (req, res) => {
  const { problemSlug, code, contestId, languageId } = req.body;

  if (!problemSlug || !code || !languageId) {
    throw new AppError("problemSlug, code and languageId are required", 400);
  }

  const problem = await Problem.findOne({ slug: problemSlug }).lean();
  if (!problem) throw new AppError("Problem not found", 404);

  if (contestId) {
    const contest = await Contest.findById(contestId).lean();
    if (!contest) throw new AppError("Contest not found", 404);

    const now = new Date();
    if (now < contest.startTime) throw new AppError("Contest has not started yet", 403);
    if (now > contest.endTime)   throw new AppError("Contest has already ended", 403);
  }

  const submission = await Submission.create({
    userId:            req.user._id,
    problemId:         problem._id,
    contestId:         contestId || null,
    code,
    languageId:        Number(languageId),
    status:            "Queued",
    output:            "",
    runtime:           0,
    fingerprints:      [],
    isPlagiarised:     false,
    similarityScore:   0,
    matchedSubmission: null,
  });

  if (contestId) {
    const io = req.app.get("io");
    io?.to(`contest_${contestId}`).emit("newSubmission", {
      userId:       req.user._id,
      problemId:    problem._id,
      submissionId: submission._id,
      status:       "Queued",
    });
  }

  res.status(200).json({ success: true, submissionId: submission._id });

  judgeSubmission(submission._id, problem._id, code, Number(languageId))
    .catch((err) => console.error("Judge worker error:", err.message));
});


// ================= GET MY SUBMISSIONS (paginated) =================
// GET /api/submissions/me?page=1&limit=10&status=Accepted

exports.getMySubmissions = catchAsync(async (req, res) => {
  const { pageNum, limitNum, skip } = parsePage(req.query);

  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .populate("problemId", "title slug difficulty")
      .select("status languageId runtime createdAt problemId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),

    Submission.countDocuments(filter),
  ]);

  res.json({
    success: true,
    submissions,
    pagination: paginationMeta(total, pageNum, limitNum),
  });
});


// ================= GET MY SUBMISSIONS FOR A PROBLEM (paginated) =================
// GET /api/submissions/problem/:slug/me?page=1&limit=10

exports.getMySubmissionsForProblem = catchAsync(async (req, res) => {
  const { pageNum, limitNum, skip } = parsePage(req.query);

  const problem = await Problem.findOne({ slug: req.params.slug }).lean();
  if (!problem) throw new AppError("Problem not found", 404);

  const filter = { userId: req.user._id, problemId: problem._id };

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .select("status languageId runtime createdAt code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),

    Submission.countDocuments(filter),
  ]);

  res.json({
    success: true,
    submissions,
    pagination: paginationMeta(total, pageNum, limitNum),
  });
});


// ================= GET SUBMISSION BY ID =================
// GET /api/submissions/:id

exports.getSubmission = catchAsync(async (req, res) => {
  const adminRequesting = req.user.role === "admin";

  // ✅ Explicitly select output and testResults (both have select:false)
  let query = Submission.findById(req.params.id)
    .select("+output +testResults")
    .populate("problemId", "title slug difficulty");

  if (adminRequesting) {
    query = query.populate("userId", "name email");
  }

  const submission = await query.lean();
  if (!submission) throw new AppError("Submission not found", 404);

  if (!adminRequesting && submission.userId.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to view this submission", 403);
  }

  res.json({ success: true, submission });
});


// ================= GET USER SUBMISSIONS FOR A PROBLEM =================
// GET /api/submissions/problem/:problemSlug (legacy)

exports.getUserSubmissions = catchAsync(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.problemSlug }).lean();
  if (!problem) throw new AppError("Problem not found", 404);

  const submissions = await Submission.find({
    userId:    req.user._id,
    problemId: problem._id,
  })
    .sort({ createdAt: -1 })
    .select("status languageId runtime createdAt")
    .lean();

  res.json({ success: true, submissions });
});


// ================= CONTEST LEADERBOARD =================
// GET /api/submissions/leaderboard/:contestId

exports.getLeaderboard = catchAsync(async (req, res) => {
  const contest = await Contest.findById(req.params.contestId).lean();
  if (!contest) throw new AppError("Contest not found", 404);

  const submissions = await Submission.find({
    contestId: req.params.contestId,
    status:    "Accepted",
  })
    .populate("userId", "username")
    .sort({ createdAt: 1 })
    .lean();

  const leaderboard = {};

  for (const sub of submissions) {
    if (!sub.userId) continue;
    const uid = sub.userId._id.toString();
    const pid = sub.problemId.toString();

    if (!leaderboard[uid]) {
      leaderboard[uid] = {
        username:       sub.userId.username,
        solvedCount:    0,
        totalPenalty:   0,
        solvedProblems: new Set(),
      };
    }

    if (!leaderboard[uid].solvedProblems.has(pid)) {
      leaderboard[uid].solvedCount += 1;
      const minutes = Math.floor((new Date(sub.createdAt) - new Date(contest.startTime)) / 60_000);
      leaderboard[uid].totalPenalty += Math.max(0, minutes);
      leaderboard[uid].solvedProblems.add(pid);
    }
  }

  const rankedData = Object.values(leaderboard)
    .map(({ solvedProblems, ...rest }) => ({
      ...rest,
      solvedProblems: solvedProblems.size,
    }))
    .sort((a, b) =>
      b.solvedCount !== a.solvedCount
        ? b.solvedCount - a.solvedCount
        : a.totalPenalty - b.totalPenalty
    );

  res.json({ success: true, leaderboard: rankedData });
});
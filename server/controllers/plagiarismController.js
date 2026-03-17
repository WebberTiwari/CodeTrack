// ================================================================
// plagiarismController.js
// Admin endpoints for plagiarism — reuses the existing
// ../plagiarism/contestChecker.js so algorithm stays in one place.
// ================================================================

const mongoose   = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");
const Submission = require("../models/Submission");
const User       = require("../models/User");

const { Contest } = require("../models/Contest");

// Reuse the existing plagiarism checker — no duplicate algorithm
const { runPostContestPlagiarismCheck } = require("../plagiarism/contestChecker");


// ================= RUN PLAGIARISM CHECK =================
// POST /api/admin/contests/:contestId/check-plagiarism

exports.runPlagiarismCheck = catchAsync(async (req, res) => {
  const { contestId } = req.params;

  const contest = await Contest.findById(contestId).lean();
  if (!contest) throw new AppError("Contest not found", 404);

  if (contest.status !== "ended") {
    throw new AppError("Plagiarism check can only be run on ended contests", 400);
  }

  // Delegate to existing checker — runs async, don't await so response is immediate
  runPostContestPlagiarismCheck(contestId)
    .catch((err) => console.error("[PlagCheck] Background error:", err.message));

  res.json({
    success: true,
    message: `Plagiarism check started for "${contest.title}". Refresh the report in a few seconds.`,
  });
});


// ================= GET PLAGIARISM REPORT =================
// GET /api/admin/contests/:contestId/plagiarism-report

exports.getPlagiarismReport = catchAsync(async (req, res) => {
  const { contestId } = req.params;

  const contest = await Contest.findById(contestId).select("title").lean();
  if (!contest) throw new AppError("Contest not found", 404);

  // Find all flagged submissions for this contest
 const flagged = await Submission.find({
  contestId:     new mongoose.Types.ObjectId(contestId),
  isPlagiarised: true,
})
  .select("+code")              // ← ADD THIS
  .populate("userId",            "username name email")
  .populate("problemId",         "title")
  .populate({
    path:     "matchedSubmission",
    select:   "+code",          // ← ADD THIS too for matched submission
    populate: { path: "userId", select: "username name email" },
  })
  .lean();

  // Return 404 if no check has been run yet (no flagged submissions at all)
  // — this is what PlagiarismReview.jsx watches for to show "run check first"
  if (flagged.length === 0) {
    // Check if ANY submissions exist for this contest to distinguish
    // "check not run" from "check ran, nothing found"
    const anyFlagged = await Submission.exists({
      contestId:     new mongoose.Types.ObjectId(contestId),
      isPlagiarised: { $exists: true },
    });

    if (!anyFlagged) {
      return res.status(404).json({
        success: false,
        message: "No plagiarism check has been run for this contest yet.",
      });
    }

    // Check was run but nothing flagged — return empty array (200)
    return res.json({
      success:      true,
      contestTitle: contest.title,
      flagged:      [],
    });
  }

  res.json({
    success:      true,
    contestTitle: contest.title,
    flagged,
  });
});


// ================= CONFIRM PENALTY =================
// POST /api/admin/plagiarism/confirm-penalty

exports.confirmPenalty = catchAsync(async (req, res) => {
  const { sub1Id, sub2Id } = req.body;
  if (!sub1Id || !sub2Id) throw new AppError("sub1Id and sub2Id are required", 400);

  // Zero out scores for both submissions
  await Submission.updateMany(
    { _id: { $in: [sub1Id, sub2Id] } },
    { $set: { currentScore: 0, penaltyConfirmed: true } }
  );

  // Send penalty notification emails — non-blocking
  try {
    const { sendPenaltyEmail } = require("../services/emailService");
    if (sendPenaltyEmail) {
      const subs = await Submission.find({ _id: { $in: [sub1Id, sub2Id] } })
        .populate("userId", "username name email")
        .lean();
      await Promise.allSettled(subs.map((s) => sendPenaltyEmail(s.userId)));
    }
  } catch (_) {
    // Email optional — don't block response if not implemented
  }

  res.json({ success: true, message: "Penalty confirmed — scores set to 0" });
});


// ================= CLEAR FALSE POSITIVE =================
// POST /api/admin/plagiarism/clear-false-positive

exports.clearFalsePositive = catchAsync(async (req, res) => {
  const { sub1Id, sub2Id } = req.body;
  if (!sub1Id || !sub2Id) throw new AppError("sub1Id and sub2Id are required", 400);

  await Submission.updateMany(
    { _id: { $in: [sub1Id, sub2Id] } },
    {
      $set:   { isPlagiarised: false, falsePositive: true },
      $unset: { matchedSubmission: "", similarityScore: "" },
    }
  );

  res.json({ success: true, message: "Marked as false positive — submissions cleared" });
});
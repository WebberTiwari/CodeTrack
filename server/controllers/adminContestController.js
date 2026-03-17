// ================================================================
// adminContestController.js
// Thin admin wrappers around the existing contestController —
// avoids duplicating scheduling, rating, or email logic.
// ================================================================

const { Contest }  = require("../models/Contest");
const catchAsync   = require("../utils/catchAsync");
const AppError     = require("../utils/AppError");

// Reuse existing controller functions so scheduling / emails / ratings
// all fire exactly once through the proven code path
const {
  createContest:  _create,
  updateContest:  _update,
  deleteContest:  _delete,
} = require("./contestController");


// ================= GET ALL CONTESTS (admin view) =================
// GET /api/admin/contests
// Returns ALL contests with participant counts — same data the dashboard needs

exports.getContests = catchAsync(async (req, res) => {
  const contests = await Contest.find()
    .sort({ startTime: -1 })
    .populate({ path: "problems.problemId", select: "title slug difficulty" })
    .lean();

  const now = Date.now();

  const result = contests.map((c) => {
    // Derive live status if not already set
    let status = c.status;
    if (!status || status === "") {
      if      (now < new Date(c.startTime).getTime()) status = "upcoming";
      else if (now < new Date(c.endTime).getTime())   status = "live";
      else                                             status = "ended";
    }

    return {
      ...c,
      status,
      // Normalise participant count — model uses registeredUsers array
      participants: c.registeredUsers?.length ?? c.participants ?? 0,
    };
  });

  res.json({ success: true, contests: result });
});


// ================= GET SINGLE CONTEST (admin view) =================
// GET /api/admin/contests/:id

exports.getContestById = catchAsync(async (req, res) => {
  const contest = await Contest.findById(req.params.id)
    .populate({ path: "problems.problemId", select: "title slug difficulty" })
    .lean();

  if (!contest) throw new AppError("Contest not found", 404);
  res.json({ success: true, contest });
});


// ================= CREATE CONTEST =================
// POST /api/admin/contests
// Delegates to contestController.createContest so scheduling + emails fire

exports.createContest = (req, res, next) => _create(req, res, next);


// ================= UPDATE CONTEST =================
// PUT /api/admin/contests/:id
// Delegates to contestController.updateContest

exports.updateContest = (req, res, next) => _update(req, res, next);


// ================= DELETE CONTEST =================
// DELETE /api/admin/contests/:id
// Delegates to contestController.deleteContest so scheduled jobs are cancelled

exports.deleteContest = (req, res, next) => _delete(req, res, next);
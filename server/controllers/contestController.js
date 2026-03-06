const { Contest }    = require("../models/Contest");
const Submission     = require("../models/Submission");
const User           = require("../models/User");
const catchAsync     = require("../utils/catchAsync");
const AppError       = require("../utils/AppError");
const schedule       = require("../services/emailService");
const { sendPostmortemEmail, sendContestCreatedEmail } = require("../services/emailService");
const { runPostContestPlagiarismCheck } = require("../plagiarism/contestChecker");
const nodeSchedule   = require("node-schedule");


// ================= HELPERS =================

// Update contest status based on current time
const updateContestStatus = async (contest) => {
  const now = new Date();
  let newStatus;
  if      (now < contest.startTime)                             newStatus = "upcoming";
  else if (now >= contest.startTime && now <= contest.endTime)  newStatus = "live";
  else                                                          newStatus = "ended";

  if (contest.status !== newStatus) {
    contest.status = newStatus;
    try { await contest.save(); } catch (err) {
      console.warn("[Contest] Status save failed:", err.message);
    }
  }
};

// Build leaderboard from accepted submissions within contest window
const buildLeaderboard = async (contest) => {
  const problemIds = contest.problems.map((p) => p.problemId?._id || p.problemId);

  const submissions = await Submission.find({
    problemId: { $in: problemIds },
    createdAt: { $gte: contest.startTime, $lte: contest.endTime },
    status:    "Accepted",
  })
    .populate("userId",    "name email username")
    .populate("problemId", "_id title")
    .lean();

  const map = {};

  for (const sub of submissions) {
    const uid = sub.userId?._id?.toString();
    if (!uid) continue;

    if (!map[uid]) {
      map[uid] = {
        userId:         uid,
        user:           sub.userId,
        solved:         0,
        score:          0,
        solvedProblems: new Set(),
        lastAcceptedAt: null,
      };
    }

    const pid = sub.problemId?._id?.toString();
    if (!pid || map[uid].solvedProblems.has(pid)) continue;

    map[uid].solvedProblems.add(pid);
    map[uid].solved += 1;

    const probConfig = contest.problems.find(
      (p) => (p.problemId?._id || p.problemId)?.toString() === pid
    );
    map[uid].score += probConfig?.points ?? 100;

    const solveTime = new Date(sub.createdAt).getTime();
    if (!map[uid].lastAcceptedAt || solveTime < map[uid].lastAcceptedAt) {
      map[uid].lastAcceptedAt = solveTime;
    }
  }

  const contestStart = new Date(contest.startTime).getTime();

  return Object.values(map)
    .map((entry) => ({
      userId:      entry.userId,
      username:    entry.user?.username || entry.user?.name || "User",
      solved:      entry.solved,
      score:       entry.score,
      totalTime:   entry.lastAcceptedAt
        ? `${Math.floor((entry.lastAcceptedAt - contestStart) / 60_000)}m`
        : "—",
      totalTimeMs: entry.lastAcceptedAt || Infinity,
    }))
    .sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs)
    .map(({ totalTimeMs, ...rest }) => rest);
};

// Update user ratings after contest ends
const updateRatingsAfterContest = async (contest, leaderboard) => {
  const n = leaderboard.length;
  if (n === 0) {
    console.log(`[Rating] No participants in "${contest.title}", skipping.`);
    return;
  }

  console.log(`[Rating] Updating ${n} participants — "${contest.title}"`);

  for (let i = 0; i < n; i++) {
    const entry = leaderboard[i];
    const rank  = i + 1;

    const user = await User.findById(entry.userId);
    if (!user) continue;

    const prevRating  = user.rating ?? 1200;
    const percentile  = n > 1 ? (n - rank) / (n - 1) : 1;
    const ratingDelta = Math.round((percentile * 2 - 1) * 60);
    const isFirst     = (user.contestsPlayed ?? 0) === 0;
    const finalDelta  = isFirst ? Math.max(ratingDelta, 0) : ratingDelta;
    const newRating   = Math.max(800, prevRating + finalDelta);

    user.rating         = newRating;
    user.maxRating      = Math.max(user.maxRating ?? 1200, newRating);
    user.contestsPlayed = (user.contestsPlayed ?? 0) + 1;
    if (rank === 1) user.contestsWon = (user.contestsWon ?? 0) + 1;

    user.ratingHistory.push({
      contest:      contest._id,
      rank,
      ratingChange: finalDelta,
      newRating,
      date:         new Date(),
    });

    await user.save();
    console.log(
      `[Rating] ${user.username || user.name} | rank ${rank}/${n} | ` +
      `${prevRating} → ${newRating} (${finalDelta >= 0 ? "+" : ""}${finalDelta})`
    );
  }

  console.log(`[Rating] Done — "${contest.title}"`);
};

// Schedule end-of-contest jobs (plagiarism check + rating update)
const scheduleContestJobs = (contest) => {
  const endDate = new Date(contest.endTime);
  if (endDate <= new Date()) return;

  nodeSchedule.scheduleJob(`plag_${contest._id}`, endDate, async () => {
    console.log(`[Scheduler] Auto plag check: ${contest.title}`);
    await runPostContestPlagiarismCheck(contest._id.toString());
  });

  nodeSchedule.scheduleJob(`ratings_${contest._id}`, endDate, async () => {
    try {
      const c = await Contest.findById(contest._id);
      if (!c || c.ratingCalculated) return;
      const lb = await buildLeaderboard(c);
      await updateRatingsAfterContest(c, lb);
      c.ratingCalculated = true;
      await c.save();
      console.log(`[Scheduler] Auto rating update done: ${contest.title}`);
    } catch (err) {
      console.error("[Scheduler] Auto rating update failed:", err.message);
    }
  });
};

const cancelContestJobs = (contestId) => {
  ["plag", "ratings"].forEach((prefix) => {
    const job = nodeSchedule.scheduledJobs[`${prefix}_${contestId}`];
    if (job) {
      job.cancel();
      console.log(`[Scheduler] ${prefix} job cancelled for ${contestId}`);
    }
  });
};


// ================= GET ALL CONTESTS =================
// GET /api/contests

exports.getAllContests = catchAsync(async (req, res) => {
  const contests = await Contest.find()
    .sort({ startTime: -1 })
    .populate({ path: "problems.problemId", select: "title slug difficulty" })
    .lean();

  // Update status in parallel
  await Promise.all(contests.map(updateContestStatus));

  res.json({ success: true, contests });
});


// ================= GET SINGLE CONTEST =================
// GET /api/contests/:id

exports.getContest = catchAsync(async (req, res) => {
  const contest = await Contest.findById(req.params.id).populate({
    path:   "problems.problemId",
    select: "title slug difficulty description constraints samples topics",
  });

  if (!contest) throw new AppError("Contest not found", 404);
  await updateContestStatus(contest);

  res.json({ success: true, contest });
});


// ================= CREATE CONTEST =================
// POST /api/contests  (admin)

exports.createContest = catchAsync(async (req, res) => {
  const { title, startTime, endTime, problems } = req.body;

  if (!title || !startTime || !endTime) {
    throw new AppError("title, startTime and endTime are required", 400);
  }

  const contest = await Contest.create({
    title,
    startTime,
    endTime,
    problems:         problems || [],
    status:           "upcoming",
    stats:            { submissions: 0, accepted: 0, acceptanceRate: 0 },
    registeredUsers:  [],
    ratingCalculated: false,
  });

  // Schedule background jobs
  scheduleContestJobs(contest);

  // Send creation email — non-blocking
  sendContestCreatedEmail(contest._id)
    .catch((e) => console.warn("[Email] Contest creation email failed:", e.message));

  res.status(201).json({ success: true, message: "Contest created successfully", contest });
});


// ================= UPDATE CONTEST =================
// PUT /api/contests/:id  (admin)

exports.updateContest = catchAsync(async (req, res) => {
  const { title, startTime, endTime, problems } = req.body;

  const contest = await Contest.findByIdAndUpdate(
    req.params.id,
    { title, startTime, endTime, problems: problems || [] },
    { new: true, runValidators: true }
  );

  if (!contest) throw new AppError("Contest not found", 404);
  await updateContestStatus(contest);

  res.json({ success: true, message: "Contest updated successfully", contest });
});


// ================= DELETE CONTEST =================
// DELETE /api/contests/:id  (admin)

exports.deleteContest = catchAsync(async (req, res) => {
  const contest = await Contest.findByIdAndDelete(req.params.id);
  if (!contest) throw new AppError("Contest not found", 404);

  cancelContestJobs(req.params.id);

  res.json({ success: true, message: "Contest deleted successfully" });
});


// ================= REGISTER FOR CONTEST =================
// POST /api/contests/:id/register

exports.registerForContest = catchAsync(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new AppError("Contest not found", 404);

  if (new Date() > new Date(contest.endTime)) {
    throw new AppError("Registration closed — contest has already ended", 400);
  }

  const userId = req.user._id.toString();
  const alreadyRegistered = (contest.registeredUsers || [])
    .some((id) => id.toString() === userId);

  if (alreadyRegistered) throw new AppError("Already registered for this contest", 400);

  contest.registeredUsers = contest.registeredUsers || [];
  contest.registeredUsers.push(userId);
  await contest.save();

  res.json({
    success:          true,
    message:          "Registered successfully",
    participantCount: contest.registeredUsers.length,
  });
});


// ================= IS REGISTERED =================
// GET /api/contests/:id/is-registered

exports.isRegistered = catchAsync(async (req, res) => {
  const contest = await Contest.findById(req.params.id).lean();
  if (!contest) throw new AppError("Contest not found", 404);

  const isRegistered = (contest.registeredUsers || [])
    .some((id) => id.toString() === req.user._id.toString());

  res.json({ success: true, isRegistered });
});


// ================= END CONTEST =================
// POST /api/contests/:id/end  (admin)

exports.endContest = catchAsync(async (req, res) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new AppError("Contest not found", 404);

  if (contest.postmortemEmailSent) {
    return res.json({ success: true, message: "Postmortem already sent" });
  }

  // Update status and compute stats
  contest.status = "ended";

  const submissions = await Submission.find({
    createdAt: { $gte: contest.startTime, $lte: contest.endTime },
  }).lean();

  if (!contest.stats) contest.stats = {};
  contest.participants          = new Set(submissions.map((s) => s.userId?.toString())).size;
  contest.stats.submissions     = submissions.length;
  contest.stats.accepted        = submissions.filter((s) => s.status === "Accepted").length;
  contest.stats.acceptanceRate  = contest.stats.submissions > 0
    ? Math.round((contest.stats.accepted / contest.stats.submissions) * 100)
    : 0;

  await contest.save();

  // Update ratings if not already done
  if (!contest.ratingCalculated) {
    const leaderboard = await buildLeaderboard(contest);
    await updateRatingsAfterContest(contest, leaderboard);
    contest.ratingCalculated = true;
    await contest.save();
  }

  // Run plagiarism check — non-blocking
  runPostContestPlagiarismCheck(contest._id.toString());

  // Send postmortem email
  const emailResult = await sendPostmortemEmail(contest._id);

  res.json({
    success:     true,
    message:     "Contest ended, ratings updated & postmortem sent",
    emailResult,
  });
});


// ================= LEADERBOARD =================
// GET /api/contests/:id/leaderboard

exports.getLeaderboard = catchAsync(async (req, res) => {
  const contest = await Contest.findById(req.params.id).lean();
  if (!contest) throw new AppError("Contest not found", 404);

  const leaderboard = await buildLeaderboard(contest);

  // Emit real-time update for live contests — use app.get("io"), not global.io
  if (req.app.get("io") && contest.status === "live") {
    req.app.get("io")
      .to(`contest_${contest._id}`)
      .emit("leaderboardUpdate", leaderboard);
  }

  res.json({ success: true, leaderboard });
});
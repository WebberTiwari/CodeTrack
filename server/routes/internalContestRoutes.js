// const express = require("express");
// const router  = express.Router();

// const { Contest, ContestLeaderboard } = require("../models/Contest");
// const Submission = require("../models/Submission");
// const User       = require("../models/User");
// const protect    = require("../middleware/authMiddleware");

// // ✅ Added sendContestCreatedEmail to imports
// const { sendPostmortemEmail, sendEmail, sendContestCreatedEmail } = require("../services/emailService");

// const schedule = require("node-schedule");
// const { runPostContestPlagiarismCheck } = require("../plagiarism/contestChecker");

// const adminOnly = (req, res, next) => {
//   if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
//   next();
// };

// const updateContestStatus = async (contest) => {
//   const now = new Date();
//   if      (now < contest.startTime)                            contest.status = "upcoming";
//   else if (now >= contest.startTime && now <= contest.endTime) contest.status = "live";
//   else if (now > contest.endTime)                              contest.status = "ended";
//   try { await contest.save(); }
//   catch (err) { console.warn("updateContestStatus save failed:", err.message); }
// };

// async function buildLeaderboard(contest) {
//   const problemIds = contest.problems.map(p => p.problemId?._id || p.problemId);
//   const submissions = await Submission.find({
//     problemId: { $in: problemIds },
//     createdAt: { $gte: contest.startTime, $lte: contest.endTime },
//     status:    "Accepted",
//   }).populate("userId", "name email username").populate("problemId", "_id title").lean();

//   const map = {};
//   for (const sub of submissions) {
//     const uid = sub.userId?._id?.toString();
//     if (!uid) continue;
//     if (!map[uid]) map[uid] = { userId: uid, user: sub.userId, solved: 0, score: 0, solvedProblems: new Set(), lastAcceptedAt: null };
//     const pid = sub.problemId?._id?.toString();
//     if (!pid || map[uid].solvedProblems.has(pid)) continue;
//     map[uid].solvedProblems.add(pid);
//     map[uid].solved += 1;
//     const probConfig = contest.problems.find(p => (p.problemId?._id || p.problemId)?.toString() === pid);
//     map[uid].score += probConfig?.points ?? 100;
//     const solveTime = new Date(sub.createdAt).getTime();
//     if (!map[uid].lastAcceptedAt || solveTime < map[uid].lastAcceptedAt) map[uid].lastAcceptedAt = solveTime;
//   }
//   const contestStart = new Date(contest.startTime).getTime();
//   return Object.values(map)
//     .map(entry => ({
//       userId: entry.userId, username: entry.user?.username || entry.user?.name || "User",
//       solved: entry.solved, score: entry.score,
//       totalTime: entry.lastAcceptedAt ? `${Math.floor((entry.lastAcceptedAt - contestStart) / 60000)}m` : "—",
//       totalTimeMs: entry.lastAcceptedAt || Infinity,
//     }))
//     .sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs)
//     .map(({ totalTimeMs, ...rest }) => rest);
// }

// async function updateRatingsAfterContest(contest, leaderboard) {
//   try {
//     const n = leaderboard.length;
//     if (n === 0) { console.log(`[Rating] No participants in "${contest.title}", skipping.`); return; }
//     console.log(`[Rating] Updating ${n} participants — "${contest.title}"`);
//     for (let i = 0; i < n; i++) {
//       const entry = leaderboard[i];
//       const rank  = i + 1;
//       const user  = await User.findById(entry.userId);
//       if (!user) continue;
//       const prevRating  = user.rating ?? 1200;
//       const percentile  = n > 1 ? (n - rank) / (n - 1) : 1;
//       const ratingDelta = Math.round((percentile * 2 - 1) * 60);
//       const isFirst     = (user.contestsPlayed ?? 0) === 0;
//       const finalDelta  = isFirst ? Math.max(ratingDelta, 0) : ratingDelta;
//       const newRating   = Math.max(800, prevRating + finalDelta);
//       user.rating         = newRating;
//       user.maxRating      = Math.max(user.maxRating ?? 1200, newRating);
//       user.contestsPlayed = (user.contestsPlayed ?? 0) + 1;
//       if (rank === 1) user.contestsWon = (user.contestsWon ?? 0) + 1;
//       user.ratingHistory.push({ contest: contest._id, rank, ratingChange: finalDelta, newRating, date: new Date() });
//       await user.save();
//       console.log(`[Rating] ${user.username || user.name} | rank ${rank}/${n} | ${prevRating} → ${newRating} (${finalDelta >= 0 ? "+" : ""}${finalDelta})`);
//     }
//     console.log(`[Rating] Done — "${contest.title}"`);
//   } catch (err) { console.error("[Rating] updateRatingsAfterContest failed:", err.message); }
// }

// // GET ALL
// router.get("/", async (req, res) => {
//   try {
//     const contests = await Contest.find()
//       .sort({ startTime: -1 })
//       .populate({ path: "problems.problemId", select: "title slug difficulty" });
//     for (const contest of contests) await updateContestStatus(contest);
//     res.json(contests);
//   } catch (err) { res.status(500).json({ message: "Server Error", error: err.message }); }
// });

// // IS REGISTERED
// router.get("/:id/is-registered", protect, async (req, res) => {
//   try {
//     const contest = await Contest.findById(req.params.id);
//     if (!contest) return res.status(404).json({ msg: "Contest not found" });
//     const isRegistered = (contest.registeredUsers || []).some(id => id.toString() === req.user.id.toString());
//     res.json({ isRegistered });
//   } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
// });

// // REGISTER
// router.post("/:id/register", protect, async (req, res) => {
//   try {
//     const contest = await Contest.findById(req.params.id);
//     if (!contest) return res.status(404).json({ msg: "Contest not found" });
//     if (new Date() > new Date(contest.endTime)) return res.status(400).json({ msg: "Registration closed — contest has already ended" });
//     const userId = req.user.id.toString();
//     if ((contest.registeredUsers || []).some(id => id.toString() === userId)) return res.status(400).json({ msg: "Already registered" });
//     contest.registeredUsers = contest.registeredUsers || [];
//     contest.registeredUsers.push(userId);
//     await contest.save();
//     res.json({ msg: "Registered successfully", participantCount: contest.registeredUsers.length });
//   } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
// });

// // END CONTEST
// router.post("/:id/end", protect, adminOnly, async (req, res) => {
//   try {
//     const contest = await Contest.findById(req.params.id);
//     if (!contest) return res.status(404).json({ message: "Contest not found" });
//     if (contest.postmortemEmailSent) return res.json({ message: "Postmortem already sent" });
//     contest.status = "ended";
//     const submissions = await Submission.find({ createdAt: { $gte: contest.startTime, $lte: contest.endTime } });
//     if (!contest.stats) contest.stats = {};
//     contest.participants      = new Set(submissions.map(s => s.userId?.toString())).size;
//     contest.stats.submissions = submissions.length;
//     contest.stats.accepted    = submissions.filter(s => s.status === "Accepted").length;
//     contest.stats.acceptanceRate = contest.stats.submissions > 0 ? Math.round((contest.stats.accepted / contest.stats.submissions) * 100) : 0;
//     await contest.save();
//     if (!contest.ratingCalculated) {
//       const leaderboard = await buildLeaderboard(contest);
//       await updateRatingsAfterContest(contest, leaderboard);
//       contest.ratingCalculated = true;
//       await contest.save();
//     }
//     runPostContestPlagiarismCheck(contest._id.toString());
//     const emailResult = await sendPostmortemEmail(contest._id);
//     res.json({ message: "Contest ended, ratings updated & postmortem sent", emailResult });
//   } catch (err) { console.error("End contest error:", err); res.status(500).json({ message: "Server Error", error: err.message }); }
// });

// // LEADERBOARD
// router.get("/:id/leaderboard", async (req, res) => {
//   try {
//     const contest = await Contest.findById(req.params.id);
//     if (!contest) return res.status(404).json({ message: "Contest not found" });
//     const leaderboard = await buildLeaderboard(contest);
//     try { if (global.io && contest.status === "live") global.io.to(`contest_${contest._id}`).emit("leaderboardUpdate", leaderboard); }
//     catch (e) { console.warn("Socket emit error:", e.message); }
//     res.json(leaderboard);
//   } catch (err) { res.status(500).json({ message: "Server Error", error: err.message }); }
// });

// // GET SINGLE — must be LAST
// router.get("/:id", async (req, res) => {
//   try {
//    const contest = await Contest.findById(req.params.id).populate({ path: "problems.problemId", select: "title slug difficulty description constraints samples topics" });
//     if (!contest) return res.status(404).json({ message: "Contest not found" });
//     await updateContestStatus(contest);
//     res.json(contest);
//   } catch (err) { res.status(500).json({ message: "Invalid Contest ID", error: err.message }); }
// });

// // CREATE
// router.post("/", protect, adminOnly, async (req, res) => {
//   try {
//     const { title, startTime, endTime, problems } = req.body;
//     if (!title || !startTime || !endTime) return res.status(400).json({ msg: "title, startTime and endTime are required" });
//     const contest = await Contest.create({
//       title, startTime, endTime,
//       problems: problems || [], status: "upcoming",
//       stats: { submissions: 0, accepted: 0, acceptanceRate: 0 },
//       registeredUsers: [], ratingCalculated: false,
//     });

//     const endDate = new Date(contest.endTime);
//     if (endDate > new Date()) {
//       schedule.scheduleJob(`plag_${contest._id}`, endDate, async () => {
//         console.log(`[Scheduler] Auto plag check triggered for: ${contest.title}`);
//         await runPostContestPlagiarismCheck(contest._id.toString());
//       });
//       schedule.scheduleJob(`ratings_${contest._id}`, endDate, async () => {
//         try {
//           const c = await Contest.findById(contest._id);
//           if (!c || c.ratingCalculated) return;
//           const lb = await buildLeaderboard(c);
//           await updateRatingsAfterContest(c, lb);
//           c.ratingCalculated = true;
//           await c.save();
//           console.log(`[Scheduler] Auto rating update done for: ${contest.title}`);
//         } catch (err) { console.error("[Scheduler] Auto rating update failed:", err.message); }
//       });
//     }

//     // ✅ FIX: Beautiful email template instead of plain HTML
//     sendContestCreatedEmail(contest._id)
//       .catch(e => console.warn("Contest creation email failed:", e.message));

//     res.status(201).json({ message: "Contest created successfully", contest });
//   } catch (err) { res.status(500).json({ msg: "Failed to create contest", error: err.message }); }
// });

// // UPDATE
// router.put("/:id", protect, adminOnly, async (req, res) => {
//   try {
//     const { title, startTime, endTime, problems } = req.body;
//     const contest = await Contest.findByIdAndUpdate(req.params.id, { title, startTime, endTime, problems: problems || [] }, { new: true });
//     if (!contest) return res.status(404).json({ msg: "Contest not found" });
//     await updateContestStatus(contest);
//     res.json({ message: "Contest updated successfully", contest });
//   } catch (err) { res.status(500).json({ msg: "Failed to update contest", error: err.message }); }
// });

// // DELETE
// router.delete("/:id", protect, adminOnly, async (req, res) => {
//   try {
//     const contest = await Contest.findByIdAndDelete(req.params.id);
//     if (!contest) return res.status(404).json({ msg: "Contest not found" });
//     ["plag", "ratings"].forEach(prefix => {
//       const job = schedule.scheduledJobs[`${prefix}_${req.params.id}`];
//       if (job) { job.cancel(); console.log(`[Scheduler] ${prefix} job cancelled`); }
//     });
//     res.json({ message: "Contest deleted successfully" });
//   } catch (err) { res.status(500).json({ msg: "Failed to delete contest", error: err.message }); }
// });

// module.exports = router;


const express = require("express");
const router  = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");
const {
  getAllContests,
  getContest,
  createContest,
  updateContest,
  deleteContest,
  registerForContest,
  isRegistered,
  endContest,
  getLeaderboard,
} = require("../controllers/contestController");


// ── Public ───────────────────────────────────────────────────────────────────
router.get("/",                    getAllContests);
router.get("/:id/leaderboard",     getLeaderboard);

// ── Authenticated ────────────────────────────────────────────────────────────
router.get("/:id/is-registered",   protect, isRegistered);
router.post("/:id/register",       protect, registerForContest);

// ── Admin ────────────────────────────────────────────────────────────────────
router.post("/",                   protect, isAdmin, createContest);
router.put("/:id",                 protect, isAdmin, updateContest);
router.delete("/:id",              protect, isAdmin, deleteContest);
router.post("/:id/end",            protect, isAdmin, endContest);

// ── Must be last — catches /:id ──────────────────────────────────────────────
router.get("/:id",                 getContest);


module.exports = router;
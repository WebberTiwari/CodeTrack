// const express    = require("express");
// const router     = express.Router();
// const Submission = require("../models/Submission");
// const User       = require("../models/User");
// const protect    = require("../middleware/authMiddleware");

// // ─── PROFILE STATS ────────────────────────────────────────────────────────────
// router.get("/stats", protect, async (req, res) => {
//   try {
//     const userId = req.user._id;

//     // ── 1. Solved problem counts for THIS user ────────────────────────────────
//     const acceptedSubs = await Submission.find({
//       status: "Accepted",
//       userId,
//     }).populate("problemId", "difficulty");

//     const solvedSet = new Set();
//     let easy = 0, medium = 0, hard = 0;

//     for (const sub of acceptedSubs) {
//       if (!sub.problemId) continue;
//       const pid = sub.problemId._id.toString();
//       if (solvedSet.has(pid)) continue;
//       solvedSet.add(pid);
//       const diff = sub.problemId.difficulty;
//       if      (diff === "Easy")   easy++;
//       else if (diff === "Medium") medium++;
//       else if (diff === "Hard")   hard++;
//     }

//     const totalSolved = solvedSet.size;

//     // ── 2. User document ──────────────────────────────────────────────────────
//     const user = await User.findById(userId).select(
//       "rating maxRating contestsPlayed contestsWon ratingHistory"
//     );
//     if (!user) return res.status(404).json({ error: "User not found" });

//     // ── 3. LeetCode-style rank ────────────────────────────────────────────────
//     // Rank = count of users who solved MORE problems than you + 1
//     // 0 solved → pushed to the bottom (worst rank)
//     // More solved → lower rank number (better rank)
//     // All users who have solved at least 1 problem
//     const allUserSolvedCounts = await Submission.aggregate([
//       { $match: { status: "Accepted" } },
//       { $group: { _id: { userId: "$userId", problemId: "$problemId" } } },
//       { $group: { _id: "$_id.userId", totalSolved: { $sum: 1 } } },
//     ]);

//     // Total registered users on the platform
//     const totalUsers = await User.countDocuments();

//     // Users who solved MORE problems than current user
//     const usersAhead = allUserSolvedCounts.filter(
//       u => u.totalSolved > totalSolved
//     ).length;

//     // Rank out of ALL users (like LeetCode)
//     // 0 solved → rank = totalUsers (last place, e.g. #50000)
//     // More solved → rank number drops toward #1
//     const rank = usersAhead + 1;

//     // ── 4. Streak ─────────────────────────────────────────────────────────────
//     const streak = await calcStreak(userId);

//     // ── 5. Response ───────────────────────────────────────────────────────────
//     res.json({
//       totalSolved,
//       easy,
//       medium,
//       hard,
//       rating:        user.rating         ?? 1200,
//       maxRating:     user.maxRating      ?? user.rating ?? 1200,
//       contests:      user.contestsPlayed ?? 0,
//       contestsWon:   user.contestsWon    ?? 0,
//       ratingHistory: user.ratingHistory  ?? [],
//       rank,
//       totalUsers,  // so frontend can show "#2 / 50,000"
//       streak,
//     });

//   } catch (err) {
//     console.error("PROFILE STATS ERROR:", err);
//     res.status(500).json({ error: "Failed to fetch stats" });
//   }
// });

// // ─── SOLVED PROBLEMS LIST ─────────────────────────────────────────────────────
// router.get("/solved", protect, async (req, res) => {
//   try {
//     const acceptedSubs = await Submission.find({
//       status: "Accepted",
//       userId: req.user._id,
//     })
//       .populate("problemId", "title slug difficulty")
//       .sort({ createdAt: -1 });

//     const seen   = new Set();
//     const result = [];

//     for (const sub of acceptedSubs) {
//       if (!sub.problemId) continue;
//       const pid = sub.problemId._id.toString();
//       if (seen.has(pid)) continue;
//       seen.add(pid);
//       result.push({
//         problemId:    pid,
//         submissionId: sub._id,
//         title:        sub.problemId.title,
//         slug:         sub.problemId.slug,
//         difficulty:   sub.problemId.difficulty,
//       });
//     }

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch solved problems" });
//   }
// });

// // ─── STREAK HELPER ────────────────────────────────────────────────────────────
// async function calcStreak(userId) {
//   try {
//     const subs = await Submission.find({ status: "Accepted", userId })
//       .select("createdAt")
//       .sort({ createdAt: -1 });

//     if (!subs.length) return 0;

//     const days = [...new Set(
//       subs.map(s => s.createdAt.toISOString().slice(0, 10))
//     )];

//     let streak = 0;
//     const today = new Date().toISOString().slice(0, 10);

//     for (let i = 0; i < days.length; i++) {
//       const expected = offsetDate(today, -i);
//       if (days[i] === expected) streak++;
//       else break;
//     }

//     return streak;
//   } catch {
//     return 0;
//   }
// }

// function offsetDate(dateStr, days) {
//   const d = new Date(dateStr);
//   d.setDate(d.getDate() + days);
//   return d.toISOString().slice(0, 10);
// }

// module.exports = router;


const express  = require("express");
const router   = express.Router();

const { protect }                    = require("../middleware/authMiddleware");
const { getProfileStats, getSolved } = require("../controllers/profileController");


// GET /api/profile/stats  → solved counts, rating, rank, streak
router.get("/stats",  protect, getProfileStats);

// GET /api/profile/solved → list of unique solved problems
router.get("/solved", protect, getSolved);


module.exports = router;


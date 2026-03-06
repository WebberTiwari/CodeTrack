// const express = require("express");
// const router  = express.Router();

// const User       = require("../models/User");
// const Problem    = require("../models/Problem");
// const Submission = require("../models/Submission");
// const protect    = require("../middleware/authMiddleware");
// const TestCase   = require("../models/TestCase");  

// // ── Admin guard middleware ────────────────────────────────────────────────────
// const adminOnly = (req, res, next) => {
//   if (req.user.role !== "admin")
//     return res.status(403).json({ msg: "Admin access required" });
//   next();
// };

// // Apply protect + adminOnly to ALL routes in this file
// router.use(protect, adminOnly);

// /* =================================================
//    GET /admin/stats
// ================================================= */
// router.get("/stats", async (req, res) => {
//   try {
//     const [
//       totalUsers,
//       totalProblems,
//       totalSubmissions,
//       acceptedSubmissions,
//     ] = await Promise.all([
//       User.countDocuments(),
//       Problem.countDocuments(),
//       Submission.countDocuments(),
//       Submission.countDocuments({ status: "Accepted" }),
//     ]);

//     // New users registered today
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);
//     const newUsersToday = await User.countDocuments({
//       createdAt: { $gte: todayStart }
//     });

//     const acceptanceRate = totalSubmissions > 0
//       ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
//       : 0;

//     res.json({
//       totalUsers,
//       totalProblems,
//       totalContests:   0,   // wire up when contest model is ready
//       totalSubmissions,
//       newUsersToday,
//       activeContests:  0,
//       pendingProblems: 0,
//       acceptanceRate,
//       activeToday:     newUsersToday,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// /* =================================================
//    GET /admin/users
// ================================================= */
// router.get("/users", async (req, res) => {
//   try {
//     const users = await User.find()
//       .select("-password")
//       .sort({ createdAt: -1 })
//       .lean();

//     // Attach totalSolved count for each user
//     const result = await Promise.all(users.map(async (u) => {
//       const totalSolved = await Submission.distinct("problemId", {
//         userId: u._id,
//         status: "Accepted"
//       }).then(arr => arr.length);
//       return { ...u, totalSolved };
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// /* =================================================
//    PUT /admin/users/:id/promote
// ================================================= */
// router.put("/users/:id/promote", async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { role: "admin" },
//       { new: true }
//     ).select("-password");

//     if (!user) return res.status(404).json({ msg: "User not found" });
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// /* =================================================
//    PUT /admin/users/:id/ban
// ================================================= */
// router.put("/users/:id/ban", async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { status: "banned" },
//       { new: true }
//     ).select("-password");

//     if (!user) return res.status(404).json({ msg: "User not found" });
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// /* =================================================
//    GET /admin/problems
// ================================================= */
// router.get("/problems", async (req, res) => {
//   try {
//     const problems = await Problem.find()
//       .sort({ createdAt: -1 })
//       .lean();

//     // Attach submission stats per problem
//     const result = await Promise.all(problems.map(async (p) => {
//       const totalSubmissions = await Submission.countDocuments({ problemId: p._id });
//       const accepted         = await Submission.countDocuments({ problemId: p._id, status: "Accepted" });
//       const acceptanceRate   = totalSubmissions > 0
//         ? Math.round((accepted / totalSubmissions) * 100)
//         : 0;
//       return { ...p, totalSubmissions, acceptanceRate };
//     }));

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// /* =================================================
//    GET /admin/submissions
// ================================================= */
// router.get("/submissions", async (req, res) => {
//   try {
//     const subs = await Submission.find()
//       .populate("userId",    "username name email")
//       .populate("problemId", "title slug")
//       .sort({ createdAt: -1 })
//       .limit(100)
//       .lean();

//     const result = subs.map(s => ({
//       _id:          s._id,
//       username:     s.userId?.username || s.userId?.name || "—",
//       email:        s.userId?.email    || "—",
//       problemTitle: s.problemId?.title || "—",
//       problemSlug:  s.problemId?.slug  || "—",
//       verdict:      s.status,
//       language:     langLabel(s.languageId),
//       runtime:      s.runtime,
//       createdAt:    s.createdAt,
//     }));

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// /* =================================================
//    GET /admin/activity  (last 30 days submission counts)
// ================================================= */
// router.get("/activity", async (req, res) => {
//   try {
//     const days = 30;
//     const result = [];

//     for (let i = days - 1; i >= 0; i--) {
//       const start = new Date();
//       start.setDate(start.getDate() - i);
//       start.setHours(0, 0, 0, 0);

//       const end = new Date(start);
//       end.setHours(23, 59, 59, 999);

//       const count = await Submission.countDocuments({
//         createdAt: { $gte: start, $lte: end }
//       });

//       result.push({
//         date:  start.toISOString(),
//         count,
//       });
//     }

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// // GET submissions for a specific user
// router.get("/users/:id/submissions", protect, adminOnly, async (req, res) => {
//   try {
//     const subs = await Submission.find({ userId: req.params.id })
//       .populate("problemId", "title difficulty slug")
//       .sort({ createdAt: -1 })
//       .lean();
//     const mapped = subs.map(s => ({
//       ...s,
//       problemTitle: s.problemId?.title,
//       difficulty:   s.problemId?.difficulty,
//     }));
//     res.json(mapped);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// // GET contest participations for a user
// router.get("/users/:id/contests", protect, adminOnly, async (req, res) => {
//   try {
//     const { Contest, ContestLeaderboard } = require("../models/Contest");
//     const contests = await Contest.find({ "participants.userId": req.params.id })
//       .select("title startTime endTime problems")
//       .lean();
//     res.json(contests);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// // GET aggregated stats for a user
// router.get("/users/:id/stats", protect, adminOnly, async (req, res) => {
//   try {
//     const User = require("../models/User");
//     const u    = await User.findById(req.params.id).lean();
//     const subs = await Submission.find({ userId: req.params.id }).lean();
//     const accepted = subs.filter(s => s.status === "Accepted" || s.verdict === "Accepted");
//     res.json({
//       totalSubs:   subs.length,
//       totalSolved: u?.totalSolved || accepted.length,
//       streak:      u?.streak || 0,
//       easy:        u?.easySolved   || 0,
//       medium:      u?.mediumSolved || 0,
//       hard:        u?.hardSolved   || 0,
//     });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// // ── Helper ────────────────────────────────────────────────────────────────────
// function langLabel(id) {
//   if (id === 54) return "C++";
//   if (id === 71) return "Python";
//   if (id === 62) return "Java";
//   return "Code";
// }
// router.post("/problems/bulk-single", async (req, res) => {
//   try {
//     const {
//       title, difficulty, description, topics,
//       constraints,
//       sample_input_1, sample_output_1,
//       sample_input_2, sample_output_2,
//       hidden_input_1, hidden_output_1,
//       hidden_input_2, hidden_output_2,
//       hidden_input_3, hidden_output_3,
//       modelSolution
//     } = req.body;

//     const slug = title.toLowerCase().trim()
//       .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

//     const existing = await Problem.findOne({ slug });
//     if (existing) return res.status(409).json({ error: `"${slug}" already exists` });

//     const problem = await Problem.create({
//       title, slug, difficulty, description, constraints,
//       topics: Array.isArray(topics) ? topics : (topics ? topics.split(";").map(t => t.trim()) : []),
//       samples: [
//         { input: sample_input_1, output: sample_output_1 },
//         { input: sample_input_2, output: sample_output_2 },
//       ].filter(s => s.input),
//       modelSolution: modelSolution || "",
//       modelLanguageId: 54,
//     });

//     const hiddenTests = [
//       { input: hidden_input_1, output: hidden_output_1 },
//       { input: hidden_input_2, output: hidden_output_2 },
//       { input: hidden_input_3, output: hidden_output_3 },
//     ].filter(t => t.input);

//     if (hiddenTests.length > 0) {
//       await TestCase.insertMany(hiddenTests.map(tc => ({
//         problemId: problem._id,
//         input: tc.input,
//         output: tc.output,
//         isHidden: true,
//       })));
//     }

//     res.status(201).json({ message: "Problem created", problem });

//   } catch (err) {
//     console.error("bulk-single error:", err);
//     res.status(500).json({ error: "Failed to create problem" });
//   }
// });

// module.exports = router;


const express = require("express");
const router  = express.Router();

const { protect, isAdmin }   = require("../middleware/authMiddleware");
const {
  getStats,
  getUsers,
  promoteUser,
  banUser,
  getProblems,
  getSubmissions,
  getActivity,
  getUserSubmissions,
  getUserContests,
  getUserStats,
  bulkSingleImport,
} = require("../controllers/adminController");


// Apply protect + isAdmin to ALL routes in this file
router.use(protect, isAdmin);


// ── Dashboard ────────────────────────────────────────────────────────────────
router.get("/stats",      getStats);
router.get("/activity",   getActivity);

// ── Users ────────────────────────────────────────────────────────────────────
router.get("/users",                    getUsers);
router.put("/users/:id/promote",        promoteUser);
router.put("/users/:id/ban",            banUser);
router.get("/users/:id/submissions",    getUserSubmissions);
router.get("/users/:id/contests",       getUserContests);
router.get("/users/:id/stats",          getUserStats);

// ── Problems ─────────────────────────────────────────────────────────────────
router.get("/problems",                 getProblems);
router.post("/problems/bulk-single",    bulkSingleImport);

// ── Submissions ──────────────────────────────────────────────────────────────
router.get("/submissions",              getSubmissions);


module.exports = router;
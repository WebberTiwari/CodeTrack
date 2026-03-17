
// const express = require("express");
// const router  = express.Router();

// const { protect, isAdmin }   = require("../middleware/authMiddleware");
// const {
//   getStats,
//   getUsers,
//   promoteUser,
//   banUser,
//   getProblems,
//   getSubmissions,
//   getActivity,
//   getUserSubmissions,
//   getUserContests,
//   getUserStats,
//   bulkSingleImport,
// } = require("../controllers/adminController");


// // Apply protect + isAdmin to ALL routes in this file
// router.use(protect, isAdmin);


// // ── Dashboard ────────────────────────────────────────────────────────────────
// router.get("/stats",      getStats);
// router.get("/activity",   getActivity);

// // ── Users ────────────────────────────────────────────────────────────────────
// router.get("/users",                    getUsers);
// router.put("/users/:id/promote",        promoteUser);
// router.put("/users/:id/ban",            banUser);
// router.get("/users/:id/submissions",    getUserSubmissions);
// router.get("/users/:id/contests",       getUserContests);
// router.get("/users/:id/stats",          getUserStats);

// // ── Problems ─────────────────────────────────────────────────────────────────
// router.get("/problems",                 getProblems);
// router.post("/problems/bulk-single",    bulkSingleImport);

// // ── Submissions ──────────────────────────────────────────────────────────────
// router.get("/submissions",              getSubmissions);


// module.exports = router;

const express = require("express");
const router  = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");

const {
  getStats,
  getUsers,
  promoteUser,
  banUser,
  unbanUser,
  deleteUser,
  getProblems,
  approveProblem,
  getSubmissions,
  getActivity,
  getUserSubmissions,
  getUserContests,
  getUserStats,
  bulkSingleImport,
} = require("../controllers/adminController");

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const {
  clearCache,
  recalculateLeaderboard,
} = require("../controllers/adminActionsController");

const {
  runPlagiarismCheck,
  getPlagiarismReport,
  confirmPenalty,
  clearFalsePositive,
} = require("../controllers/plagiarismController");

const {
  getContests,
  createContest,
  updateContest,
  deleteContest,
  getContestById,
} = require("../controllers/adminContestController");


// ── Apply protect + isAdmin to ALL routes ────────────────────────────────────
router.use(protect, isAdmin);


// ── Dashboard ────────────────────────────────────────────────────────────────
router.get("/stats",    getStats);
router.get("/activity", getActivity);


// ── Users ────────────────────────────────────────────────────────────────────
router.get("/users",                    getUsers);
router.put("/users/:id/promote",        promoteUser);
router.put("/users/:id/ban",            banUser);
router.put("/users/:id/unban",          unbanUser);
router.delete("/users/:id",             deleteUser);
router.get("/users/:id/submissions",    getUserSubmissions);
router.get("/users/:id/contests",       getUserContests);
router.get("/users/:id/stats",          getUserStats);


// ── Problems ─────────────────────────────────────────────────────────────────
router.get("/problems",                   getProblems);
router.post("/problems/bulk-single",      bulkSingleImport);
router.put("/problems/:id/approve",       approveProblem);


// ── Submissions ───────────────────────────────────────────────────────────────
router.get("/submissions", getSubmissions);


// ── Contests ─────────────────────────────────────────────────────────────────
router.get("/contests",         getContests);
router.get("/contests/:id",     getContestById);
router.post("/contests",        createContest);
router.put("/contests/:id",     updateContest);
router.delete("/contests/:id",  deleteContest);

// ── Plagiarism ────────────────────────────────────────────────────────────────
router.post("/contests/:contestId/check-plagiarism",  runPlagiarismCheck);
router.get("/contests/:contestId/plagiarism-report",  getPlagiarismReport);
router.post("/plagiarism/confirm-penalty",             confirmPenalty);
router.post("/plagiarism/clear-false-positive",        clearFalsePositive);


// ── Settings ─────────────────────────────────────────────────────────────────
router.get("/settings",  getSettings);
router.put("/settings",  updateSettings);


// ── Admin Actions ─────────────────────────────────────────────────────────────
router.post("/cache/clear",               clearCache);
router.post("/leaderboard/recalculate",   recalculateLeaderboard);


module.exports = router;
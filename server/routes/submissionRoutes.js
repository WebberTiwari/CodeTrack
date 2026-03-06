
const express = require("express");
const router  = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");
const {
  submitCode,
  getSubmission,
  getUserSubmissions,
  getMySubmissions,
  getMySubmissionsForProblem,
} = require("../controllers/submissionController");


// POST   /api/submissions              → submit code
router.post("/",                    protect,           submitCode);

// GET    /api/submissions/me           → all my submissions (paginated)
router.get("/me",                   protect,           getMySubmissions);

// GET    /api/submissions/problem/:slug/me  → my submissions for a problem
router.get("/problem/:slug/me",     protect,           getMySubmissionsForProblem);

// GET    /api/submissions/:id          → single submission (owner or admin)
router.get("/:id",                  protect,           getSubmission);


module.exports = router;
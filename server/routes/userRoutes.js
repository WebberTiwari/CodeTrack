const express = require("express");
const router  = express.Router();

const { protect }                    = require("../middleware/authMiddleware");
const { getProfile, getSolvedProblems } = require("../controllers/userController");


// GET /api/users/profile  → logged-in user's profile
router.get("/profile", protect, getProfile);

// GET /api/users/solved   → logged-in user's solved problem IDs
router.get("/solved",  protect, getSolvedProblems);


module.exports = router;
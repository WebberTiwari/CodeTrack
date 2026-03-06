const express = require("express");
const router  = express.Router();

const { protect }                                  = require("../middleware/authMiddleware");
const { registerUser, loginUser, refreshToken, logoutUser } = require("../controllers/authController");


// ================= AUTH ROUTES =================

// POST /api/auth/register  — validation happens inside controller (Zod)
router.post("/register", registerUser);

// POST /api/auth/login     — validation happens inside controller (Zod)
router.post("/login",    loginUser);

// POST /api/auth/refresh   — uses httpOnly refresh token cookie
router.post("/refresh",  refreshToken);

// POST /api/auth/logout    — clears refresh token cookie
router.post("/logout",   protect, logoutUser);


module.exports = router;
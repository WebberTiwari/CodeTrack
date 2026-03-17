const express = require("express");
const router  = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { registerUser, loginUser, refreshToken, logoutUser } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login",    loginUser);
router.post("/refresh",  refreshToken);
router.post("/logout",   logoutUser); // ← removed protect, logout works even with expired token

module.exports = router;
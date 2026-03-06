const jwt      = require("jsonwebtoken");
const User     = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// ================= PROTECT (verify access token) =================

const protect = catchAsync(async (req, res, next) => {
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("No token provided", 401);
  }

  const token = authHeader.split(" ")[1];
  if (!token) throw new AppError("No token provided", 401);

  // 2. Verify token — distinguish expired vs invalid
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Frontend checks `expired: true` to trigger silent refresh
      return res.status(401).json({
        success: false,
        message: "Token expired",
        expired: true,
      });
    }
    throw new AppError("Invalid token", 401);
  }

  // 3. Check token isn't issued in the future (clock skew attack)
  if (decoded.iat > Math.floor(Date.now() / 1000)) {
    throw new AppError("Invalid token", 401);
  }

  // 4. Confirm user still exists — lean() for speed (read-only)
  const user = await User.findById(decoded.id).select("-password").lean();
  if (!user) throw new AppError("User no longer exists", 401);

  // 5. Attach to request — used by downstream controllers
  req.user = user;
  next();
});


// ================= RESTRICT TO ROLES =================
// Usage: router.delete("/", protect, restrictTo("admin"), handler)

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    throw new AppError("You do not have permission to perform this action", 403);
  }
  next();
};


// ================= IS ADMIN (convenience shorthand) =================
// Usage: router.delete("/", protect, isAdmin, handler)

const isAdmin = restrictTo("admin");


// ================= OPTIONAL AUTH =================
// Attaches user if token is present but does NOT block if missing.
// Useful for public routes that show extra data when logged in
// e.g. "has the user bookmarked this problem?"

const optionalAuth = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password").lean();
    if (user) req.user = user;
  } catch {
    // Silently ignore invalid/expired tokens for optional auth
  }

  next();
});


module.exports = { protect, restrictTo, isAdmin, optionalAuth };
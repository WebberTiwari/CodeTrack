const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { z }   = require("zod");

const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");

// ================= VALIDATION SCHEMAS =================

const registerSchema = z.object({
  name:     z.string().trim().min(2,  "Name must be at least 2 characters").max(50, "Name too long"),
  email:    z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string()
    .min(8,  "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const loginSchema = z.object({
  email:    z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ================= TOKEN GENERATORS =================

const generateAccessToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

const generateRefreshToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

// ================= COOKIE OPTIONS =================

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

// ================= SAFE USER PAYLOAD =================

const safeUser = (user) => ({
  _id:      user._id,
  name:     user.name,
  email:    user.email,
  username: user.username,
  bio:      user.bio,
  socials:  user.socials,
  role:     user.role,
});

// ================= REGISTER =================

exports.registerUser = catchAsync(async (req, res, next) => {
  // 1. Validate input
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(", ");
    return next(new AppError(message, 400));
  }

  const { name, email, password } = parsed.data;

  // 2. Check duplicate email
  const userExists = await User.findOne({ email }).lean();
  if (userExists) return next(new AppError("Email is already registered", 409));

  // 3. Generate unique username to avoid duplicate key error
  const username = `${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;

  // 4. Hash password
  const saltRounds     = parseInt(process.env.BCRYPT_ROUNDS || "12");
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 5. Create user — catch MongoDB duplicate key or validation errors
  let user;
  try {
    user = await User.create({
      name,
      email,
      password:  hashedPassword,
      username,
      bio:       "Competitive Programmer",
      socials: {
        codeforces: "",
        codechef:   "",
        leetcode:   "",
        github:     "",
        linkedin:   "",
      },
    });
  } catch (err) {
    // MongoDB duplicate key error (code 11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return next(new AppError(`${field} is already taken`, 409));
    }
    // Mongoose validation error
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((e) => e.message).join(", ");
      return next(new AppError(message, 400));
    }
    return next(new AppError("Could not create account. Please try again.", 500));
  }

  // 6. Issue tokens
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    accessToken,
    user: safeUser(user),
  });
});

// ================= LOGIN =================

exports.loginUser = catchAsync(async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(", ");
    return next(new AppError(message, 400));
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new AppError("Invalid email or password", 401));

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new AppError("Invalid email or password", 401));

  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, user.role);

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  res.json({
    success: true,
    accessToken,
    user: safeUser(user),
  });
});

// ================= REFRESH TOKEN =================

exports.refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) return next(new AppError("No refresh token provided", 401));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return next(new AppError("Invalid or expired refresh token. Please login again.", 403));
  }

  const user = await User.findById(decoded.id).lean();
  if (!user) return next(new AppError("User no longer exists", 401));

  const newAccessToken  = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id, user.role);

  res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

  res.json({
    success:     true,
    accessToken: newAccessToken,
  });
});

// ================= LOGOUT =================

exports.logoutUser = (req, res) => {
  res.clearCookie("refreshToken", COOKIE_OPTIONS);
  res.json({ success: true, message: "Logged out successfully" });
};
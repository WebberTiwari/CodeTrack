const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { z }   = require("zod");

const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");


// ================= VALIDATION SCHEMAS (zod) =================

const registerSchema = z.object({
  name:     z.string().trim().min(2,  "Name must be at least 2 characters").max(50,  "Name too long"),
  email:    z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string()
    .min(8,  "Password must be at least 8 characters")
    .max(72, "Password too long") // bcrypt silently truncates at 72 bytes
    .regex(/[A-Z]/,  "Password must contain at least one uppercase letter")
    .regex(/[0-9]/,  "Password must contain at least one number"),
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
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
};


// ================= SAFE USER PAYLOAD =================
// Single place to define what user data is sent to the client

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

exports.registerUser = catchAsync(async (req, res) => {
  // 1. Validate input
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(", ");
    throw new AppError(message, 400);
  }

  const { name, email, password } = parsed.data;

  // 2. Check duplicate
  const userExists = await User.findOne({ email }).lean();
  if (userExists) throw new AppError("Email is already registered", 409);

  // 3. Hash password — cost factor from env (default 12 for better security)
  const saltRounds    = parseInt(process.env.BCRYPT_ROUNDS || "12");
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 4. Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    username: name,
    bio:      "Competitive Programmer",
    socials: {
      codeforces: "",
      codechef:   "",
      leetcode:   "",
      github:     "",
      linkedin:   "",
    },
  });

  // 5. Issue tokens
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

exports.loginUser = catchAsync(async (req, res) => {
  // 1. Validate input
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(", ");
    throw new AppError(message, 400);
  }

  const { email, password } = parsed.data;

  // 2. Find user — select password explicitly (if schema has select:false)
  const user = await User.findOne({ email }).select("+password");
  // Generic message — don't reveal whether email exists
  if (!user) throw new AppError("Invalid email or password", 401);

  // 3. Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid email or password", 401);

  // 4. Issue tokens
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
// Called automatically by frontend when access token expires

exports.refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError("No refresh token provided", 401);

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid or expired refresh token. Please login again.", 403);
  }

  // Make sure user still exists
  const user = await User.findById(decoded.id).lean();
  if (!user) throw new AppError("User no longer exists", 401);

  // ── Token rotation ──────────────────────────────────────────────────────
  // Issue a NEW refresh token on every refresh (invalidates the old one).
  // This limits the damage window if a refresh token is stolen.
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
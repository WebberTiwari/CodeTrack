const mongoose   = require("mongoose");
const catchAsync = require("../utils/catchAsync");

// ─── Inline Settings schema (self-contained, no separate model file needed) ──
// Uses a singleton document pattern — there is always exactly one settings doc.

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "platform" }, // singleton key

    // General
    siteName:         { type: String, default: "CodeTrack" },
    siteTagline:      { type: String, default: "Master DSA. Dominate Contests." },
    siteUrl:          { type: String, default: "" },
    supportEmail:     { type: String, default: "" },
    maintenanceMode:  { type: Boolean, default: false },
    maintenanceMsg:   { type: String, default: "We're performing scheduled maintenance. Back soon!" },
    registrationOpen: { type: Boolean, default: true },
    maxUsersPerPage:  { type: Number, default: 20 },
    logoEmoji:        { type: String, default: "⚡" },

    // Appearance
    accentColor:      { type: String, default: "#22C55E" },
    showLeaderboard:  { type: Boolean, default: true },
    showAnalytics:    { type: Boolean, default: true },
    darkModeForced:   { type: Boolean, default: true },

    // Judge
    defaultTimeLimit:   { type: Number, default: 1000 },
    defaultMemoryLimit: { type: Number, default: 256 },
    maxTimeLimit:       { type: Number, default: 10000 },
    maxMemoryLimit:     { type: Number, default: 1024 },
    allowedLanguages:   { type: [String], default: ["C++", "Python", "Java", "JavaScript"] },
    judgeUrl:           { type: String, default: "" },
    judgeToken:         { type: String, default: "" },

    // Contests
    maxContestDuration:   { type: Number, default: 480 },
    allowVirtualContests: { type: Boolean, default: true },
    plagiarismThreshold:  { type: Number, default: 80 },
    autoEndContests:      { type: Boolean, default: true },
    contestCooldown:      { type: Number, default: 24 },

    // Email / SMTP
    smtpHost:        { type: String, default: "" },
    smtpPort:        { type: String, default: "587" },
    smtpUser:        { type: String, default: "" },
    smtpPass:        { type: String, default: "" },
    emailFromName:   { type: String, default: "CodeTrack" },
    notifyOnBan:     { type: Boolean, default: true },
    notifyOnPlag:    { type: Boolean, default: true },
    notifyOnContest: { type: Boolean, default: true },

    // Security
    sessionTimeout:     { type: Number, default: 7 },
    maxLoginAttempts:   { type: Number, default: 5 },
    requireEmailVerify: { type: Boolean, default: false },
    twoFactorAdmin:     { type: Boolean, default: false },
    rateLimitPerMin:    { type: Number, default: 60 },
    allowGuestView:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Avoid re-registering model on hot reload
const Settings =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);


// ================= GET SETTINGS =================
// GET /api/admin/settings

exports.getSettings = catchAsync(async (req, res) => {
  // findOneAndUpdate with upsert — creates the doc on first call
  let settings = await Settings.findById("platform").lean();

  if (!settings) {
    settings = await Settings.create({ _id: "platform" });
    settings = settings.toObject();
  }

  // Never expose SMTP password to frontend
  const safe = { ...settings };
  if (safe.smtpPass) safe.smtpPass = "••••••••";
  if (safe.judgeToken) safe.judgeToken = "••••••••";

  res.json({ success: true, ...safe });
});


// ================= UPDATE SETTINGS =================
// PUT /api/admin/settings

exports.updateSettings = catchAsync(async (req, res) => {
  const body = { ...req.body };

  // Don't overwrite real password if frontend sent masked placeholder
  if (body.smtpPass   === "••••••••") delete body.smtpPass;
  if (body.judgeToken === "••••••••") delete body.judgeToken;

  // Strip read-only fields
  delete body._id;
  delete body.__v;
  delete body.createdAt;
  delete body.updatedAt;

  const settings = await Settings.findByIdAndUpdate(
    "platform",
    { $set: body },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  const safe = { ...settings };
  if (safe.smtpPass)   safe.smtpPass   = "••••••••";
  if (safe.judgeToken) safe.judgeToken = "••••••••";

  res.json({ success: true, message: "Settings saved", ...safe });
});
// ================= LOAD ENV FIRST =================
require("dotenv").config();

const express      = require("express");
const cors         = require("cors");
const http         = require("http");
const { Server }   = require("socket.io");
const rateLimit    = require("express-rate-limit");
const helmet       = require("helmet");
const cookieParser = require("cookie-parser");
const compression  = require("compression");
const morgan       = require("morgan");

const connectDB     = require("./config/db");
const startCronJobs = require("./services/cronService");
const emailRoutes   = require("./routes/emails");

const app    = express();
const server = http.createServer(app);


// ================= 1. TRUST PROXY =================
app.set("trust proxy", 1);


// ================= 2. CORS (must be before helmet) =================
app.use(cors({
  origin:         process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


// ================= 3. HELMET =================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));


// ================= 4. COMPRESSION =================
app.use(compression());


// ================= 5. GLOBAL RATE LIMITER =================
const isDev = process.env.NODE_ENV !== "production";

app.use(rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             isDev ? 10_000 : 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many requests, please slow down." },
}));


// ================= 6. BODY PARSERS =================
app.use(express.json());
app.use(cookieParser());


// ================= 7. REQUEST LOGGER =================
if (isDev) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}


// ================= 8. SOCKET.IO SETUP =================
const io = new Server(server, {
  cors: {
    origin:  process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);


// ================= 9. SOCKET EVENTS =================
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("joinContest", (contestId) => {
    socket.join(`contest_${contestId}`);
    console.log(`📥 User joined contest room: contest_${contestId}`);
  });

  socket.on("leaveContest", (contestId) => {
    socket.leave(`contest_${contestId}`);
    console.log(`📤 User left contest room: contest_${contestId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});


// ================= 10. HEALTH CHECK =================
app.get("/", async (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    success:   true,
    message:   "API is running...",
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
    db:        dbStatus,
    memory:    `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  });
});


// ================= 11. IMPORT ROUTES =================
const authRoutes           = require("./routes/authRoutes");
const userRoutes           = require("./routes/userRoutes");
const problemRoutes        = require("./routes/problemRoutes");
const submissionRoutes     = require("./routes/submissionRoutes");
const runRoutes            = require("./routes/runRoutes");
const profileRoutes        = require("./routes/profileRoutes");
const userSubmissionRoutes = require("./routes/userSubmissionRoutes");
const profileUserRoutes    = require("./routes/profileUserRoutes");
const companyRoutes        = require("./routes/companyRoutes");
const internalRoutes       = require("./routes/internalContestRoutes");
const externalRoutes       = require("./routes/externalContestRoutes");
const adminRoutes          = require("./routes/adminRoutes");       // ← handles ALL /api/admin/*
const plagiarismRoutes     = require("./routes/plagiarismRoutes");  // kept for any non-admin plag routes
const paymentRoutes        = require("./routes/paymentRoutes");


// ================= 12. ROUTE-SPECIFIC LIMITERS =================

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             isDev ? 10_000 : 20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
});

const submitLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             isDev ? 10_000 : 5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Slow down — max 5 submissions per minute." },
});

const runLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             isDev ? 10_000 : 15,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many run requests. Please wait." },
});

const paymentLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             isDev ? 10_000 : 20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many payment requests. Please slow down." },
});


// ================= 13. MOUNT ROUTES =================
// ⚠️  /api/admin must come BEFORE /api/contests so that
//     /api/admin/contests/:id is not swallowed by contest routers

app.use("/api/admin",             adminRoutes);          // covers /stats /users /problems
                                                         // /contests /settings /cache /leaderboard
                                                         // /plagiarism check + report + confirm + clear

app.use("/api/contests/external", externalRoutes);
app.use("/api/contests",          internalRoutes);

app.use("/api/auth",              authLimiter, authRoutes);
app.use("/api/users",             userRoutes);

app.use("/api/problems",          problemRoutes);
app.use("/api/run",               runLimiter, runRoutes);

app.use("/api/submissions",       submitLimiter, submissionRoutes);

app.use("/api/profile",           profileRoutes);
app.use("/api/user",              userSubmissionRoutes);
app.use("/api/profile-user",      profileUserRoutes);

app.use("/api/company",           companyRoutes);
app.use("/api/emails",            emailRoutes);
app.use("/api/plagiarism",        plagiarismRoutes);     // kept for backward compat
app.use("/api/ai",                require("./routes/aiRoutes"));
app.use("/api/payment",           paymentLimiter, paymentRoutes);


// ================= 14. 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});


// ================= 15. GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  if (!err.statusCode || err.statusCode >= 500) {
    console.error("[Global Error]", err.message);
  }
  const statusCode = Number(err.statusCode) || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});


// ================= 16. START SERVER =================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`✅  Server started on port ${PORT}`);
    console.log(`📡  API base:         http://localhost:${PORT}/api`);
    console.log(`🛡️   Admin:            http://localhost:${PORT}/api/admin`);
    console.log(`⚙️   Settings:         http://localhost:${PORT}/api/admin/settings`);
    console.log(`🔍  Plagiarism:        http://localhost:${PORT}/api/admin/contests/:id/check-plagiarism`);
    console.log(`🏆  Contests:          http://localhost:${PORT}/api/contests`);
    console.log(`🌐  External:          http://localhost:${PORT}/api/contests/external`);
    console.log(`📧  Email system active`);
    console.log(`⚡  Socket.io enabled for live contests`);
    console.log(`⏰  Cron jobs started`);
    console.log(`🛡️   Helmet + Rate limiting active`);
    console.log(`🗜️   Gzip compression active`);
    console.log(`💳  Payment routes active`);
    console.log(`🌍  ENV: ${process.env.NODE_ENV || "development"}`);

    startCronJobs();
  });
};

startServer();


// ================= 17. GRACEFUL SHUTDOWN =================
const shutdown = (signal) => {
  console.log(`\n[Shutdown] ${signal} received — closing gracefully...`);
  server.close(async () => {
    try {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      console.log("[Shutdown] ✅ Clean exit");
    } catch (e) {
      console.error("[Shutdown] MongoDB close error:", e.message);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[UnhandledRejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[UncaughtException]", err);
  shutdown("uncaughtException");
});
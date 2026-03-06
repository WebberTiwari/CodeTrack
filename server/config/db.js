const mongoose = require("mongoose");

// ── Connection config ────────────────────────────────────────────────────────
const MONGO_OPTIONS = {
  maxPoolSize:     10,   // max simultaneous connections in the pool
  minPoolSize:     2,    // keep at least 2 connections warm
  socketTimeoutMS: 45_000,   // close idle sockets after 45s
  serverSelectionTimeoutMS: 5_000,  // fail fast if mongo is unreachable (5s)
  heartbeatFrequencyMS:    10_000,  // check server health every 10s
  autoIndex: process.env.NODE_ENV !== "production", // never auto-build indexes in prod
};

const MAX_RETRIES    = 5;
const RETRY_DELAY_MS = 3_000;

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (level, msg, meta = "") =>
  console[level](`[DB] [${new Date().toISOString()}] ${msg}`, meta);

// ── Event listeners (set up once, before connecting) ────────────────────────
const attachMongooseEvents = () => {
  mongoose.connection.on("connected", () =>
    log("info", `✅ MongoDB connected → ${mongoose.connection.host}`)
  );

  mongoose.connection.on("disconnected", () =>
    log("warn", "⚠️  MongoDB disconnected — will auto-reconnect…")
  );

  mongoose.connection.on("reconnected", () =>
    log("info", "🔄 MongoDB reconnected")
  );

  mongoose.connection.on("error", (err) =>
    log("error", "MongoDB error:", err.message)
  );

  // Graceful shutdown — close connection when Node process exits
  process.on("SIGINT",  gracefulShutdown("SIGINT"));
  process.on("SIGTERM", gracefulShutdown("SIGTERM"));
};

const gracefulShutdown = (signal) => async () => {
  log("info", `${signal} received — closing MongoDB connection…`);
  await mongoose.connection.close();
  log("info", "MongoDB connection closed. Exiting.");
  process.exit(0);
};

// ── Main connect function (with retry) ───────────────────────────────────────
const connectDB = async (attempt = 1) => {
  if (attempt === 1) attachMongooseEvents();

  try {
    await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
  } catch (err) {
    log("error", `Connection attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);

    if (attempt >= MAX_RETRIES) {
      log("error", "❌ Max retries reached. Shutting down.");
      process.exit(1);
    }

    log("info", `⏳ Retrying in ${RETRY_DELAY_MS / 1000}s…`);
    await sleep(RETRY_DELAY_MS);
    return connectDB(attempt + 1);
  }
};

module.exports = connectDB;
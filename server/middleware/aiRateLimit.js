// middleware/aiRateLimit.js
// ─────────────────────────────────────────────────────────────────────────────
// 5 free AI reviews per user per day.
// Pro users (active subscription) get unlimited reviews.
// Uses DB for persistence so counts survive server restarts.
// Falls back to in-memory if DB write fails.
// ─────────────────────────────────────────────────────────────────────────────

const User = require("../models/User");

const FREE_DAILY_LIMIT = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayString() {
  // "YYYY-MM-DD" in UTC — consistent across timezones
  return new Date().toISOString().split("T")[0];
}

function getMidnight() {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight;
}

function formatTimeLeft(ms) {
  const hours   = Math.floor(ms / 3600000);
  const minutes = Math.ceil((ms % 3600000) / 60000);
  if (hours >= 1) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

// ── In-memory fallback (used if DB update fails) ──────────────────────────────
const memStore = new Map();

function memGet(userId) {
  const today = getTodayString();
  const entry = memStore.get(userId);
  if (!entry || entry.date !== today) return 0;
  return entry.count;
}

function memIncrement(userId) {
  const today = getTodayString();
  const entry = memStore.get(userId);
  if (!entry || entry.date !== today) {
    memStore.set(userId, { date: today, count: 1 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

// ── Main middleware factory ───────────────────────────────────────────────────

function aiRateLimit(options = {}) {
  const { limit = FREE_DAILY_LIMIT } = options;

  return async (req, res, next) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }

      // ── Admins always bypass ────────────────────────────────────────────────
      if (req.user?.role === "admin") {
        req.aiUsage = { limit: "unlimited", used: 0, remaining: "unlimited", isPro: true };
        return next();
      }

      const today    = getTodayString();
      const midnight = getMidnight();

      // ── Fetch fresh user from DB (need aiUsedToday, plan, planExpiry) ───────
      let user;
      try {
        user = await User.findById(userId).select("plan planExpiry aiUsedToday aiLastResetDate role");
      } catch (dbErr) {
        console.error("[aiRateLimit] DB fetch failed, using memory fallback:", dbErr.message);
        user = null;
      }

      // ── Pro plan check ──────────────────────────────────────────────────────
      const isPro = user?.plan === "pro" && user?.planExpiry && user.planExpiry > new Date();
      if (isPro) {
        req.aiUsage = { limit: "unlimited", used: 0, remaining: "unlimited", isPro: true };
        return next();
      }

      // ── Daily reset logic ───────────────────────────────────────────────────
      let currentCount;

      if (user) {
        // Reset counter if it's a new day
        const needsReset = user.aiLastResetDate !== today;

        if (needsReset) {
          try {
            await User.findByIdAndUpdate(userId, {
              aiUsedToday:     0,
              aiLastResetDate: today,
            });
            currentCount = 0;
          } catch (resetErr) {
            console.error("[aiRateLimit] Reset failed:", resetErr.message);
            currentCount = 0;
          }
        } else {
          currentCount = user.aiUsedToday ?? 0;
        }
      } else {
        // DB unavailable — use memory fallback
        currentCount = memGet(userId);
      }

      // ── Enforce limit ───────────────────────────────────────────────────────
      if (currentCount >= limit) {
        const msLeft   = midnight.getTime() - Date.now();
        const timeLeft = formatTimeLeft(msLeft);

        return res.status(429).json({
          success:         false,
          error:           "DAILY_LIMIT_REACHED",
          message:         `You've used all ${limit} free AI reviews for today. Resets in ${timeLeft}.`,
          limit,
          used:            currentCount,
          remaining:       0,
          resetsAt:        midnight.toISOString(),
          upgradeRequired: true,
        });
      }

      // ── Increment ───────────────────────────────────────────────────────────
      let newCount;

      if (user) {
        try {
          const updated = await User.findByIdAndUpdate(
            userId,
            { $inc: { aiUsedToday: 1 }, aiLastResetDate: today },
            { new: true, select: "aiUsedToday" }
          );
          newCount = updated?.aiUsedToday ?? currentCount + 1;
        } catch (incErr) {
          console.error("[aiRateLimit] Increment failed, using memory:", incErr.message);
          newCount = memIncrement(userId);
        }
      } else {
        newCount = memIncrement(userId);
      }

      // ── Attach usage to request + set headers ───────────────────────────────
      req.aiUsage = {
        limit,
        used:      newCount,
        remaining: Math.max(0, limit - newCount),
        resetsAt:  midnight.toISOString(),
        isPro:     false,
      };

      res.set({
        "X-AI-RateLimit-Limit":     limit,
        "X-AI-RateLimit-Used":      newCount,
        "X-AI-RateLimit-Remaining": Math.max(0, limit - newCount),
        "X-AI-RateLimit-Reset":     midnight.toISOString(),
      });

      next();

    } catch (err) {
      // Never block the user due to rate-limit errors
      console.error("[aiRateLimit] Unexpected error, allowing request:", err.message);
      next();
    }
  };
}

module.exports = aiRateLimit;
// const cron       = require("node-cron");
// const { Contest, ContestLeaderboard } = require("../models/Contest");
// const Submission = require("../models/Submission");
// const User       = require("../models/User");

// // ✅ FIX: import sendReminderEmail for beautiful reminder emails
// const { sendEmail, sendPostmortemEmail, sendReminderEmail } = require("./emailService");
// const { runPostContestPlagiarismCheck } = require("../plagiarism/contestChecker");

// // ═══════════════════════════════════════════════════════════════
// //  LEADERBOARD BUILDER
// // ═══════════════════════════════════════════════════════════════
// async function buildLeaderboard(contest) {
//   const problemIds = contest.problems.map(p => p.problemId?._id || p.problemId);

//   const submissions = await Submission.find({
//     problemId: { $in: problemIds },
//     createdAt: { $gte: contest.startTime, $lte: contest.endTime },
//     status:    "Accepted",
//   })
//     .populate("userId",    "name email username")
//     .populate("problemId", "_id title")
//     .lean();

//   const map = {};
//   for (const sub of submissions) {
//     const uid = sub.userId?._id?.toString();
//     if (!uid) continue;
//     if (!map[uid]) {
//       map[uid] = {
//         userId: uid, user: sub.userId,
//         solved: 0, score: 0,
//         solvedProblems: new Set(), lastAcceptedAt: null,
//       };
//     }
//     const pid = sub.problemId?._id?.toString();
//     if (!pid || map[uid].solvedProblems.has(pid)) continue;
//     map[uid].solvedProblems.add(pid);
//     map[uid].solved += 1;
//     const probConfig = contest.problems.find(
//       p => (p.problemId?._id || p.problemId)?.toString() === pid
//     );
//     map[uid].score += probConfig?.points ?? 100;
//     const solveTime = new Date(sub.createdAt).getTime();
//     if (!map[uid].lastAcceptedAt || solveTime < map[uid].lastAcceptedAt) {
//       map[uid].lastAcceptedAt = solveTime;
//     }
//   }

//   const contestStart = new Date(contest.startTime).getTime();
//   return Object.values(map)
//     .map(entry => ({
//       userId:      entry.userId,
//       username:    entry.user?.username || entry.user?.name || "User",
//       solved:      entry.solved,
//       score:       entry.score,
//       totalTime:   entry.lastAcceptedAt
//         ? `${Math.floor((entry.lastAcceptedAt - contestStart) / 60000)}m`
//         : "—",
//       totalTimeMs: entry.lastAcceptedAt || Infinity,
//     }))
//     .sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs)
//     .map(({ totalTimeMs, ...rest }) => rest);
// }

// // ═══════════════════════════════════════════════════════════════
// //  RATING ENGINE
// // ═══════════════════════════════════════════════════════════════
// async function updateRatingsAfterContest(contest, leaderboard) {
//   try {
//     const n = leaderboard.length;
//     if (n === 0) {
//       console.log(`[Rating] No participants in "${contest.title}", skipping.`);
//       return;
//     }

//     console.log(`[Rating] Updating ${n} participants — "${contest.title}"`);

//     for (let i = 0; i < n; i++) {
//       const entry = leaderboard[i];
//       const rank  = i + 1;
//       const user  = await User.findById(entry.userId);
//       if (!user) continue;

//       const prevRating  = user.rating ?? 1200;
//       const percentile  = n > 1 ? (n - rank) / (n - 1) : 1;
//       const ratingDelta = Math.round((percentile * 2 - 1) * 60);
//       const isFirst     = (user.contestsPlayed ?? 0) === 0;
//       const finalDelta  = isFirst ? Math.max(ratingDelta, 0) : ratingDelta;
//       const newRating   = Math.max(800, prevRating + finalDelta);

//       user.rating         = newRating;
//       user.maxRating      = Math.max(user.maxRating ?? 1200, newRating);
//       user.contestsPlayed = (user.contestsPlayed ?? 0) + 1;
//       if (rank === 1) user.contestsWon = (user.contestsWon ?? 0) + 1;

//       user.ratingHistory.push({
//         contest:      contest._id,
//         rank,
//         ratingChange: finalDelta,
//         newRating,
//         date:         new Date(),
//       });

//       await user.save();
//       console.log(
//         `[Rating] ${user.username || user.name} | rank ${rank}/${n} | ` +
//         `${prevRating} → ${newRating} (${finalDelta >= 0 ? "+" : ""}${finalDelta})`
//       );
//     }

//     console.log(`[Rating] Done — "${contest.title}"`);
//   } catch (err) {
//     console.error("[Rating] updateRatingsAfterContest failed:", err.message);
//   }
// }

// // ═══════════════════════════════════════════════════════════════
// //  CRON JOBS
// // ═══════════════════════════════════════════════════════════════
// function startCronJobs() {
//   console.log("⏰ Cron job started");

//   cron.schedule("*/5 * * * *", async () => {
//     try {
//       const now = new Date();
//       console.log("🔍 Checking contests:", now);

//       // ── REMINDER EMAIL ──────────────────────────────────────
//       const upcomingContests = await Contest.find({
//         status:            "upcoming",
//         reminderEmailSent: false,
//       });

//       for (const contest of upcomingContests) {
//         const diff    = contest.startTime - now;
//         const minutes = diff / (1000 * 60);

//         if (minutes <= 60 && minutes > 0) {
//           // ✅ FIX: use beautiful reminder email template
//           await sendReminderEmail(contest);
//           contest.reminderEmailSent   = true;
//           contest.reminderEmailSentAt = new Date();
//           await contest.save();
//           console.log("⏰ Reminder sent:", contest.title);
//         }
//       }

//       // ── AUTO END CONTEST ────────────────────────────────────
//       const contestsToEnd = await Contest.find({
//         endTime:             { $lte: now },
//         postmortemEmailSent: false,
//       });

//       console.log("📊 Contests ready to end:", contestsToEnd.length);

//       for (const contest of contestsToEnd) {
//         contest.status = "ended";

//         const submissions = await Submission.find({
//           createdAt: { $gte: contest.startTime, $lte: contest.endTime },
//         });

//         contest.participants      = new Set(submissions.map(s => s.userId?.toString())).size;
//         contest.stats.submissions = submissions.length;
//         contest.stats.accepted    = submissions.filter(s => s.status === "Accepted").length;
//         contest.stats.acceptanceRate = contest.stats.submissions > 0
//           ? Math.round((contest.stats.accepted / contest.stats.submissions) * 100)
//           : 0;

//         await contest.save();

//         // Update ratings
//         if (!contest.ratingCalculated) {
//           const leaderboard = await buildLeaderboard(contest);
//           await updateRatingsAfterContest(contest, leaderboard);
//           contest.ratingCalculated = true;
//           await contest.save();
//           console.log(`[Cron] Ratings updated for: ${contest.title}`);
//         } else {
//           console.log(`[Cron] Ratings already calculated for: ${contest.title}, skipping.`);
//         }

//         // Plagiarism check
//         runPostContestPlagiarismCheck(contest._id.toString());

//         // ✅ Postmortem email (already uses beautiful template)
//         await sendPostmortemEmail(contest._id);

//         console.log("📊 Contest auto-ended:", contest.title);
//       }

//     } catch (err) {
//       console.error("❌ Cron job error:", err);
//     }
//   });
// }

// module.exports = startCronJobs;


const cron       = require("node-cron");
const { Contest } = require("../models/Contest");
const Submission  = require("../models/Submission");

const { sendPostmortemEmail, sendReminderEmail } = require("./emailService");
const { runPostContestPlagiarismCheck }          = require("../plagiarism/contestChecker");

// ── Import shared helpers from contestController ─────────────────────────────
// Single source of truth — no duplicated leaderboard/rating logic
const {
  buildLeaderboard,
  updateRatingsAfterContest,
} = require("../controllers/contestController");


// ═══════════════════════════════════════════════════════════════
//  REMINDER EMAILS  (1 hour before contest starts)
// ═══════════════════════════════════════════════════════════════

async function processReminders(now) {
  const upcomingContests = await Contest.find({
    status:            "upcoming",
    reminderEmailSent: false,
  }).lean();

  for (const contest of upcomingContests) {
    try {
      const minutesUntilStart = (contest.startTime - now) / (1000 * 60);

      if (minutesUntilStart <= 60 && minutesUntilStart > 0) {
        await sendReminderEmail(contest);

        await Contest.findByIdAndUpdate(contest._id, {
          reminderEmailSent:   true,
          reminderEmailSentAt: new Date(),
        });

        console.log(`[Cron] ⏰ Reminder sent: "${contest.title}"`);
      }
    } catch (err) {
      // Isolate — one failure doesn't block other reminders
      console.error(`[Cron] Reminder failed for "${contest.title}":`, err.message);
    }
  }
}


// ═══════════════════════════════════════════════════════════════
//  AUTO-END CONTESTS
// ═══════════════════════════════════════════════════════════════

async function processEndedContests(now) {
  const contestsToEnd = await Contest.find({
    endTime:             { $lte: now },
    postmortemEmailSent: false,
  });

  if (contestsToEnd.length > 0) {
    console.log(`[Cron] 📊 Contests ready to end: ${contestsToEnd.length}`);
  }

  for (const contest of contestsToEnd) {
    try {
      await endSingleContest(contest);
    } catch (err) {
      // Isolate — one contest failure doesn't block others
      console.error(`[Cron] Failed to end "${contest.title}":`, err.message);
    }
  }
}

async function endSingleContest(contest) {
  console.log(`[Cron] Ending contest: "${contest.title}"`);

  // 1. Compute stats using aggregation — no need to load all submissions into memory
  const [statsResult] = await Submission.aggregate([
    {
      $match: {
        createdAt: { $gte: contest.startTime, $lte: contest.endTime },
      },
    },
    {
      $group: {
        _id:           null,
        total:         { $sum: 1 },
        accepted:      { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] } },
        uniqueUsers:   { $addToSet: "$userId" },
      },
    },
  ]);

  const total        = statsResult?.total        ?? 0;
  const accepted     = statsResult?.accepted     ?? 0;
  const participants = statsResult?.uniqueUsers?.length ?? 0;

  // 2. Persist updated contest state
  contest.status       = "ended";
  contest.participants = participants;
  if (!contest.stats) contest.stats = {};
  contest.stats.submissions    = total;
  contest.stats.accepted       = accepted;
  contest.stats.acceptanceRate = total > 0
    ? Math.round((accepted / total) * 100)
    : 0;

  await contest.save();

  // 3. Update ratings (skip if already done — e.g. manual /end was called first)
  if (!contest.ratingCalculated) {
    const leaderboard = await buildLeaderboard(contest);
    await updateRatingsAfterContest(contest, leaderboard);
    contest.ratingCalculated = true;
    await contest.save();
    console.log(`[Cron] ✅ Ratings updated: "${contest.title}"`);
  } else {
    console.log(`[Cron] ⏭️  Ratings already done: "${contest.title}"`);
  }

  // 4. Plagiarism check — fire and forget (non-blocking)
  runPostContestPlagiarismCheck(contest._id.toString())
    .catch((err) => console.error("[Cron] Plagiarism check failed:", err.message));

  // 5. Send postmortem email
  await sendPostmortemEmail(contest._id);

  console.log(`[Cron] 🏁 Contest fully ended: "${contest.title}"`);
}


// ═══════════════════════════════════════════════════════════════
//  MAIN CRON — runs every 5 minutes
// ═══════════════════════════════════════════════════════════════

function startCronJobs() {
  console.log("⏰ Cron jobs registered");

  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    console.log(`[Cron] 🔍 Tick: ${now.toISOString()}`);

    try {
      await processReminders(now);
    } catch (err) {
      console.error("[Cron] processReminders crashed:", err.message);
    }

    try {
      await processEndedContests(now);
    } catch (err) {
      console.error("[Cron] processEndedContests crashed:", err.message);
    }
  });
}

module.exports = startCronJobs;
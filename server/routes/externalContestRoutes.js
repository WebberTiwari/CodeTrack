const express    = require("express");
const router     = express.Router();
const axios      = require("axios");
const catchAsync = require("../utils/catchAsync");


// ================= IN-MEMORY CACHE =================
// External APIs are slow and rate-limited — cache for 10 minutes
// so 100 users hitting this page don't trigger 300 external API calls

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache = { data: null, cachedAt: null };

const isCacheValid = () =>
  cache.data && cache.cachedAt && Date.now() - cache.cachedAt < CACHE_TTL_MS;


// ================= AXIOS INSTANCE =================
// Shared config — 5s timeout prevents slow external APIs from hanging your server

const http = axios.create({ timeout: 5000 });


// ================= PLATFORM FETCHERS =================

async function getCodeforces() {
  try {
    const res = await http.get("https://codeforces.com/api/contest.list");
    return res.data.result
      .filter((c) => c.phase === "BEFORE")
      .slice(0, 5)
      .map((c) => ({
        platform:  "Codeforces",
        name:      c.name,
        startTime: c.startTimeSeconds * 1000,
        duration:  c.durationSeconds,
        url:       `https://codeforces.com/contests/${c.id}`,
      }));
  } catch (err) {
    console.warn("[External] Codeforces fetch failed:", err.message);
    return [];
  }
}

async function getCodechef() {
  try {
    const res = await http.get("https://www.codechef.com/api/list/contests/all");
    return (res.data.future_contests || []).slice(0, 5).map((c) => ({
      platform:  "CodeChef",
      name:      c.contest_name,
      startTime: new Date(c.contest_start_date).getTime(),
      duration:  7200,
      url:       `https://www.codechef.com/${c.contest_code}`,
    }));
  } catch (err) {
    console.warn("[External] CodeChef fetch failed:", err.message);
    return [];
  }
}

async function getLeetcode() {
  try {
    const res = await http.post("https://leetcode.com/graphql", {
      query: `query {
        allContests {
          title
          titleSlug
          startTime
          duration
        }
      }`,
    });

    const now = Date.now() / 1000;
    return (res.data?.data?.allContests || [])
      .filter((c) => c.startTime > now)
      .slice(0, 5)
      .map((c) => ({
        platform:  "LeetCode",
        name:      c.title,
        startTime: c.startTime * 1000,
        duration:  c.duration,
        url:       `https://leetcode.com/contest/${c.titleSlug}`,
      }));
  } catch (err) {
    console.warn("[External] LeetCode fetch failed:", err.message);
    return [];
  }
}


// ================= GET EXTERNAL CONTESTS =================
// GET /api/contests/external

router.get("/", catchAsync(async (req, res) => {
  // Serve from cache if still fresh
  if (isCacheValid()) {
    return res.json({ success: true, fromCache: true, contests: cache.data });
  }

  // Fetch all 3 platforms in parallel — individual failures return []
  const [cf, cc, lc] = await Promise.all([
    getCodeforces(),
    getCodechef(),
    getLeetcode(),
  ]);

  const contests = [...cf, ...cc, ...lc]
    .sort((a, b) => a.startTime - b.startTime); // sort by soonest first

  // Update cache
  cache = { data: contests, cachedAt: Date.now() };

  res.json({ success: true, fromCache: false, contests });
}));


module.exports = router;
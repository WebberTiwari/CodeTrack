// controllers/aiReviewController.js

const Groq       = require("groq-sdk");
const User       = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const LANG_NAMES = { 54:"C++", 71:"Python", 62:"Java", 63:"JavaScript" };

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior competitive programming coach doing a real code review.

CONTENT RULES — never break these:
1. Only comment on what is ACTUALLY in the submitted code. Never invent issues.
2. If code does NOT use "bits/stdc++.h" — do NOT mention it.
3. If code does NOT use "using namespace std" — do NOT mention it.
4. Every point MUST reference actual lines or constructs from the code.
5. If the code is clean, say so. Do not fabricate improvements.

FORMATTING RULES — follow exactly, no exceptions:
1. Every section starts with its ## heading line.
2. Use ONLY these list markers: "-" for regular bullets, "❌" for bugs, "•" for improvements.
3. For Before/After: ALWAYS put the code on the SAME line after the label, as an inline code snippet using backticks.
   CORRECT:   **Before:** \`cin >> a\`
   CORRECT:   **After:** \`cin >> a >> b\`
   WRONG:     **Before:** followed by a code block on the next line.
4. NEVER use triple-backtick fenced code blocks (no \`\`\`cpp blocks anywhere).
5. All code references must be inline backticks only: \`like this\`.
6. No asterisk bullet points (*). Only use "-" or "•" or "❌".
7. Do not add extra blank lines inside a bullet item.`;


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/review
// ─────────────────────────────────────────────────────────────────────────────
exports.reviewCode = catchAsync(async (req, res) => {
  const { code, languageId, problemTitle, problemDescription, verdict, testResults } = req.body;

  if (!code || !languageId)
    throw new AppError("code and languageId are required", 400);

  if (!process.env.GROQ_API_KEY)
    throw new AppError("AI review is not configured", 503);

  const langName   = LANG_NAMES[Number(languageId)] || `Language ${languageId}`;
  const hasVerdict = verdict && verdict !== "idle";
  const isAccepted = verdict === "Accepted";

  // ─── Failed test cases ─────────────────────────────────────────────────────
  const failedTests = (testResults || []).filter(t => !t.passed).slice(0, 3);
  const failedCtx   = failedTests.length
    ? `\nFailed Test Cases:\n${failedTests.map((t, i) =>
        `  [${i + 1}] Input: ${t.input} | Expected: ${t.expected} | Got: ${t.got}`
      ).join("\n")}`
    : "";

  const verdictCtx = hasVerdict
    ? `Verdict: ${verdict}${isAccepted ? " ✅" : " ❌"}`
    : "Verdict: Not submitted yet";

  // ─── User prompt ───────────────────────────────────────────────────────────
  const userPrompt = `Read this code carefully. Every review point must reference something actually in this code.

===== SUBMITTED CODE (${langName}) =====
${code}
===== END OF CODE =====

Problem: ${problemTitle || "Unknown"}
${problemDescription ? `Description: ${problemDescription}\n` : ""}${verdictCtx}${failedCtx}

Write the review in these exact 5 sections. Follow the formatting rules strictly.

## ⏱️ Complexity Analysis
- Time: O(?) — reference actual loops or recursion in the code.
- Space: O(?) — reference actual data structures in the code.
- Optimal: Yes/No — one sentence.

## 🐛 Bugs & Edge Cases${!isAccepted && hasVerdict ? ` — root cause of "${verdict}"` : ""}
For each real bug:
❌ [describe the specific line or construct] — why it fails.
If no bugs: ✅ No bugs found.
${failedTests.length ? "Trace the failed test cases step by step." : ""}

## ✨ Code Quality & Improvements
Only list improvements for things ACTUALLY in this code. For each:
• **What:** [short label]
  **Why:** [one sentence referencing the actual code]
  **Before:** [paste the exact line from submitted code as inline code]
  **After:** [improved version as inline code]
If code quality is already good, write: Code quality is good — no changes needed.

## 💡 Algorithm & Approach
- Is the algorithm in this code optimal for the problem?
- If not: name the better approach and the complexity improvement (e.g. O(n²) → O(n log n)).
- If yes: confirm and explain why alternatives would be worse.

## 🏆 Overall Verdict
2-3 sentences only. Start with one specific thing done well in this code. State the single most important fix. End with brief encouragement.`;

  // ─── API call ──────────────────────────────────────────────────────────────
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.15,
    max_tokens: 1500,
    top_p: 0.8,
  });

  let review = completion.choices[0]?.message?.content;

  if (!review)
    throw new AppError("Failed to generate review", 500);

  // ─── Post-process: strip any stray fenced code blocks ─────────────────────
  review = review.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, inner) => {
    const cleaned = inner.trim().replace(/\n/g, " ");
    return `\`${cleaned}\``;
  });

  // ─── Include usage info from aiRateLimit middleware ────────────────────────
  const usage = req.aiUsage || null;

  res.json({
    success: true,
    review,
    ...(usage && { usage }),
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/quota
// Returns current daily AI usage without incrementing
// ─────────────────────────────────────────────────────────────────────────────
exports.getQuota = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const user = await User.findById(userId).select("plan planExpiry aiUsedToday aiLastResetDate role");
  if (!user) throw new AppError("User not found", 404);

  // Admins — unlimited
  if (user.role === "admin") {
    return res.json({ success: true, limit: "unlimited", used: 0, remaining: "unlimited", isPro: true });
  }

  // Pro check
  const isPro = user.plan === "pro" && user.planExpiry && user.planExpiry > new Date();
  if (isPro) {
    return res.json({ success: true, limit: "unlimited", used: 0, remaining: "unlimited", isPro: true, planExpiry: user.planExpiry });
  }

  const today = new Date().toISOString().split("T")[0];
  const used  = user.aiLastResetDate === today ? (user.aiUsedToday ?? 0) : 0;

  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  res.json({
    success:   true,
    limit:     5,
    used,
    remaining: Math.max(0, 5 - used),
    resetsAt:  midnight.toISOString(),
    isPro:     false,
  });
});
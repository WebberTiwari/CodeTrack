// const express  = require("express");
// const router   = express.Router();
// const Problem  = require("../models/Problem");
// const TestCase = require("../models/TestCase");
// const { createSubmission, getResult } = require("../services/judge0Service");

// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// const clean = (str) => (str || "").trim();

// // judge0Service now handles all base64 encode/decode
// // run.js just works with plain strings
// async function runOnJudge0(code, input, languageId) {
//   let token;
//   try {
//     token = await createSubmission(code, input + "\n", languageId);
//   } catch (err) {
//     const msg = err?.response?.data?.message || err.message;
//     console.error("[Judge0] Submit failed:", msg);
//     return { output: "", error: String(msg), statusId: -1, errorType: "Server Error" };
//   }

//   let result, attempts = 0;
//   while (attempts < 20) {
//     await sleep(1200);
//     result = await getResult(token);

//     if (!result?.status) {
//       console.error("[Judge0] No status in result:", result);
//       attempts++;
//       continue;
//     }

//     console.log(`[Judge0] Poll ${attempts + 1}: status ${result.status.id} — ${result.status.description}`);
//     if (result.status.id >= 3) break;
//     attempts++;
//   }

//   if (!result?.status || result.status.id < 3)
//     return { output: "", error: "Judge Timeout", statusId: -1, errorType: "Judge Timeout" };

//   // ── Success ───────────────────────────────────────────────────────────────
//   if (result.status.id === 3)
//     return { output: clean(result.stdout), error: null, statusId: 3 };

//   // ── Compilation Error ─────────────────────────────────────────────────────
//   if (result.status.id === 6) {
//     const msg = clean(result.compile_output) || clean(result.message) || "Compilation failed";
//     console.error("[Judge0] Compilation Error:\n", msg);
//     return { output: "", error: msg, statusId: 6, errorType: "Compilation Error" };
//   }

//   // ── TLE ───────────────────────────────────────────────────────────────────
//   if (result.status.id === 5)
//     return { output: "", error: "Your code exceeded the time limit.", statusId: 5, errorType: "Time Limit Exceeded" };

//   // ── Runtime Error ─────────────────────────────────────────────────────────
//   const runtimeMsg = clean(result.stderr) || clean(result.message) || result.status.description;
//   console.error("[Judge0] Runtime Error:", runtimeMsg);
//   return { output: "", error: runtimeMsg, statusId: result.status.id, errorType: "Runtime Error" };
// }

// router.post("/", async (req, res) => {
//   try {
//     const { code, slug, customInput, languageId } = req.body;

//     if (!code || !languageId)
//       return res.json({ userOutput: "", expectedOutput: "", verdict: "Invalid Request" });

//     const problem = await Problem.findOne({ slug });
//     if (!problem)
//       return res.json({ userOutput: "", expectedOutput: "", verdict: "Problem Not Found" });

//     const defaultInput = problem.samples?.[0]?.input?.trim() || "";
//     const finalInput   = customInput?.trim() !== "" ? customInput.trim() : defaultInput;
//     const isCustom     = finalInput !== defaultInput;

//     let expectedOutput = "";
//     if (!isCustom) {
//       const tc = await TestCase.findOne({ problemId: problem._id, isHidden: false });
//       expectedOutput = clean(tc?.output) || clean(problem.samples?.[0]?.output) || "";
//     } else if (problem.modelSolution) {
//       const modelResult = await runOnJudge0(problem.modelSolution, finalInput, problem.modelLanguageId || 54);
//       expectedOutput = modelResult.error ? "" : modelResult.output;
//     }

//     const userResult = await runOnJudge0(code, finalInput, languageId);

//     if (userResult.error) {
//       return res.json({
//         userOutput:     userResult.error,
//         expectedOutput: "",
//         verdict:        userResult.errorType
//       });
//     }

//     const userOutput = userResult.output || "";

//     if (!expectedOutput)
//       return res.json({ userOutput: userOutput || "No Output", expectedOutput: "", verdict: "Executed" });

//     const passed = userOutput === expectedOutput;
//     return res.json({ userOutput, expectedOutput, verdict: passed ? "Correct" : "Wrong Answer" });

//   } catch (err) {
//     console.error("[Run Route] Unexpected error:", err);
//     return res.json({ userOutput: err.message, expectedOutput: "", verdict: "Server Error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router  = express.Router();

const { protect }  = require("../middleware/authMiddleware");
const { runCode }  = require("../controllers/runController");


// POST /api/run  → run code against sample/custom input (no submission record)
router.post("/", protect, runCode);


module.exports = router;
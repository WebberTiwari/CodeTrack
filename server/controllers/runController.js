const Problem    = require("../models/Problem");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");
const { createSubmission, getResult } = require("../services/judge0Service");

const sleep     = (ms) => new Promise((r) => setTimeout(r, ms));
const normalize = (txt) => (txt || "").replace(/\r/g, "").trim();

const MAX_POLLS     = 10;
const POLL_INTERVAL = 1200;

async function pollResult(token) {
  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_INTERVAL);
    const result = await getResult(token);
    if (result?.status?.id >= 3) return result;
  }
  return null;
}

exports.runCode = catchAsync(async (req, res) => {
  const { code, slug, languageId, customInput } = req.body;

  if (!code || !slug || !languageId)
    throw new AppError("code, slug and languageId are required", 400);

  // Find problem — include modelSolution
  const problem = await Problem.findOne({ slug })
    .select("exampleInput expectedOutput samples title modelSolution modelLanguageId")
    .lean();
  if (!problem) throw new AppError("Problem not found", 404);

  const defaultInput = problem.exampleInput?.trim() || problem.samples?.[0]?.input?.trim() || "";
  const isCustom     = !!customInput?.trim();
  const input        = isCustom ? customInput.trim() : defaultInput;

  if (!input)
    throw new AppError("This problem has no sample test cases configured yet.", 400);

  // Submit user code + model solution (if custom input) in parallel
  const [userToken, modelToken] = await Promise.all([
    createSubmission(code, input, Number(languageId)),
    isCustom && problem.modelSolution
      ? createSubmission(problem.modelSolution, input, problem.modelLanguageId || 54)
      : Promise.resolve(null),
  ]);

  // Poll both in parallel
  const [result, modelResult] = await Promise.all([
    pollResult(userToken),
    modelToken ? pollResult(modelToken) : Promise.resolve(null),
  ]);

  if (!result)
    throw new AppError("Judge timed out — please try again", 504);

  // Determine expected output
  const expected = isCustom
    ? (modelResult?.status?.id === 3 ? normalize(modelResult.stdout) : "")
    : normalize(problem.expectedOutput?.trim() || problem.samples?.[0]?.output?.trim() || "");

  // Extract user output
  const userOutput = normalize(
    result.stdout || result.stderr || result.compile_output || ""
  );

  // Determine status
  let status;
  if (result.compile_output)    status = "Compilation Error";
  else if (result.status?.id === 5) status = "Time Limit Exceeded";
  else if (result.stderr)       status = "Runtime Error";
  else if (!expected)           status = "Executed";
  else if (normalize(userOutput) === expected) status = "Correct";
  else                          status = "Wrong Answer";

  res.json({
    success:        true,
    status,
    input,
    expectedOutput: expected,
    userOutput,
    runtime:        result.time   ?? null,
    memory:         result.memory ?? null,
  });
});
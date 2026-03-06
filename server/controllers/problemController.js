// const Problem = require("../models/Problem");

// // GET all problems
// exports.getProblems = async (req, res) => {
//   try {
//     const { difficulty, topic, company } = req.query;

//     let filter = {};

//     if (difficulty) filter.difficulty = difficulty;
//     if (topic) filter.topics = topic;
//     if (company) filter.companies = company;

//     const problems = await Problem.find(filter).select("title difficulty topics companies slug");

//     res.json(problems);

//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // GET single problem
// exports.getProblemBySlug = async (req, res) => {
//   try {
//     const problem = await Problem.findOne({ slug: req.params.slug });
//     if (!problem) return res.status(404).json({ message: "Problem not found" });

//     res.json(problem);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };


const Problem    = require("../models/Problem");
const TestCase   = require("../models/TestCase");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");


// ================= HELPERS =================

const paginationMeta = (total, pageNum, limitNum) => ({
  total,
  page:       pageNum,
  limit:      limitNum,
  totalPages: Math.ceil(total / limitNum),
  hasNext:    pageNum < Math.ceil(total / limitNum),
  hasPrev:    pageNum > 1,
});

// Auto-generate URL-safe slug from title
const slugify = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");


// ================= CREATE PROBLEM =================
// POST /api/problems/create  (admin only)

exports.createProblem = catchAsync(async (req, res) => {
  const {
    title, slug, difficulty, description,
    inputFormat, outputFormat, constraints,
    notes, tags, companies, samples, hiddenTests,
  } = req.body;

  if (!title || !slug || !difficulty || !description) {
    throw new AppError("title, slug, difficulty and description are required", 400);
  }

  // Check duplicate slug
  const existing = await Problem.findOne({ slug }).lean();
  if (existing) throw new AppError(`Problem with slug "${slug}" already exists`, 409);

  const problem = await Problem.create({
    title, slug, difficulty, description,
    inputFormat, outputFormat, constraints,
    notes, tags, companies, samples,
  });

  // Insert hidden test cases if provided
  if (hiddenTests?.length > 0) {
    const hiddenDocs = hiddenTests.map((tc) => ({
      problemId: problem._id,
      input:     tc.input,
      output:    tc.output,
      isHidden:  true,
    }));
    await TestCase.insertMany(hiddenDocs);
  }

  res.status(201).json({
    success: true,
    message: "Problem created successfully",
    problem,
  });
});


// ================= LIST ALL PROBLEMS (paginated + filtered) =================
// GET /api/problems?difficulty=Easy&topic=dp&company=google&search=two+sum&page=1&limit=20

exports.listProblems = catchAsync(async (req, res) => {
  const {
    difficulty, topic, company, search,
    page = 1, limit = 20,
  } = req.query;

  // Build filter
  const filter = {};
  if (difficulty) filter.difficulty = difficulty;
  if (topic)      filter.topics     = topic;
  if (company)    filter.companies  = company;
  if (search?.trim()) {
    filter.$or = [
      { title:       { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  // Parallel query + count
  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .select("title slug difficulty topics companies createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),

    Problem.countDocuments(filter),
  ]);

  res.json({
    success: true,
    problems,
    pagination: paginationMeta(total, pageNum, limitNum),
  });
});


// ================= GET PROBLEM BY SLUG =================
// GET /api/problems/slug/:slug

exports.getProblemBySlug = catchAsync(async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug }).lean();
  if (!problem) throw new AppError("Problem not found", 404);
  res.json({ success: true, problem });
});


// ================= GET PROBLEM BY ID =================
// GET /api/problems/:id

exports.getProblemById = catchAsync(async (req, res) => {
  const problem = await Problem.findById(req.params.id).lean();
  if (!problem) throw new AppError("Problem not found", 404);
  res.json({ success: true, problem });
});


// ================= UPDATE PROBLEM =================
// PUT /api/problems/:id  (admin only)

exports.updateProblem = catchAsync(async (req, res) => {
  const {
    title, slug, difficulty, description,
    inputFormat, outputFormat, constraints,
    notes, tags, companies, samples, hiddenTests,
  } = req.body;

  const problem = await Problem.findByIdAndUpdate(
    req.params.id,
    {
      title, slug, difficulty, description,
      inputFormat, outputFormat, constraints,
      notes, tags, companies, samples,
    },
    { new: true, runValidators: true }
  );

  if (!problem) throw new AppError("Problem not found", 404);

  // Replace hidden test cases if new ones provided
  if (hiddenTests?.length > 0) {
    await TestCase.deleteMany({ problemId: problem._id });
    const hiddenDocs = hiddenTests.map((tc) => ({
      problemId: problem._id,
      input:     tc.input,
      output:    tc.output,
      isHidden:  true,
    }));
    await TestCase.insertMany(hiddenDocs);
  }

  res.json({
    success: true,
    message: "Problem updated successfully",
    problem,
  });
});


// ================= DELETE PROBLEM =================
// DELETE /api/problems/:id  (admin only)

exports.deleteProblem = catchAsync(async (req, res) => {
  const problem = await Problem.findByIdAndDelete(req.params.id);
  if (!problem) throw new AppError("Problem not found", 404);

  // Clean up related test cases in parallel
  await TestCase.deleteMany({ problemId: req.params.id });

  res.json({ success: true, message: "Problem deleted successfully" });
});


// ================= BULK SINGLE IMPORT =================
// POST /api/problems/bulk-single  (admin only)

exports.bulkSingleImport = catchAsync(async (req, res) => {
  const {
    title, difficulty, description,
    tags, points, timeLimit, memoryLimit,
  } = req.body;

  if (!title || !difficulty || !description) {
    throw new AppError("title, difficulty and description are required", 400);
  }

  const slug = slugify(title);

  const existing = await Problem.findOne({ slug }).lean();
  if (existing) throw new AppError(`Problem with slug "${slug}" already exists`, 409);

  const problem = await Problem.create({
    title,
    slug,
    difficulty,
    description,
    tags:        tags ? tags.split(";").map((t) => t.trim()) : [],
    points:      points      || 100,
    timeLimit:   timeLimit   || 1000,
    memoryLimit: memoryLimit || 256,
  });

  res.status(201).json({
    success: true,
    message: "Problem created",
    problem,
  });
});
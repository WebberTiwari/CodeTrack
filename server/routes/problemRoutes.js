// const express = require("express");
// const router = express.Router();
// const Problem = require("../models/Problem");
// const TestCase = require("../models/TestCase");
// const { protect, isAdmin, restrictTo, optionalAuth } = require("../middleware/authMiddleware");

// // ── Admin guard ───────────────────────────────────────────────────────────────
// const adminOnly = (req, res, next) => {
//   if (req.user.role !== "admin")
//     return res.status(403).json({ msg: "Admin access required" });
//   next();
// };

// // ================= CREATE PROBLEM =================
// router.post("/create", protect, adminOnly, async (req, res) => {
//   try {
//     const {
//       title, slug, difficulty, description,
//       inputFormat, outputFormat, constraints,
//       notes, tags, companies, samples, hiddenTests
//     } = req.body;

//     const problem = await Problem.create({
//       title, slug, difficulty, description,
//       inputFormat, outputFormat, constraints,
//       notes, tags, companies, samples
//     });

//     if (hiddenTests?.length > 0) {
//       const hiddenDocs = hiddenTests.map(tc => ({
//         problemId: problem._id,
//         input:     tc.input,
//         output:    tc.output,
//         isHidden:  true
//       }));
//       await TestCase.insertMany(hiddenDocs);
//     }

//     res.json({ message: "Problem created successfully", problem });

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: "Failed to create problem" });
//   }
// });


// // ================= LIST ALL PROBLEMS (with pagination) =================
// router.get("/", async (req, res) => {
//   try {
//     const {
//       difficulty,
//       topic,
//       company,
//       search,
//       page  = 1,
//       limit = 20       // default 20 problems per page
//     } = req.query;

//     // ── Build filter query ──────────────────────────────────────────────
//     const query = {};

//     if (difficulty) query.difficulty = difficulty;
//     if (topic)      query.topics     = topic;       // matches your index
//     if (company)    query.companies  = company;

//     // Text search on title (uses text index from Problem model)
//     if (search && search.trim()) {
//       query.$or = [
//         { title: { $regex: search.trim(), $options: "i" } },
//         { description: { $regex: search.trim(), $options: "i" } }
//       ];
//     }

//     // ── Pagination math ─────────────────────────────────────────────────
//     const pageNum  = Math.max(1, parseInt(page));
//     const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // cap at 100
//     const skip     = (pageNum - 1) * limitNum;

//     // ── Run query + count in parallel ───────────────────────────────────
//     const [problems, total] = await Promise.all([
//       Problem.find(query)
//         .select("title slug difficulty topics companies createdAt")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limitNum)
//         .lean(),

//       Problem.countDocuments(query)
//     ]);

//     // ── Return paginated response ────────────────────────────────────────
//     res.json({
//       problems,
//       pagination: {
//         total,
//         page:       pageNum,
//         limit:      limitNum,
//         totalPages: Math.ceil(total / limitNum),
//         hasNext:    pageNum < Math.ceil(total / limitNum),
//         hasPrev:    pageNum > 1
//       }
//     });

//   } catch (err) {
//     console.error("Problem list error:", err.message);
//     res.status(500).json({ error: "Failed to fetch problems" });
//   }
// });


// // ================= GET SINGLE PROBLEM BY SLUG =================
// router.get("/slug/:slug", async (req, res) => {
//   try {
//     const problem = await Problem.findOne({ slug: req.params.slug });
//     if (!problem) return res.status(404).json({ error: "Problem not found" });
//     res.json(problem);
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });


// // ================= GET SINGLE PROBLEM BY ID =================
// router.get("/:id", async (req, res) => {
//   try {
//     const problem = await Problem.findById(req.params.id);
//     if (!problem) return res.status(404).json({ error: "Problem not found" });
//     res.json(problem);
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });


// // ================= UPDATE PROBLEM =================
// router.put("/:id", protect, adminOnly, async (req, res) => {
//   try {
//     const {
//       title, slug, difficulty, description,
//       inputFormat, outputFormat, constraints,
//       notes, tags, companies, samples, hiddenTests
//     } = req.body;

//     const problem = await Problem.findByIdAndUpdate(
//       req.params.id,
//       {
//         title, slug, difficulty, description,
//         inputFormat, outputFormat, constraints,
//         notes, tags, companies, samples
//       },
//       { new: true }
//     );

//     if (!problem) return res.status(404).json({ error: "Problem not found" });

//     // Replace hidden test cases if provided
//     if (hiddenTests?.length > 0) {
//       await TestCase.deleteMany({ problemId: problem._id });
//       const hiddenDocs = hiddenTests.map(tc => ({
//         problemId: problem._id,
//         input:     tc.input,
//         output:    tc.output,
//         isHidden:  true
//       }));
//       await TestCase.insertMany(hiddenDocs);
//     }

//     res.json({ message: "Problem updated successfully", problem });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to update problem" });
//   }
// });


// // ================= DELETE PROBLEM =================
// router.delete("/:id", protect, adminOnly, async (req, res) => {
//   try {
//     const problem = await Problem.findByIdAndDelete(req.params.id);
//     if (!problem) return res.status(404).json({ error: "Problem not found" });

//     // Also delete related test cases
//     await TestCase.deleteMany({ problemId: req.params.id });

//     res.json({ message: "Problem deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to delete problem" });
//   }
// });


// // ================= BULK IMPORT - SINGLE PROBLEM =================
// router.post("/bulk-single", protect, adminOnly, async (req, res) => {
//   try {
//     const {
//       title, difficulty, description,
//       tags, points, timeLimit, memoryLimit
//     } = req.body;

//     // Auto-generate slug from title
//     const slug = title
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9\s-]/g, "")
//       .replace(/\s+/g, "-");

//     // Check for duplicate slug
//     const existing = await Problem.findOne({ slug });
//     if (existing) {
//       return res.status(409).json({ error: `Problem with slug "${slug}" already exists` });
//     }

//     const problem = await Problem.create({
//       title,
//       slug,
//       difficulty,
//       description,
//       tags:        tags ? tags.split(";").map(t => t.trim()) : [],
//       points:      points      || 100,
//       timeLimit:   timeLimit   || 1000,
//       memoryLimit: memoryLimit || 256,
//     });

//     res.status(201).json({ message: "Problem created", problem });

//   } catch (err) {
//     console.error("bulk-single error:", err);
//     res.status(500).json({ error: "Failed to create problem" });
//   }
// });

// module.exports = router;


const express = require("express");
const router  = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");
const {
  createProblem,
  listProblems,
  getProblemBySlug,
  getProblemById,
  updateProblem,
  deleteProblem,
  bulkSingleImport,
} = require("../controllers/problemController");


// POST  /api/problems/create       → create problem (admin)
router.post("/create",       protect, isAdmin, createProblem);

// POST  /api/problems/bulk-single  → quick single import (admin)
router.post("/bulk-single",  protect, isAdmin, bulkSingleImport);

// GET   /api/problems              → list all (paginated, filterable)
router.get("/",                              listProblems);

// GET   /api/problems/slug/:slug   → get by slug  ← must be before /:id
router.get("/slug/:slug",                    getProblemBySlug);

// GET   /api/problems/:id          → get by id
router.get("/:id",                           getProblemById);

// PUT   /api/problems/:id          → update (admin)
router.put("/:id",           protect, isAdmin, updateProblem);

// DELETE /api/problems/:id         → delete (admin)
router.delete("/:id",        protect, isAdmin, deleteProblem);


module.exports = router;

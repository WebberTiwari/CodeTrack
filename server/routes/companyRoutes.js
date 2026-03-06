// routes/companyRoutes.js
const express = require("express");
const router  = express.Router();
const Company = require("../models/Company");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/company
// Returns all companies as summary cards (no full problem array in list view)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find({});

    const data = companies.map((c) => ({
      _id:          c._id,
      name:         c.name,
      logo:         c.logo,
      color:        c.color,
      totalProblems: c.problems.length,
      easyCount:    c.problems.filter((p) => p.difficulty === "Easy").length,
      mediumCount:  c.problems.filter((p) => p.difficulty === "Medium").length,
      hardCount:    c.problems.filter((p) => p.difficulty === "Hard").length,
      premiumCount: c.problems.filter((p) => p.isPremium).length,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET /api/company error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/company/:id/problems
// Returns full problem list for one company
// Optional query params: ?difficulty=Hard  ?tag=DP
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id/problems", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    let problems = company.problems;

    if (req.query.difficulty && req.query.difficulty !== "All") {
      problems = problems.filter((p) => p.difficulty === req.query.difficulty);
    }

    if (req.query.tag) {
      const tag = req.query.tag.toLowerCase();
      problems = problems.filter((p) =>
        p.tags.some((t) => t.toLowerCase().includes(tag))
      );
    }

    res.status(200).json({
      success: true,
      company: { _id: company._id, name: company.name, logo: company.logo, color: company.color },
      data: problems,
    });
  } catch (error) {
    console.error("GET /api/company/:id/problems error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/company
// Create a new company   body: { name, logo, color }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, logo, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    const existing = await Company.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Company already exists" });
    }

    const company = await Company.create({ name: name.trim(), logo, color });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    console.error("POST /api/company error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/company/:id/problems
// Add a problem to a company
// body: { title, difficulty, tags[], frequency, isPremium, leetcodeUrl }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:id/problems", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const { title, difficulty, tags, frequency, isPremium, leetcodeUrl } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Problem title is required" });
    }
    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res.status(400).json({ success: false, message: "Difficulty must be Easy, Medium, or Hard" });
    }

    company.problems.push({ title, difficulty, tags, frequency, isPremium, leetcodeUrl });
    await company.save();

    // Return only the newly added problem
    const newProblem = company.problems[company.problems.length - 1];
    res.status(201).json({ success: true, data: newProblem });
  } catch (error) {
    console.error("POST /api/company/:id/problems error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/company/:id/problems/:problemId
// Remove a problem from a company
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id/problems/:problemId", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const before = company.problems.length;
    company.problems = company.problems.filter(
      (p) => p._id.toString() !== req.params.problemId
    );

    if (company.problems.length === before) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    await company.save();
    res.status(200).json({ success: true, message: "Problem deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/company/:id/problems/:problemId error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/company/:id
// Delete an entire company
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }
    res.status(200).json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/company/:id error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
// routes/paymentRoutes.js

const express = require("express");
const router  = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { createOrder, verifyPayment, getPlanStatus } = require("../controllers/paymentController");

// All routes require authentication
router.use(protect);

// GET  /api/payment/status        → current plan + AI quota info
router.get("/status", getPlanStatus);

// POST /api/payment/create-order  → create Razorpay order
router.post("/create-order", createOrder);

// POST /api/payment/verify        → verify signature + activate plan
router.post("/verify", verifyPayment);

module.exports = router;
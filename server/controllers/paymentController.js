// controllers/paymentController.js
// ─────────────────────────────────────────────────────────────────────────────
// MOCK MODE: When MOCK_PAYMENT=true in .env, skips Razorpay entirely.
//   Real Razorpay flow (set MOCK_PAYMENT=false or remove it when deploying):
//   1. POST /api/payment/create-order  → creates Razorpay order, returns order_id
//   2. Frontend opens Razorpay checkout
//   3. POST /api/payment/verify        → verifies signature, activates Pro plan
//   4. GET  /api/payment/status        → returns current plan info for the user
// ─────────────────────────────────────────────────────────────────────────────

const crypto     = require("crypto");
const Razorpay   = require("razorpay");
const User       = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError   = require("../utils/AppError");

// ── Mock Mode flag — set MOCK_PAYMENT=true in .env to enable ─────────────────
const MOCK_PAYMENT = process.env.MOCK_PAYMENT === "true";

// ── Plans config ──────────────────────────────────────────────────────────────
const PLANS = {
  pro_monthly: {
    label:        "Pro Monthly",
    amount:       9900,          // ₹99 in paise
    durationDays: 30,
  },
  pro_yearly: {
    label:        "Pro Yearly",
    amount:       99900,         // ₹999 in paise
    durationDays: 365,
  },
};

// ── Razorpay instance (lazy — only if keys are present) ──────────────────────
let razorpay = null;
function getRazorpay() {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError("Payment gateway not configured", 503);
    }
    razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

// ── Helper: add N days to a date ─────────────────────────────────────────────
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Body: { planId: "pro_monthly" | "pro_yearly" }
// ─────────────────────────────────────────────────────────────────────────────
exports.createOrder = catchAsync(async (req, res) => {
  const { planId } = req.body;
  const userId     = req.user._id || req.user.id;

  const plan = PLANS[planId];
  if (!plan) throw new AppError("Invalid plan selected", 400);

  // ── MOCK MODE: return a fake order instantly, no Razorpay call ───────────────
  if (MOCK_PAYMENT) {
    const mockOrderId = `mock_order_${userId}_${Date.now()}`;

    await User.findByIdAndUpdate(userId, {
      $push: {
        subscriptionHistory: {
          plan:            "pro",
          amount:          plan.amount,
          razorpayOrderId: mockOrderId,
          status:          "created",
          expiresAt:       addDays(new Date(), plan.durationDays),
        },
      },
    });

    return res.json({
      success:    true,
      mock:       true,           // frontend uses this to skip Razorpay checkout
      orderId:    mockOrderId,
      amount:     plan.amount,
      currency:   "INR",
      planId,
      keyId:      "mock_key",
    });
  }

  // ── REAL MODE ─────────────────────────────────────────────────────────────────
  const rp = getRazorpay();

  const order = await rp.orders.create({
    amount:   plan.amount,
    currency: "INR",
    receipt:  `rcpt_${userId}_${Date.now()}`,
    notes: {
      userId:    userId.toString(),
      planId,
      planLabel: plan.label,
    },
  });

  await User.findByIdAndUpdate(userId, {
    $push: {
      subscriptionHistory: {
        plan:            "pro",
        amount:          plan.amount,
        razorpayOrderId: order.id,
        status:          "created",
        expiresAt:       addDays(new Date(), plan.durationDays),
      },
    },
  });

  res.json({
    success:  true,
    orderId:  order.id,
    amount:   plan.amount,
    currency: "INR",
    planId,
    keyId:    process.env.RAZORPAY_KEY_ID,
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
// Mock body: { razorpay_order_id: "mock_order_...", planId }
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyPayment = catchAsync(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
  } = req.body;

  const userId = req.user._id || req.user.id;

  // ── MOCK MODE: skip signature check, activate Pro directly ───────────────────
  if (MOCK_PAYMENT) {
    const plan      = PLANS[planId] || PLANS["pro_monthly"];
    const now       = new Date();
    const user      = await User.findById(userId).select("plan planExpiry");

    const baseDate  = (user.plan === "pro" && user.planExpiry > now)
      ? user.planExpiry
      : now;

    const newExpiry = addDays(baseDate, plan.durationDays);

    await User.findOneAndUpdate(
      { _id: userId, "subscriptionHistory.razorpayOrderId": razorpay_order_id },
      {
        $set: {
          plan:       "pro",
          planExpiry: newExpiry,
          "subscriptionHistory.$.status":            "paid",
          "subscriptionHistory.$.razorpayPaymentId": `mock_pay_${Date.now()}`,
          "subscriptionHistory.$.expiresAt":         newExpiry,
        },
      }
    );

    return res.json({
      success:   true,
      mock:      true,
      message:   "🎉 Pro plan activated! (Mock Mode)",
      plan:      "pro",
      expiresAt: newExpiry.toISOString(),
    });
  }

  // ── REAL MODE ─────────────────────────────────────────────────────────────────
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Missing payment verification fields", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    await User.findOneAndUpdate(
      { _id: userId, "subscriptionHistory.razorpayOrderId": razorpay_order_id },
      { $set: { "subscriptionHistory.$.status": "failed" } }
    );
    throw new AppError("Payment verification failed. Please contact support.", 400);
  }

  const plan      = PLANS[planId] || PLANS["pro_monthly"];
  const now       = new Date();
  const user      = await User.findById(userId).select("plan planExpiry");

  const baseDate  = (user.plan === "pro" && user.planExpiry > now)
    ? user.planExpiry
    : now;

  const newExpiry = addDays(baseDate, plan.durationDays);

  await User.findOneAndUpdate(
    { _id: userId, "subscriptionHistory.razorpayOrderId": razorpay_order_id },
    {
      $set: {
        plan:        "pro",
        planExpiry:  newExpiry,
        "subscriptionHistory.$.status":            "paid",
        "subscriptionHistory.$.razorpayPaymentId": razorpay_payment_id,
        "subscriptionHistory.$.expiresAt":         newExpiry,
      },
    }
  );

  res.json({
    success:   true,
    message:   "🎉 Pro plan activated!",
    plan:      "pro",
    expiresAt: newExpiry.toISOString(),
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/status
// Returns current plan info for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
exports.getPlanStatus = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const user = await User.findById(userId).select(
    "plan planExpiry aiUsedToday aiLastResetDate"
  );
  if (!user) throw new AppError("User not found", 404);

  const now    = new Date();
  const isPro  = user.plan === "pro" && user.planExpiry && user.planExpiry > now;
  const today  = new Date().toISOString().split("T")[0];

  const usedToday = user.aiLastResetDate === today ? (user.aiUsedToday ?? 0) : 0;

  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  res.json({
    success: true,
    mock:    MOCK_PAYMENT,        // frontend can show "Mock Mode" badge if desired
    plan:    isPro ? "pro" : "free",
    isPro,
    planExpiry:  isPro ? user.planExpiry : null,
    ai: {
      limit:     isPro ? null : 5,
      used:      isPro ? null : usedToday,
      remaining: isPro ? null : Math.max(0, 5 - usedToday),
      resetsAt:  isPro ? null : midnight.toISOString(),
    },
    plans: Object.entries(PLANS).map(([id, p]) => ({
      id,
      label:         p.label,
      amount:        p.amount,
      amountDisplay: `₹${p.amount / 100}`,
      durationDays:  p.durationDays,
    })),
  });
});
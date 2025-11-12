const express = require("express");
const router = express.Router();
const {
  startRound,
  getRounds,
  createDaySummary,
  getDaySummaries,
  createCredit,
  getCredits,
  collectCredit,
  updateCredit,
  deleteCredit,
  getDashboardStats,
  sendCreditReminders,
  getVendorPerformance,
  completeRound,
  getInProgressRound,
} = require("../controllers/catering");
const { authenticate } = require("../middleware/Auth");

// =============================================
// ROUND ROUTES
// =============================================

// @route   POST /rounds/start
// @desc    Start a new round
// @access  Private (Vendor only)
router.post("/rounds/start", authenticate, startRound);

// @route   GET /rounds
// @desc    Get all rounds for a date
// @access  Private (Vendor only)
router.get("/rounds", authenticate, getRounds);

// @route   GET /rounds/in-progress
// @desc    Get current in-progress round
// @access  Private (Vendor only)
router.get("/rounds/in-progress", authenticate, getInProgressRound);

// @route   PUT /rounds/:roundId/complete
// @desc    Complete a round
// @access  Private (Vendor only)
router.put("/rounds/:roundId/complete", authenticate, completeRound);

// =============================================
// DAY SUMMARY ROUTES
// =============================================

// @route   POST /day-summary
// @desc    Create end of day summary
// @access  Private (Vendor only)
router.post("/day-summary", authenticate, createDaySummary);

// @route   GET /summaries
// @desc    Get day summaries within date range
// @access  Private (Vendor only)
router.get("/summaries", authenticate, getDaySummaries);

// =============================================
// CREDIT ROUTES
// =============================================

// @route   POST /credits
// @desc    Create a new credit
// @access  Private (Vendor only)
router.post("/credits", authenticate, createCredit);

// @route   GET /credits
// @desc    Get all credits
// @access  Private (Vendor only)
router.get("/credits", authenticate, getCredits);

// @route   PUT /credits/:creditId/collect
// @desc    Collect payment for a credit
// @access  Private (Vendor only)
router.put("/credits/:creditId/collect", authenticate, collectCredit);

// @route   PUT /credits/:creditId
// @desc    Update credit details
// @access  Private (Vendor only)
router.put("/credits/:creditId", authenticate, updateCredit);

// @route   DELETE /credits/:creditId
// @desc    Delete a credit
// @access  Private (Vendor only)
router.delete("/credits/:creditId", authenticate, deleteCredit);

// @route   POST /credits/send-reminders
// @desc    Send reminders for overdue credits (CRON job)
// @access  Private (Admin only - or use API key)
router.post("/credits/send-reminders", authenticate, sendCreditReminders);

// =============================================
// DASHBOARD & ANALYTICS ROUTES
// =============================================

// @route   GET /dashboard
// @desc    Get dashboard statistics
// @access  Private (Vendor only)
router.get("/dashboard", authenticate, getDashboardStats);

// @route   GET /performance
// @desc    Get vendor performance metrics
// @access  Private (Vendor only)
router.get("/performance", authenticate, getVendorPerformance);

module.exports = router;

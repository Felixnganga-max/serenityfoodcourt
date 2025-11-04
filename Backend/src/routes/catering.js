const express = require("express");
const router = express.Router();
const {
  createRound,
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
} = require("../controllers/catering");

// =============================================
// ROUND ROUTES
// =============================================

// @route   POST /rounds
// @desc    Create a new round
// @access  Private (Vendor only)
router.post("/rounds", createRound);

// @route   GET /rounds
// @desc    Get all rounds for a date
// @access  Private (Vendor only)
router.get("/rounds", getRounds);

// =============================================
// DAY SUMMARY ROUTES
// =============================================

// @route   POST /day-summary
// @desc    Create end of day summary
// @access  Private (Vendor only)
router.post("/day-summary", createDaySummary);

// @route   GET /summaries
// @desc    Get day summaries within date range
// @access  Private (Vendor only)
router.get("/summaries", getDaySummaries);

// =============================================
// CREDIT ROUTES
// =============================================

// @route   POST /credits
// @desc    Create a new credit
// @access  Private (Vendor only)
router.post("/credits", createCredit);

// @route   GET /credits
// @desc    Get all credits
// @access  Private (Vendor only)
router.get("/credits", getCredits);

// @route   PUT /credits/:creditId/collect
// @desc    Collect payment for a credit
// @access  Private (Vendor only)
router.put("/credits/:creditId/collect", collectCredit);

// @route   PUT /credits/:creditId
// @desc    Update credit details
// @access  Private (Vendor only)
router.put("/credits/:creditId", updateCredit);

// @route   DELETE /credits/:creditId
// @desc    Delete a credit
// @access  Private (Vendor only)
router.delete("/credits/:creditId", deleteCredit);

// @route   POST /credits/send-reminders
// @desc    Send reminders for overdue credits (CRON job)
// @access  Private (Admin only - or use API key)
router.post("/credits/send-reminders", sendCreditReminders);

// =============================================
// DASHBOARD & ANALYTICS ROUTES
// =============================================

// @route   GET /dashboard
// @desc    Get dashboard statistics
// @access  Private (Vendor only)
router.get("/dashboard", getDashboardStats);

// @route   GET /performance
// @desc    Get vendor performance metrics
// @access  Private (Vendor only)
router.get("/performance", getVendorPerformance);

module.exports = router;

const {
  OutsideCateringRound,
  OutsideCateringCredit,
  OutsideCateringDaySummary,
} = require("../models/catering");
const User = require("../models/sales");
const MenuItem = require("../models/sales");

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Get current date in YYYY-MM-DD format
 */
const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Calculate days past due for a credit
 */
const calculateDaysPastDue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Update credit status based on due date
 */
const updateCreditStatus = async (credit) => {
  const daysPastDue = calculateDaysPastDue(credit.dueDate);
  credit.daysPastDue = daysPastDue;

  if (credit.isPaid) {
    credit.status = "paid";
  } else if (daysPastDue >= 5) {
    credit.status = "vendor-deducted";
    if (!credit.deductedFromVendor) {
      credit.deductedFromVendor = true;
      credit.deductedDate = getCurrentDate();
    }
  } else if (daysPastDue > 0) {
    credit.status = "overdue";
  } else {
    credit.status = "pending";
  }

  credit.updatedAt = new Date();
  await credit.save();
  return credit;
};

// =============================================
// CREATE ROUND
// =============================================
/**
 * POST /api/outside-catering/rounds
 * Record a completed round
 */
exports.createRound = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      roundNumber,
      items,
      returns,
      expectedAmount,
      returnsAmount,
      netTotal,
      startTime,
      endTime,
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

    if (!roundNumber || !expectedAmount || !netTotal) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Get current date
    const date = getCurrentDate();

    // Calculate vendor commission (19%)
    const vendorCommission = netTotal * 0.19;

    // Create the round
    const round = new OutsideCateringRound({
      vendorId,
      date,
      roundNumber,
      items,
      returns: returns || [],
      expectedAmount,
      returnsAmount: returnsAmount || 0,
      netTotal,
      vendorCommission,
      startTime,
      endTime,
      status: "completed",
    });

    await round.save();

    res.status(201).json({
      success: true,
      message: `Round ${roundNumber} completed successfully!`,
      data: round,
    });
  } catch (error) {
    console.error("Error creating round:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create round",
    });
  }
};

// =============================================
// GET ROUNDS
// =============================================
/**
 * GET /api/outside-catering/rounds?date=YYYY-MM-DD
 * Get all rounds for a specific date
 */
exports.getRounds = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { date } = req.query;

    // Use provided date or current date
    const queryDate = date || getCurrentDate();

    const rounds = await OutsideCateringRound.find({
      vendorId,
      date: queryDate,
    }).sort({ roundNumber: 1 });

    res.status(200).json({
      success: true,
      data: rounds,
      count: rounds.length,
    });
  } catch (error) {
    console.error("Error fetching rounds:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch rounds",
    });
  }
};

// =============================================
// CREATE DAY SUMMARY
// =============================================
/**
 * POST /api/outside-catering/day-summary
 * Complete the day and create summary
 */
exports.createDaySummary = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      totalRounds,
      rounds,
      totalExpected,
      totalReturns,
      creditsGiven,
      creditsCollected,
      netTotal,
      cashCollected,
      mpesaCollected,
      totalCollected,
      difference,
      reconciliationNotes,
    } = req.body;

    // Validation
    if (!totalRounds || rounds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No rounds to summarize",
      });
    }

    // Get current date
    const date = getCurrentDate();

    // Check if summary already exists for today
    const existingSummary = await OutsideCateringDaySummary.findOne({
      vendorId,
      date,
    });

    if (existingSummary) {
      return res.status(400).json({
        success: false,
        error: "Day summary already exists for today",
      });
    }

    // Calculate vendor commission (19%)
    const vendorCommission = netTotal * 0.19;

    // Create day summary
    const summary = new OutsideCateringDaySummary({
      vendorId,
      date,
      totalRounds,
      rounds,
      totalExpected,
      totalReturns,
      creditsGiven: creditsGiven || 0,
      creditsCollected: creditsCollected || 0,
      netTotal,
      cashCollected: cashCollected || 0,
      mpesaCollected: mpesaCollected || 0,
      totalCollected,
      difference,
      vendorCommission,
      status: "completed",
      reconciliationNotes,
      completedAt: new Date(),
    });

    await summary.save();

    res.status(201).json({
      success: true,
      message: "Day summary created successfully!",
      data: summary,
    });
  } catch (error) {
    console.error("Error creating day summary:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create day summary",
    });
  }
};

// =============================================
// GET DAY SUMMARIES
// =============================================
/**
 * GET /api/outside-catering/summaries?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get summaries within a date range
 */
exports.getDaySummaries = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { startDate, endDate } = req.query;

    // Build query
    const query = { vendorId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const summaries = await OutsideCateringDaySummary.find(query)
      .sort({ date: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      data: summaries,
      count: summaries.length,
    });
  } catch (error) {
    console.error("Error fetching summaries:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch summaries",
    });
  }
};

// =============================================
// CREATE CREDIT
// =============================================
/**
 * POST /api/outside-catering/credits
 * Record a credit given to customer
 */
exports.createCredit = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { customerName, customerPhone, amount, notes } = req.body;

    // Validation
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        error: "Customer name is required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required",
      });
    }

    // Get current date and calculate due date (next day)
    const date = getCurrentDate();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Create credit
    const credit = new OutsideCateringCredit({
      vendorId,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim(),
      amount,
      date,
      dueDate: dueDateStr,
      notes: notes?.trim(),
      status: "pending",
    });

    await credit.save();

    res.status(201).json({
      success: true,
      message: `Credit of KSh ${amount.toLocaleString()} recorded for ${customerName}`,
      data: credit,
    });
  } catch (error) {
    console.error("Error creating credit:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create credit",
    });
  }
};

// =============================================
// GET CREDITS
// =============================================
/**
 * GET /api/outside-catering/credits
 * Get all credits with updated statuses
 */
exports.getCredits = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, isPaid } = req.query;

    // Build query
    const query = { vendorId };

    if (status) {
      query.status = status;
    }

    if (isPaid !== undefined) {
      query.isPaid = isPaid === "true";
    }

    const credits = await OutsideCateringCredit.find(query).sort({
      date: -1,
      createdAt: -1,
    });

    // Update each credit's status
    const updatedCredits = await Promise.all(
      credits.map((credit) => updateCreditStatus(credit))
    );

    res.status(200).json({
      success: true,
      data: updatedCredits,
      count: updatedCredits.length,
    });
  } catch (error) {
    console.error("Error fetching credits:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch credits",
    });
  }
};

// =============================================
// COLLECT CREDIT PAYMENT
// =============================================
/**
 * PUT /api/outside-catering/credits/:creditId/collect
 * Mark a credit as paid
 */
exports.collectCredit = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { creditId } = req.params;
    const { paymentMethod, paidAmount } = req.body;

    // Validation
    if (!paymentMethod || !["cash", "mpesa"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: "Valid payment method is required (cash or mpesa)",
      });
    }

    // Find credit
    const credit = await OutsideCateringCredit.findOne({
      _id: creditId,
      vendorId,
    });

    if (!credit) {
      return res.status(404).json({
        success: false,
        error: "Credit not found",
      });
    }

    if (credit.isPaid) {
      return res.status(400).json({
        success: false,
        error: "This credit has already been collected",
      });
    }

    // Update credit
    credit.isPaid = true;
    credit.paidDate = getCurrentDate();
    credit.paidAmount = paidAmount || credit.amount;
    credit.paymentMethod = paymentMethod;
    credit.status = "paid";
    credit.updatedAt = new Date();

    await credit.save();

    res.status(200).json({
      success: true,
      message: `Payment of KSh ${credit.paidAmount.toLocaleString()} collected from ${
        credit.customerName
      }`,
      data: credit,
    });
  } catch (error) {
    console.error("Error collecting credit:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to collect credit",
    });
  }
};

// =============================================
// GET DASHBOARD STATS
// =============================================
/**
 * GET /api/outside-catering/dashboard?date=YYYY-MM-DD
 * Get dashboard statistics for a specific date
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { date } = req.query;
    const queryDate = date || getCurrentDate();

    // Get today's rounds
    const rounds = await OutsideCateringRound.find({
      vendorId,
      date: queryDate,
    });

    // Get today's credits
    const credits = await OutsideCateringCredit.find({ vendorId });

    // Update credit statuses
    await Promise.all(credits.map((credit) => updateCreditStatus(credit)));

    // Calculate stats
    const totalRounds = rounds.length;
    const totalExpected = rounds.reduce((sum, r) => sum + r.expectedAmount, 0);
    const totalReturns = rounds.reduce((sum, r) => sum + r.returnsAmount, 0);
    const netTotal = rounds.reduce((sum, r) => sum + r.netTotal, 0);
    const vendorCommission = netTotal * 0.19;

    // Credits given today
    const creditsGivenToday = credits.filter(
      (c) => c.date === queryDate && !c.isPaid
    );
    const creditAmount = creditsGivenToday.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    // Credits collected today
    const creditsCollectedToday = credits.filter(
      (c) => c.paidDate === queryDate
    );
    const creditsCollectedAmount = creditsCollectedToday.reduce(
      (sum, c) => sum + c.paidAmount,
      0
    );

    // Outstanding credits
    const outstandingCredits = credits.filter((c) => !c.isPaid);
    const overdueCredits = outstandingCredits.filter(
      (c) => c.status === "overdue"
    );
    const criticalCredits = overdueCredits.filter((c) => c.daysPastDue >= 5);
    const totalOutstanding = outstandingCredits.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    // Adjusted expected (after credits)
    const adjustedExpected = netTotal - creditAmount + creditsCollectedAmount;

    res.status(200).json({
      success: true,
      data: {
        date: queryDate,
        rounds: {
          total: totalRounds,
          expectedAmount: totalExpected,
          returnsAmount: totalReturns,
          netTotal,
        },
        credits: {
          givenToday: creditsGivenToday.length,
          givenAmount: creditAmount,
          collectedToday: creditsCollectedToday.length,
          collectedAmount: creditsCollectedAmount,
          outstanding: outstandingCredits.length,
          outstandingAmount: totalOutstanding,
          overdue: overdueCredits.length,
          critical: criticalCredits.length,
          criticalAmount: criticalCredits.reduce((sum, c) => sum + c.amount, 0),
        },
        financial: {
          grossSales: totalExpected,
          returns: totalReturns,
          creditsGiven: creditAmount,
          creditsCollected: creditsCollectedAmount,
          netTotal: adjustedExpected,
          vendorCommission,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch dashboard stats",
    });
  }
};

// =============================================
// SEND CREDIT REMINDERS (CRON JOB)
// =============================================
/**
 * POST /api/outside-catering/credits/send-reminders
 * Send reminders for overdue credits
 * This should be called by a cron job daily
 */
exports.sendCreditReminders = async (req, res) => {
  try {
    // Get all unpaid credits
    const credits = await OutsideCateringCredit.find({ isPaid: false });

    const today = getCurrentDate();
    const reminders = [];

    for (const credit of credits) {
      // Update status
      await updateCreditStatus(credit);

      // Send reminder if overdue and not reminded today
      if (credit.status === "overdue" && credit.lastReminderDate !== today) {
        // Here you would integrate with SMS/WhatsApp API
        // For now, we'll just log and update the reminder count

        credit.remindersSent += 1;
        credit.lastReminderDate = today;
        await credit.save();

        reminders.push({
          creditId: credit._id,
          customerName: credit.customerName,
          customerPhone: credit.customerPhone,
          amount: credit.amount,
          daysPastDue: credit.daysPastDue,
          message: `Reminder: Payment of KSh ${credit.amount} is ${credit.daysPastDue} days overdue. Please pay today.`,
        });

        console.log(
          `Reminder sent to ${credit.customerName}: KSh ${credit.amount} (${credit.daysPastDue} days overdue)`
        );
      }

      // Alert vendor if credit is 5+ days overdue
      if (credit.daysPastDue >= 5 && !credit.deductedFromVendor) {
        console.log(
          `ALERT: Credit ${credit._id} is ${credit.daysPastDue} days overdue and will be deducted from vendor!`
        );
      }
    }

    res.status(200).json({
      success: true,
      message: `${reminders.length} reminders sent`,
      data: reminders,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send reminders",
    });
  }
};

// =============================================
// UPDATE CREDIT
// =============================================
/**
 * PUT /api/outside-catering/credits/:creditId
 * Update credit details
 */
exports.updateCredit = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { creditId } = req.params;
    const updates = req.body;

    const credit = await OutsideCateringCredit.findOne({
      _id: creditId,
      vendorId,
    });

    if (!credit) {
      return res.status(404).json({
        success: false,
        error: "Credit not found",
      });
    }

    // Update allowed fields
    if (updates.customerName) credit.customerName = updates.customerName.trim();
    if (updates.customerPhone)
      credit.customerPhone = updates.customerPhone.trim();
    if (updates.notes !== undefined) credit.notes = updates.notes.trim();

    credit.updatedAt = new Date();
    await credit.save();

    res.status(200).json({
      success: true,
      message: "Credit updated successfully",
      data: credit,
    });
  } catch (error) {
    console.error("Error updating credit:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update credit",
    });
  }
};

// =============================================
// DELETE CREDIT
// =============================================
/**
 * DELETE /api/outside-catering/credits/:creditId
 * Delete a credit (only if not paid)
 */
exports.deleteCredit = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { creditId } = req.params;

    const credit = await OutsideCateringCredit.findOne({
      _id: creditId,
      vendorId,
    });

    if (!credit) {
      return res.status(404).json({
        success: false,
        error: "Credit not found",
      });
    }

    if (credit.isPaid) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete a paid credit",
      });
    }

    await credit.deleteOne();

    res.status(200).json({
      success: true,
      message: "Credit deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting credit:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete credit",
    });
  }
};

// =============================================
// GET VENDOR PERFORMANCE
// =============================================
/**
 * GET /api/outside-catering/performance
 * Get vendor performance metrics
 */
exports.getVendorPerformance = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get all summaries
    const summaries = await OutsideCateringDaySummary.find({ vendorId }).sort({
      date: -1,
    });

    // Get all credits
    const credits = await OutsideCateringCredit.find({ vendorId });
    const unpaidCredits = credits.filter((c) => !c.isPaid);

    // Calculate metrics
    const totalDays = summaries.length;
    const totalSales = summaries.reduce((sum, s) => sum + s.netTotal, 0);
    const totalCommission = summaries.reduce(
      (sum, s) => sum + s.vendorCommission,
      0
    );
    const totalCreditsGiven = credits.reduce((sum, c) => sum + c.amount, 0);
    const totalCreditsPaid = credits
      .filter((c) => c.isPaid)
      .reduce((sum, c) => sum + c.paidAmount, 0);
    const outstandingCredits = unpaidCredits.reduce(
      (sum, c) => sum + c.amount,
      0
    );
    const averageDailySales = totalDays > 0 ? totalSales / totalDays : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDays,
          totalSales,
          totalCommission,
          averageDailySales,
        },
        credits: {
          totalGiven: credits.length,
          totalGivenAmount: totalCreditsGiven,
          totalPaid: credits.filter((c) => c.isPaid).length,
          totalPaidAmount: totalCreditsPaid,
          outstanding: unpaidCredits.length,
          outstandingAmount: outstandingCredits,
          recoveryRate:
            totalCreditsGiven > 0
              ? ((totalCreditsPaid / totalCreditsGiven) * 100).toFixed(2)
              : 0,
        },
        recentSummaries: summaries.slice(0, 7),
      },
    });
  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch performance",
    });
  }
};

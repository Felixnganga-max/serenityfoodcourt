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

/**
 * Check if user can view commission data
 * Only managers and vendors can see commission amounts
 */
const canViewCommission = (userRole) => {
  return ["manager", "admin", "vendor"].includes(userRole);
};

/**
 * Remove commission data from response if user doesn't have permission
 */
const sanitizeCommissionData = (data, userRole) => {
  if (canViewCommission(userRole)) {
    return data; // Return as-is for authorized users
  }

  // Remove commission fields for attendants
  const sanitized = { ...data };

  if (sanitized.vendorCommission !== undefined) {
    delete sanitized.vendorCommission;
  }

  return sanitized;
};

/**
 * Sanitize array of rounds/summaries
 */
const sanitizeArrayCommissionData = (items, userRole) => {
  if (canViewCommission(userRole)) {
    return items; // Return as-is for authorized users
  }

  return items.map((item) => {
    const itemObj = item.toObject ? item.toObject() : item;
    delete itemObj.vendorCommission;
    return itemObj;
  });
};

// =============================================
// START ROUND (PUBLIC - ANYONE CAN START)
// =============================================
/**
 * POST /api/outside-catering/rounds/start
 * Start a new round with items
 */
exports.startRound = async (req, res) => {
  try {
    const vendorId = req.user.id; // The person starting the round
    const { items, expectedAmount } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

    if (!expectedAmount) {
      return res.status(400).json({
        success: false,
        error: "Expected amount is required",
      });
    }

    // Get current date
    const date = getCurrentDate();

    // Check if there's already an in-progress round (for ANY vendor)
    const existingRound = await OutsideCateringRound.findOne({
      date,
      status: "in-progress",
    });

    if (existingRound) {
      return res.status(400).json({
        success: false,
        error: "There is already a round in progress",
        data: sanitizeCommissionData(existingRound.toObject(), req.user.role),
      });
    }

    // Count today's completed rounds to determine round number
    const completedRounds = await OutsideCateringRound.countDocuments({
      date,
      status: "completed",
    });

    const roundNumber = completedRounds + 1;

    // Create the in-progress round
    const round = new OutsideCateringRound({
      vendorId,
      date,
      roundNumber,
      items,
      returns: [],
      expectedAmount,
      returnsAmount: 0,
      netTotal: expectedAmount, // Will be updated when completed
      vendorCommission: 0, // Will be calculated when completed
      startTime: new Date(),
      endTime: new Date(), // Placeholder, will be updated when completed
      status: "in-progress",
    });

    await round.save();

    res.status(201).json({
      success: true,
      message: `Round ${roundNumber} started successfully!`,
      data: sanitizeCommissionData(round.toObject(), req.user.role),
    });
  } catch (error) {
    console.error("Error starting round:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to start round",
    });
  }
};

// =============================================
// COMPLETE ROUND (PUBLIC - ANYONE CAN COMPLETE)
// =============================================
/**
 * PUT /api/outside-catering/rounds/:roundId/complete
 * Complete an in-progress round with returns
 */
exports.completeRound = async (req, res) => {
  try {
    const { roundId } = req.params;
    const { returns, returnsAmount } = req.body;

    // Find the in-progress round (any vendor)
    const round = await OutsideCateringRound.findOne({
      _id: roundId,
      status: "in-progress",
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        error: "In-progress round not found",
      });
    }

    // Update round with returns
    round.returns = returns || [];
    round.returnsAmount = returnsAmount || 0;
    round.netTotal = round.expectedAmount - round.returnsAmount;
    round.vendorCommission = round.netTotal * 0.19;
    round.endTime = new Date();
    round.status = "completed";

    await round.save();

    res.status(200).json({
      success: true,
      message: `Round ${round.roundNumber} completed successfully!`,
      data: sanitizeCommissionData(round.toObject(), req.user.role),
    });
  } catch (error) {
    console.error("Error completing round:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to complete round",
    });
  }
};

// =============================================
// GET IN-PROGRESS ROUND (PUBLIC - ANYONE CAN VIEW)
// =============================================
/**
 * GET /api/outside-catering/rounds/in-progress
 * Get the current in-progress round
 */
exports.getInProgressRound = async (req, res) => {
  try {
    const date = getCurrentDate();

    const round = await OutsideCateringRound.findOne({
      date,
      status: "in-progress",
    });

    res.status(200).json({
      success: true,
      data: round
        ? sanitizeCommissionData(round.toObject(), req.user.role)
        : null,
    });
  } catch (error) {
    console.error("Error fetching in-progress round:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch in-progress round",
    });
  }
};

// =============================================
// GET ROUNDS (PUBLIC - ANYONE CAN VIEW)
// =============================================
/**
 * GET /api/outside-catering/rounds?date=YYYY-MM-DD
 * Get all completed rounds for a specific date
 */
exports.getRounds = async (req, res) => {
  try {
    const { date } = req.query;

    // Use provided date or current date
    const queryDate = date || getCurrentDate();

    const rounds = await OutsideCateringRound.find({
      date: queryDate,
      status: "completed",
    }).sort({ roundNumber: 1 });

    // Sanitize commission data based on user role
    const sanitizedRounds = sanitizeArrayCommissionData(rounds, req.user.role);

    res.status(200).json({
      success: true,
      data: sanitizedRounds,
      count: sanitizedRounds.length,
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
// CREATE DAY SUMMARY (PUBLIC - ANYONE CAN CREATE)
// =============================================
/**
 * POST /api/outside-catering/day-summary
 * Complete the day and create summary
 */
exports.createDaySummary = async (req, res) => {
  try {
    const vendorId = req.user.id || req.user._id; // Person creating the summary

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
      data: sanitizeCommissionData(summary.toObject(), req.user.role),
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
// GET DAY SUMMARIES (PUBLIC - ANYONE CAN VIEW)
// =============================================
/**
 * GET /api/outside-catering/summaries?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get summaries within a date range
 */
exports.getDaySummaries = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build query
    const query = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const summaries = await OutsideCateringDaySummary.find(query)
      .sort({ date: -1 })
      .limit(30);

    // Sanitize commission data based on user role
    const sanitizedSummaries = sanitizeArrayCommissionData(
      summaries,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: sanitizedSummaries,
      count: sanitizedSummaries.length,
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
// CREATE CREDIT (PUBLIC - ANYONE CAN CREATE)
// =============================================
/**
 * POST /api/outside-catering/credits
 * Record a credit given to customer
 */
exports.createCredit = async (req, res) => {
  try {
    const vendorId = req.user.id; // Person creating the credit
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
// GET CREDITS (PUBLIC - ANYONE CAN VIEW)
// =============================================
/**
 * GET /api/outside-catering/credits
 * Get all credits with updated statuses
 */
exports.getCredits = async (req, res) => {
  try {
    const { status, isPaid } = req.query;

    // Build query (no vendorId filter - everyone sees all credits)
    const query = {};

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
// COLLECT CREDIT PAYMENT (PUBLIC - ANYONE CAN COLLECT)
// =============================================
/**
 * PUT /api/outside-catering/credits/:creditId/collect
 * Mark a credit as paid
 */
exports.collectCredit = async (req, res) => {
  try {
    const { creditId } = req.params;
    const { paymentMethod, paidAmount } = req.body;

    // Validation
    if (!paymentMethod || !["cash", "mpesa"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: "Valid payment method is required (cash or mpesa)",
      });
    }

    // Find credit (no vendorId filter)
    const credit = await OutsideCateringCredit.findOne({
      _id: creditId,
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
// GET DASHBOARD STATS (PUBLIC - COMMISSION RESTRICTED)
// =============================================
/**
 * GET /api/outside-catering/dashboard?date=YYYY-MM-DD
 * Get dashboard statistics for a specific date
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date || getCurrentDate();

    // Get today's completed rounds (all vendors)
    const rounds = await OutsideCateringRound.find({
      date: queryDate,
      status: "completed",
    });

    // Get all credits
    const credits = await OutsideCateringCredit.find({});

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

    // Build response
    const responseData = {
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
      },
    };

    // Only include vendorCommission if user has permission
    if (canViewCommission(req.user.role)) {
      responseData.financial.vendorCommission = vendorCommission;
    }

    res.status(200).json({
      success: true,
      data: responseData,
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
// UPDATE CREDIT (PUBLIC - ANYONE CAN UPDATE)
// =============================================
/**
 * PUT /api/outside-catering/credits/:creditId
 * Update credit details
 */
exports.updateCredit = async (req, res) => {
  try {
    const { creditId } = req.params;
    const updates = req.body;

    const credit = await OutsideCateringCredit.findOne({
      _id: creditId,
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
// DELETE CREDIT (PUBLIC - ANYONE CAN DELETE)
// =============================================
/**
 * DELETE /api/outside-catering/credits/:creditId
 * Delete a credit (only if not paid)
 */
exports.deleteCredit = async (req, res) => {
  try {
    const { creditId } = req.params;

    const credit = await OutsideCateringCredit.findOne({
      _id: creditId,
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
// GET VENDOR PERFORMANCE (MANAGERS/VENDORS ONLY)
// =============================================
/**
 * GET /api/outside-catering/performance
 * Get vendor performance metrics
 */
exports.getVendorPerformance = async (req, res) => {
  try {
    // Get all summaries
    const summaries = await OutsideCateringDaySummary.find({}).sort({
      date: -1,
    });

    // Get all credits
    const credits = await OutsideCateringCredit.find({});
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

    // Build response with commission data only if user has permission
    const responseData = {
      overview: {
        totalDays,
        totalSales,
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
      recentSummaries: sanitizeArrayCommissionData(
        summaries.slice(0, 7),
        req.user.role
      ),
    };

    // Add commission data only for authorized users
    if (canViewCommission(req.user.role)) {
      responseData.overview.totalCommission = totalCommission;
    }

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch performance",
    });
  }
};

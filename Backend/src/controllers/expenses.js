const { Expense } = require("../models/sales");

// =============================================
// EXPENSE CONTROLLERS (Manager only)
// =============================================

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      recordedBy: req.user.id,
    });

    await expense.save();
    await expense.populate("recordedBy", "fullName");

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all expenses with filters
exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, type, category, allocationPeriod } = req.query;

    let filter = {};

    if (startDate && endDate) {
      filter.startDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.startDate = { $gte: startDate };
    }

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (allocationPeriod) {
      filter.allocationPeriod = allocationPeriod;
    }

    const expenses = await Expense.find(filter)
      .populate("recordedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: expenses,
      count: expenses.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get expense summary
exports.getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate, period = "daily" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "startDate and endDate are required",
      });
    }

    // Calculate the number of days/weeks/months in the period
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let multiplier = 1;
    switch (period) {
      case "daily":
        multiplier = diffDays;
        break;
      case "weekly":
        multiplier = Math.ceil(diffDays / 7);
        break;
      case "bi-weekly":
        multiplier = Math.ceil(diffDays / 14);
        break;
      case "monthly":
        multiplier = Math.ceil(diffDays / 30);
        break;
    }

    // Get all expenses
    const expenses = await Expense.find({
      startDate: { $lte: endDate },
      $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
    });

    // Calculate allocated amounts based on expense period
    let totalFixed = 0;
    let totalVariable = 0;
    const categoryBreakdown = {};
    const detailedExpenses = [];

    expenses.forEach((expense) => {
      let allocatedAmount = 0;

      // Calculate how much of this expense applies to the selected period
      switch (expense.allocationPeriod) {
        case "daily":
          allocatedAmount = expense.amount * diffDays;
          break;
        case "weekly":
          allocatedAmount = expense.amount * Math.ceil(diffDays / 7);
          break;
        case "bi-weekly":
          allocatedAmount = expense.amount * Math.ceil(diffDays / 14);
          break;
        case "monthly":
          allocatedAmount = expense.amount * Math.ceil(diffDays / 30);
          break;
      }

      if (expense.type === "fixed") {
        totalFixed += allocatedAmount;
      } else {
        totalVariable += allocatedAmount;
      }

      // Category breakdown
      if (!categoryBreakdown[expense.category]) {
        categoryBreakdown[expense.category] = {
          fixed: 0,
          variable: 0,
          total: 0,
        };
      }

      categoryBreakdown[expense.category][expense.type] += allocatedAmount;
      categoryBreakdown[expense.category].total += allocatedAmount;

      detailedExpenses.push({
        ...expense.toObject(),
        allocatedAmount,
      });
    });

    // Group by type
    const typeBreakdown = await Expense.aggregate([
      {
        $match: {
          startDate: { $lte: endDate },
          $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
        },
      },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Group by category
    const categoryAggregation = await Expense.aggregate([
      {
        $match: {
          startDate: { $lte: endDate },
          $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
        },
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          type: { $first: "$type" },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
          days: diffDays,
          periodType: period,
        },
        summary: {
          totalFixed,
          totalVariable,
          grandTotal: totalFixed + totalVariable,
          fixedPercentage: (
            (totalFixed / (totalFixed + totalVariable)) *
            100
          ).toFixed(2),
          variablePercentage: (
            (totalVariable / (totalFixed + totalVariable)) *
            100
          ).toFixed(2),
        },
        typeBreakdown,
        categoryBreakdown: Object.entries(categoryBreakdown).map(
          ([category, amounts]) => ({
            category,
            ...amounts,
          })
        ),
        categoryAggregation,
        expenses: detailedExpenses,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get expense categories (unique list)
exports.getExpenseCategories = async (req, res) => {
  try {
    const categories = await Expense.distinct("category");

    res.json({
      success: true,
      data: categories.sort(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("recordedBy", "fullName");

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Calculate daily allocated amount
exports.calculateDailyExpenses = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];

    const expenses = await Expense.find({
      startDate: { $lte: targetDate },
      $or: [{ endDate: { $gte: targetDate } }, { endDate: null }],
    });

    let dailyTotal = 0;
    const breakdown = {};

    expenses.forEach((expense) => {
      let dailyAmount = 0;

      switch (expense.allocationPeriod) {
        case "daily":
          dailyAmount = expense.amount;
          break;
        case "weekly":
          dailyAmount = expense.amount / 7;
          break;
        case "bi-weekly":
          dailyAmount = expense.amount / 14;
          break;
        case "monthly":
          dailyAmount = expense.amount / 30;
          break;
      }

      dailyTotal += dailyAmount;

      if (!breakdown[expense.category]) {
        breakdown[expense.category] = 0;
      }
      breakdown[expense.category] += dailyAmount;
    });

    res.json({
      success: true,
      data: {
        date: targetDate,
        dailyTotal,
        breakdown,
        expenses: expenses.map((e) => ({
          ...e.toObject(),
          dailyAmount:
            e.allocationPeriod === "daily"
              ? e.amount
              : e.allocationPeriod === "weekly"
              ? e.amount / 7
              : e.allocationPeriod === "bi-weekly"
              ? e.amount / 14
              : e.amount / 30,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

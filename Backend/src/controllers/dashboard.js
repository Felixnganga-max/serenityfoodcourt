const { Sale, Expense, User } = require("../models/sales");

// Manager Dashboard - Full Access
exports.getManagerDashboard = async (req, res) => {
  try {
    const { period = "today" } = req.query;
    const dateFilter = getDateFilter(period);

    // Get all sales
    const sales = await Sale.find(dateFilter).populate(
      "recordedBy items.menuItem"
    );

    // Get expenses
    const expenses = await Expense.find(dateFilter);

    // Calculate totals
    const walkInSales = sales.filter((s) => s.type === "walk-in");
    const cateringSales = sales.filter((s) => s.type === "outside-catering");

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Staff performance
    const staffPerformance = await calculateStaffPerformance(sales, dateFilter);

    // Staff wages
    const shopAttendants = await User.countDocuments({
      role: "shop-attendant",
      isActive: true,
    });
    const staffWages = shopAttendants * 550; // KSh 550 per attendant per day

    const netProfit = totalRevenue - totalExpenses - staffWages;

    res.json({
      success: true,
      data: {
        totalRevenue,
        walkInSales: walkInSales.reduce((sum, s) => sum + s.totalAmount, 0),
        walkInCount: walkInSales.length,
        cateringSales: cateringSales.reduce((sum, s) => sum + s.totalAmount, 0),
        cateringRounds: cateringSales.length,
        totalExpenses,
        staffWages,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        staffPerformance,
        expenses: groupExpensesByCategory(expenses),
        outstandingCredits: await getOutstandingCredits(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Shop Attendant Dashboard
exports.getShopAttendantDashboard = async (req, res) => {
  try {
    const { period = "today" } = req.query;
    const dateFilter = getDateFilter(period);
    const userId = req.user._id;

    const sales = await Sale.find({
      ...dateFilter,
      recordedBy: userId,
      type: "walk-in",
    }).populate("items.menuItem");

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const averageSale = sales.length > 0 ? totalSales / sales.length : 0;

    // Payment methods breakdown
    const cashSales = sales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const mpesaSales = sales
      .filter((s) => s.paymentMethod === "mpesa")
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const splitSales = sales
      .filter((s) => s.paymentMethod === "split")
      .reduce((sum, s) => sum + s.totalAmount, 0);

    // Top items
    const itemCounts = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = {
            name: item.name,
            icon: item.menuItem?.icon,
            quantity: 0,
            total: 0,
          };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].total += item.total;
      });
    });

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        salesCount: sales.length,
        totalSales,
        averageSale,
        cashSales,
        mpesaSales,
        splitSales,
        topItems,
        dailyWage: 550,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Vendor Dashboard
exports.getVendorDashboard = async (req, res) => {
  try {
    const { period = "today" } = req.query;
    const dateFilter = getDateFilter(period);
    const userId = req.user._id;

    // Get all outside catering rounds
    const rounds = await OutsideCateringRound.find({
      ...dateFilter,
      recordedBy: userId,
    }).sort({ roundNumber: 1 });

    const grossSales = rounds.reduce((sum, r) => sum + r.expectedAmount, 0);
    const totalReturns = rounds.reduce((sum, r) => sum + r.returnsAmount, 0);
    const netSales = grossSales - totalReturns;
    const totalCommission = netSales * 0.19; // 19% commission

    // Credits
    const credits = await OutsideCateringCredit.find({
      ...dateFilter,
      recordedBy: userId,
    });

    const creditsGiven = credits
      .filter((c) => !c.isPaid)
      .reduce((sum, c) => sum + c.amount, 0);

    const creditsCollected = credits
      .filter((c) => c.isPaid)
      .reduce((sum, c) => sum + c.amount, 0);

    const outstandingCredits = credits
      .filter((c) => !c.isPaid)
      .map((c) => ({
        id: c._id,
        customerName: c.customerName,
        amount: c.amount,
        dueDate: c.dueDate,
        daysPastDue: Math.floor(
          (new Date() - new Date(c.dueDate)) / (1000 * 60 * 60 * 24)
        ),
      }));

    const totalOutstanding = outstandingCredits.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    res.json({
      success: true,
      data: {
        roundsCompleted: rounds.length,
        grossSales,
        totalReturns,
        netSales,
        totalCommission,
        rounds: rounds.map((r) => ({
          number: r.roundNumber,
          startTime: r.startTime,
          endTime: r.endTime,
          expected: r.expectedAmount,
          returns: r.returnsAmount,
          netTotal: r.netTotal,
          commission: r.netTotal * 0.19,
        })),
        creditsGiven,
        creditCount: credits.filter((c) => !c.isPaid).length,
        creditsCollected,
        collectionsCount: credits.filter((c) => c.isPaid).length,
        outstandingCredits,
        totalOutstanding,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper functions
function getDateFilter(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case "today":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  return { timestamp: { $gte: startDate } };
}

async function calculateStaffPerformance(sales, dateFilter) {
  const users = await User.find({ isActive: true, role: { $ne: "manager" } });

  return users.map((user) => {
    const userSales = sales.filter(
      (s) => s.recordedBy.toString() === user._id.toString()
    );
    const salesAmount = userSales.reduce((sum, s) => sum + s.totalAmount, 0);

    let earnings = 0;
    if (user.role === "shop-attendant") {
      earnings = 550; // Fixed daily wage
    } else if (user.role === "vendor") {
      const netSales = userSales
        .filter((s) => s.type === "outside-catering")
        .reduce((sum, s) => sum + s.totalAmount, 0);
      earnings = netSales * 0.19; // 19% commission
    }

    return {
      userId: user._id,
      name: user.fullName,
      role: user.role,
      salesAmount,
      transactions: userSales.length,
      rounds:
        user.role === "vendor"
          ? userSales.filter((s) => s.type === "outside-catering").length
          : 0,
      earnings,
    };
  });
}

function groupExpensesByCategory(expenses) {
  const grouped = {};
  expenses.forEach((exp) => {
    if (!grouped[exp.category]) {
      grouped[exp.category] = 0;
    }
    grouped[exp.category] += exp.amount;
  });

  return Object.entries(grouped).map(([category, amount]) => ({
    category,
    amount,
  }));
}

async function getOutstandingCredits() {
  const credits = await OutsideCateringCredit.find({ isPaid: false });
  return credits.map((c) => ({
    id: c._id,
    customerName: c.customerName,
    amount: c.amount,
    dueDate: c.dueDate,
  }));
}

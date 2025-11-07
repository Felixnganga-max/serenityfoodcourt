const { Sale, MenuItem, User } = require("../models/sales");

// Create new sale
exports.createSale = async (req, res) => {
  try {
    const saleData = {
      ...req.body,
      recordedBy: req.user.id,
      date: new Date().toISOString().split("T")[0],
    };

    // Validate sale type based on user role
    if (req.user.role === "shop-attendant" && saleData.type !== "walk-in") {
      return res.status(403).json({
        success: false,
        error: "Shop attendants can only create walk-in sales",
      });
    }

    if (
      req.user.role === "vendor" &&
      saleData.type !== "outside-catering" &&
      saleData.type !== "credit-collection"
    ) {
      return res.status(403).json({
        success: false,
        error: "Vendors can only create catering sales",
      });
    }

    // Validate split payment if method is "split"
    if (saleData.paymentMethod === "split") {
      const { mpesa = 0, cash = 0 } = saleData.splitPayment || {};
      const splitTotal = mpesa + cash;

      if (Math.abs(splitTotal - saleData.totalAmount) > 0.01) {
        return res.status(400).json({
          success: false,
          error: `Split payment amounts (${splitTotal}) don't match total (${saleData.totalAmount})`,
        });
      }
    }

    const sale = new Sale(saleData);
    await sale.save();
    await sale.populate("recordedBy", "fullName username");

    res.status(201).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all sales with role-based filtering
exports.getSales = async (req, res) => {
  try {
    const { date, type, startDate, endDate } = req.query;
    const today = new Date().toISOString().split("T")[0];

    let filter = {};

    // Role-based filtering
    if (req.user.role !== "manager") {
      // Non-managers can only see their own sales for today
      filter.recordedBy = req.user.id;
      filter.date = today;

      // Check if they have temporary access to see other sales
      if (!req.canViewOthers) {
        filter.date = today;
      }
    } else {
      // Manager can see all sales with date filters
      if (date) {
        filter.date = date;
      }

      if (startDate && endDate) {
        filter.date = { $gte: startDate, $lte: endDate };
      }
    }

    // Type filtering (for managers)
    if (type && req.user.role === "manager") {
      filter.type = type;
    } else if (req.user.role === "shop-attendant") {
      filter.type = "walk-in";
    } else if (req.user.role === "vendor") {
      filter.type = { $in: ["outside-catering", "credit-collection"] };
    }

    const sales = await Sale.find(filter)
      .populate("recordedBy", "fullName username")
      .populate("items.menuItem")
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: sales,
      count: sales.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get sales summary for dashboard
exports.getSalesSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().split("T")[0];

    let matchFilter = { date: today, isPaid: true };

    // Role-based filtering
    if (req.user.role === "shop-attendant") {
      matchFilter.recordedBy = req.user.id;
      matchFilter.type = "walk-in";
    } else if (req.user.role === "vendor") {
      matchFilter.recordedBy = req.user.id;
      matchFilter.type = { $in: ["outside-catering", "credit-collection"] };
    }

    const todaySales = await Sale.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Enhanced payment methods aggregation
    const paymentMethods = await Sale.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          regularPayments: [
            { $match: { paymentMethod: { $in: ["mpesa", "cash"] } } },
            {
              $group: {
                _id: "$paymentMethod",
                totalAmount: { $sum: "$totalAmount" },
                count: { $sum: 1 },
              },
            },
          ],
          splitPayments: [
            { $match: { paymentMethod: "split" } },
            {
              $group: {
                _id: null,
                mpesaTotal: { $sum: "$splitPayment.mpesa" },
                cashTotal: { $sum: "$splitPayment.cash" },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          combined: {
            $concatArrays: [
              "$regularPayments",
              {
                $cond: [
                  { $gt: [{ $size: "$splitPayments" }, 0] },
                  [
                    {
                      _id: "mpesa",
                      totalAmount: {
                        $add: [
                          {
                            $ifNull: [
                              {
                                $arrayElemAt: [
                                  "$regularPayments.totalAmount",
                                  {
                                    $indexOfArray: [
                                      "$regularPayments._id",
                                      "mpesa",
                                    ],
                                  },
                                ],
                              },
                              0,
                            ],
                          },
                          { $arrayElemAt: ["$splitPayments.mpesaTotal", 0] },
                        ],
                      },
                      count: {
                        $add: [
                          {
                            $ifNull: [
                              {
                                $arrayElemAt: [
                                  "$regularPayments.count",
                                  {
                                    $indexOfArray: [
                                      "$regularPayments._id",
                                      "mpesa",
                                    ],
                                  },
                                ],
                              },
                              0,
                            ],
                          },
                          { $arrayElemAt: ["$splitPayments.count", 0] },
                        ],
                      },
                    },
                    {
                      _id: "cash",
                      totalAmount: {
                        $add: [
                          {
                            $ifNull: [
                              {
                                $arrayElemAt: [
                                  "$regularPayments.totalAmount",
                                  {
                                    $indexOfArray: [
                                      "$regularPayments._id",
                                      "cash",
                                    ],
                                  },
                                ],
                              },
                              0,
                            ],
                          },
                          { $arrayElemAt: ["$splitPayments.cashTotal", 0] },
                        ],
                      },
                      count: {
                        $add: [
                          {
                            $ifNull: [
                              {
                                $arrayElemAt: [
                                  "$regularPayments.count",
                                  {
                                    $indexOfArray: [
                                      "$regularPayments._id",
                                      "cash",
                                    ],
                                  },
                                ],
                              },
                              0,
                            ],
                          },
                          { $arrayElemAt: ["$splitPayments.count", 0] },
                        ],
                      },
                    },
                  ],
                  "$regularPayments",
                ],
              },
            ],
          },
        },
      },
      { $unwind: "$combined" },
      { $replaceRoot: { newRoot: "$combined" } },
      {
        $group: {
          _id: "$_id",
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: "$count" },
        },
      },
    ]);

    // Get user's personal stats
    const userStats = await Sale.aggregate([
      { $match: { date: today, isPaid: true, recordedBy: req.user.id } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        todaySales,
        paymentMethods,
        userStats: userStats[0] || { totalAmount: 0, count: 0 },
        date: today,
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get sales reports with item analysis (Manager only or with enhanced access)
exports.getSalesReport = async (req, res) => {
  try {
    const { date, startDate, endDate, rawMaterialGroup } = req.query;
    let reportDate;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = { date: { $gte: startDate, $lte: endDate } };
      reportDate = `${startDate} to ${endDate}`;
    } else {
      reportDate = date || new Date().toISOString().split("T")[0];
      dateFilter = { date: reportDate };
    }

    // Role-based filtering
    if (req.user.role !== "manager" && !req.canViewOthers) {
      dateFilter.recordedBy = req.user.id;
    }

    const sales = await Sale.find(dateFilter)
      .populate("items.menuItem")
      .populate("recordedBy", "fullName username");

    // Item analysis with raw material grouping
    const itemAnalysis = {};
    const rawMaterialAnalysis = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        // Individual item analysis
        if (!itemAnalysis[item.name]) {
          itemAnalysis[item.name] = {
            name: item.name,
            totalQuantity: 0,
            walkInQty: 0,
            cateringQty: 0,
            totalRevenue: 0,
            rawMaterialGroup: item.menuItem?.rawMaterialGroup,
          };
        }

        itemAnalysis[item.name].totalQuantity += item.quantity;
        itemAnalysis[item.name].totalRevenue += item.total;

        if (sale.type === "walk-in") {
          itemAnalysis[item.name].walkInQty += item.quantity;
        } else {
          itemAnalysis[item.name].cateringQty += item.quantity;
        }

        // Raw material group analysis
        if (item.menuItem?.rawMaterialGroup) {
          const groupId = item.menuItem.rawMaterialGroup._id.toString();
          const groupName = item.menuItem.rawMaterialGroup.name;

          if (!rawMaterialAnalysis[groupId]) {
            rawMaterialAnalysis[groupId] = {
              name: groupName,
              totalQuantity: 0,
              totalRevenue: 0,
              items: [],
            };
          }

          rawMaterialAnalysis[groupId].totalQuantity += item.quantity;
          rawMaterialAnalysis[groupId].totalRevenue += item.total;

          if (
            !rawMaterialAnalysis[groupId].items.find((i) => i === item.name)
          ) {
            rawMaterialAnalysis[groupId].items.push(item.name);
          }
        }
      });
    });

    const itemsArray = Object.values(itemAnalysis).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    const rawMaterialArray = Object.values(rawMaterialAnalysis).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    // Filter by raw material group if specified
    let filteredItems = itemsArray;
    if (rawMaterialGroup) {
      filteredItems = itemsArray.filter(
        (item) =>
          item.rawMaterialGroup?._id.toString() === rawMaterialGroup.toString()
      );
    }

    // Payment breakdown including split payments
    const paymentBreakdown = {
      mpesa: 0,
      cash: 0,
      credit: 0,
    };

    sales.forEach((sale) => {
      if (sale.paymentMethod === "split") {
        paymentBreakdown.mpesa += sale.splitPayment?.mpesa || 0;
        paymentBreakdown.cash += sale.splitPayment?.cash || 0;
      } else if (sale.paymentMethod === "mpesa") {
        paymentBreakdown.mpesa += sale.totalAmount;
      } else if (sale.paymentMethod === "cash") {
        paymentBreakdown.cash += sale.totalAmount;
      } else if (sale.paymentMethod === "credit") {
        paymentBreakdown.credit += sale.totalAmount;
      }
    });

    res.json({
      success: true,
      data: {
        date: reportDate,
        totalSales: sales.length,
        itemsAnalysis: filteredItems,
        rawMaterialAnalysis: rawMaterialArray,
        paymentBreakdown,
        walkInSales: sales.filter((s) => s.type === "walk-in"),
        cateringSales: sales.filter((s) => s.type === "outside-catering"),
        summary: {
          walkInTotal: sales
            .filter((s) => s.type === "walk-in")
            .reduce((sum, s) => sum + s.totalAmount, 0),
          cateringPaid: sales
            .filter((s) => s.type === "outside-catering" && s.isPaid)
            .reduce((sum, s) => sum + s.totalAmount, 0),
          cateringPending: sales
            .filter((s) => s.type === "outside-catering" && !s.isPaid)
            .reduce((sum, s) => sum + s.totalAmount, 0),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get profit analysis (Manager only)
exports.getProfitAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, period = "daily" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "startDate and endDate are required",
      });
    }

    // Get sales data
    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate },
      isPaid: true,
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Get expenses for the period
    const { Expense } = require("../models");

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const expenses = await Expense.find({
      startDate: { $lte: endDate },
      $or: [{ endDate: { $gte: startDate } }, { endDate: null }],
    });

    let totalExpenses = 0;

    expenses.forEach((expense) => {
      let allocatedAmount = 0;

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

      totalExpenses += allocatedAmount;
    });

    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
          days: diffDays,
        },
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit,
        profitMargin: profitMargin.toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


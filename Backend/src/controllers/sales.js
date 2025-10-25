const Sale = require("../models/sales");

// Create new sale
exports.createSale = async (req, res) => {
  try {
    const saleData = {
      ...req.body,
      date: new Date().toISOString().split("T")[0],
    };

    // Validate split payment if method is "split"
    if (saleData.paymentMethod === "split") {
      const { mpesa = 0, cash = 0 } = saleData.splitPayment || {};
      const splitTotal = mpesa + cash;

      // Allow small rounding differences (0.01)
      if (Math.abs(splitTotal - saleData.totalAmount) > 0.01) {
        return res.status(400).json({
          success: false,
          error: `Split payment amounts (${splitTotal}) don't match total (${saleData.totalAmount})`,
        });
      }
    }

    const sale = new Sale(saleData);
    await sale.save();

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

// Get all sales with optional date filter
exports.getSales = async (req, res) => {
  try {
    const { date, type, startDate, endDate } = req.query;
    let filter = {};

    if (date) {
      filter.date = date;
    }

    if (type) {
      filter.type = type;
    }

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const sales = await Sale.find(filter).sort({ timestamp: -1 });

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
    const today = new Date().toISOString().split("T")[0];

    const todaySales = await Sale.aggregate([
      { $match: { date: today, isPaid: true } },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Enhanced payment methods aggregation to handle split payments
    const paymentMethods = await Sale.aggregate([
      { $match: { date: today, isPaid: true } },
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

    res.json({
      success: true,
      data: {
        todaySales,
        paymentMethods,
        date: today,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get sales reports with item analysis
exports.getSalesReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split("T")[0];

    const sales = await Sale.find({ date: reportDate });

    // Item analysis
    const itemAnalysis = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!itemAnalysis[item.name]) {
          itemAnalysis[item.name] = {
            name: item.name,
            totalQuantity: 0,
            walkInQty: 0,
            cateringQty: 0,
            totalRevenue: 0,
          };
        }

        itemAnalysis[item.name].totalQuantity += item.quantity;
        itemAnalysis[item.name].totalRevenue += item.total;

        if (sale.type === "walk-in") {
          itemAnalysis[item.name].walkInQty += item.quantity;
        } else {
          itemAnalysis[item.name].cateringQty += item.quantity;
        }
      });
    });

    const itemsArray = Object.values(itemAnalysis).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    // Potato-based items analysis
    const potatoItems = itemsArray.filter(
      (item) =>
        item.name.toLowerCase().includes("chips") ||
        item.name.toLowerCase().includes("bhajia")
    );

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
        itemsAnalysis: itemsArray,
        potatoAnalysis: potatoItems,
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

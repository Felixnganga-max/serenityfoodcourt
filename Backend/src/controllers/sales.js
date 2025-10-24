const Sale = require("../models/sales");

// Create new sale
exports.createSale = async (req, res) => {
  try {
    const saleData = {
      ...req.body,
      date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD
    };

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

    const paymentMethods = await Sale.aggregate([
      { $match: { date: today, isPaid: true } },
      {
        $group: {
          _id: "$paymentMethod",
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
    const { date, reportType } = req.query;
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

    res.json({
      success: true,
      data: {
        date: reportDate,
        totalSales: sales.length,
        itemsAnalysis: itemsArray,
        potatoAnalysis: potatoItems,
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

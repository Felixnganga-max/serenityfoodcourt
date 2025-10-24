const Credit = require("../models/credit");
const Sale = require("../models/sales");

// Get all outstanding credits
exports.getCredits = async (req, res) => {
  try {
    const credits = await Credit.find({ status: "pending" }).sort({
      date: 1,
      timestamp: 1,
    });

    res.json({
      success: true,
      data: credits,
      totalOutstanding: credits.reduce((sum, credit) => sum + credit.amount, 0),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Collect credit payment
exports.collectCredit = async (req, res) => {
  try {
    const { creditId } = req.params;
    const { paymentMethod, mpesaCode } = req.body;

    const credit = await Credit.findById(creditId);
    if (!credit) {
      return res.status(404).json({
        success: false,
        error: "Credit not found",
      });
    }

    // Create sale record for the collection
    const sale = new Sale({
      type: "credit-collection",
      customerName: credit.customerName,
      items: credit.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      totalAmount: credit.amount,
      paymentMethod: paymentMethod,
      mpesaCode: paymentMethod === "mpesa" ? mpesaCode : undefined,
      isPaid: true,
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date(),
    });

    await sale.save();

    // Update credit status
    credit.status = "collected";
    credit.collectedAt = new Date();
    credit.collectionMethod = paymentMethod;
    credit.collectionMpesaCode =
      paymentMethod === "mpesa" ? mpesaCode : undefined;
    await credit.save();

    res.json({
      success: true,
      data: {
        credit,
        sale,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get credits by date range
exports.getCreditsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: "pending" };

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const credits = await Credit.find(filter).sort({ date: 1 });

    // Group by date
    const creditsByDate = {};
    credits.forEach((credit) => {
      if (!creditsByDate[credit.date]) {
        creditsByDate[credit.date] = [];
      }
      creditsByDate[credit.date].push(credit);
    });

    res.json({
      success: true,
      data: creditsByDate,
      totalOutstanding: credits.reduce((sum, credit) => sum + credit.amount, 0),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const Inventory = require("../models/inventory");

// Get all inventory items
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ category: 1, itemName: 1 });

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create or update inventory item
exports.updateInventory = async (req, res) => {
  try {
    const { itemName } = req.params;
    const updateData = req.body;

    const inventory = await Inventory.findOneAndUpdate(
      { itemName },
      { ...updateData, lastRestocked: new Date() },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get low stock alerts
exports.getLowStock = async (req, res) => {
  try {
    const lowStock = await Inventory.find({
      currentStock: { $lte: "$lowStockAlert" },
    });

    res.json({
      success: true,
      data: lowStock,
      count: lowStock.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

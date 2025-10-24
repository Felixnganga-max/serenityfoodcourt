const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["breakfast", "snacks", "drinks", "ingredients"],
  },
  currentStock: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  lowStockAlert: {
    type: Number,
    default: 10,
  },
  lastRestocked: Date,
});

module.exports = mongoose.model("Inventory", inventorySchema);

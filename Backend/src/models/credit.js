const mongoose = require("mongoose");

const creditSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  originalSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sale",
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "collected"],
    default: "pending",
  },
  collectedAt: Date,
  collectionMethod: String,
  collectionMpesaCode: String,
});

creditSchema.index({ date: 1, status: 1 });
creditSchema.index({ customerName: 1 });

module.exports = mongoose.model("Credit", creditSchema);

const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["walk-in", "outside-catering", "credit-collection"],
  },
  customerName: {
    type: String,
    required: function () {
      return (
        this.type === "outside-catering" || this.type === "credit-collection"
      );
    },
  },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
      total: Number,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["mpesa", "cash", "credit", "split"], // Added "split"
  },
  // New field for split payment details
  splitPayment: {
    mpesa: {
      type: Number,
      default: 0,
    },
    cash: {
      type: Number,
      default: 0,
    },
  },
  isPaid: {
    type: Boolean,
    default: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: String,
    required: true,
  },
  vendorName: String,
  returnedItems: [
    {
      item: String,
      quantity: Number,
      reason: String,
    },
  ],
});

// Create index for better query performance
saleSchema.index({ date: 1, type: 1 });
saleSchema.index({ timestamp: 1 });

module.exports = mongoose.model("Sale", saleSchema);

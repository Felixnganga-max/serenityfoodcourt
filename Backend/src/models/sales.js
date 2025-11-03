const mongoose = require("mongoose");

// =============================================
// USER SCHEMA - For Authentication
// =============================================
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["manager", "shop-attendant", "vendor"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // For temporary role assignments
  temporaryAccess: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      startDate: Date,
      endDate: Date,
      reason: String,
    },
  ],
});

userSchema.index({ username: 1 });
userSchema.index({ role: 1, isActive: 1 });

// =============================================
// MENU CATEGORY SCHEMA
// =============================================
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  icon: String,
  description: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// =============================================
// RAW MATERIAL GROUP SCHEMA
// =============================================
const rawMaterialGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// =============================================
// MENU ITEM SCHEMA
// =============================================
const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  rawMaterialGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RawMaterialGroup",
  },
  icon: String,
  description: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  priceHistory: [
    {
      price: Number,
      changedAt: Date,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

menuItemSchema.index({ isActive: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ rawMaterialGroup: 1 });

// =============================================
// UPDATED SALE SCHEMA
// =============================================
const saleSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["walk-in", "outside-catering", "credit-collection"],
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
      },
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
    enum: ["mpesa", "cash", "credit", "split"],
  },
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
  mpesaCode: String,
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

saleSchema.index({ date: 1, type: 1 });
saleSchema.index({ timestamp: 1 });
saleSchema.index({ recordedBy: 1, date: 1 });

// =============================================
// EXPENSE SCHEMA
// =============================================
const expenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    required: true,
    enum: ["fixed", "variable"],
  },
  category: {
    type: String,
    required: true,
    // Examples: wages, rent, electricity, water, supplies, repairs, etc.
  },
  allocationPeriod: {
    type: String,
    required: true,
    enum: ["daily", "weekly", "bi-weekly", "monthly"],
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: String, // Optional for recurring expenses
  description: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

expenseSchema.index({ startDate: 1, allocationPeriod: 1 });
expenseSchema.index({ type: 1 });
expenseSchema.index({ recordedBy: 1 });

// =============================================
// EXPORTS
// =============================================
module.exports = {
  User: mongoose.model("User", userSchema),
  Category: mongoose.model("Category", categorySchema),
  RawMaterialGroup: mongoose.model("RawMaterialGroup", rawMaterialGroupSchema),
  MenuItem: mongoose.model("MenuItem", menuItemSchema),
  Sale: mongoose.model("Sale", saleSchema),
  Expense: mongoose.model("Expense", expenseSchema),
};

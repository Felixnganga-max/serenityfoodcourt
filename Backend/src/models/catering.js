const mongoose = require("mongoose");

// =============================================
// OUTSIDE CATERING ROUND SCHEMA
// =============================================
const outsideCateringRoundSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  roundNumber: {
    type: Number,
    required: true,
  },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
      },
      name: String,
      icon: String,
      price: Number,
      quantity: Number,
      total: Number,
    },
  ],
  returns: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
      },
      name: String,
      icon: String,
      price: Number,
      quantity: Number,
      total: Number,
    },
  ],
  expectedAmount: {
    type: Number,
    required: true,
  },
  returnsAmount: {
    type: Number,
    default: 0,
  },
  netTotal: {
    type: Number,
    required: true,
  },
  vendorCommission: {
    type: Number,
    default: 0, // 19% of netTotal
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["in-progress", "completed"],
    default: "completed",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// =============================================
// OUTSIDE CATERING CREDIT SCHEMA
// =============================================
const outsideCateringCreditSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: String,
    required: true,
  },
  dueDate: {
    type: String,
    required: true,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidDate: {
    type: String,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "mpesa"],
  },
  daysPastDue: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue", "vendor-deducted"],
    default: "pending",
  },
  notes: String,
  remindersSent: {
    type: Number,
    default: 0,
  },
  lastReminderDate: String,
  deductedFromVendor: {
    type: Boolean,
    default: false,
  },
  deductedDate: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// =============================================
// OUTSIDE CATERING DAY SUMMARY SCHEMA
// =============================================
const outsideCateringDaySummarySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String,
    required: true,
    unique: true,
  },
  totalRounds: {
    type: Number,
    required: true,
  },
  rounds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OutsideCateringRound",
    },
  ],
  totalExpected: {
    type: Number,
    required: true,
  },
  totalReturns: {
    type: Number,
    default: 0,
  },
  creditsGiven: {
    type: Number,
    default: 0,
  },
  creditsCollected: {
    type: Number,
    default: 0,
  },
  netTotal: {
    type: Number,
    required: true,
  },
  cashCollected: {
    type: Number,
    default: 0,
  },
  mpesaCollected: {
    type: Number,
    default: 0,
  },
  totalCollected: {
    type: Number,
    required: true,
  },
  difference: {
    type: Number,
    default: 0,
  },
  vendorCommission: {
    type: Number,
    default: 0, // 19% of netTotal
  },
  status: {
    type: String,
    enum: ["in-progress", "completed", "reconciled"],
    default: "completed",
  },
  reconciliationNotes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    required: true,
  },
});

// =============================================
// INDEXES
// =============================================
outsideCateringRoundSchema.index({ vendorId: 1, date: 1 });
outsideCateringRoundSchema.index({ date: 1, status: 1 });

outsideCateringCreditSchema.index({ vendorId: 1, date: 1 });
outsideCateringCreditSchema.index({ status: 1, dueDate: 1 });
outsideCateringCreditSchema.index({ isPaid: 1 });
outsideCateringCreditSchema.index({ customerPhone: 1 });

outsideCateringDaySummarySchema.index({ vendorId: 1, date: 1 });
outsideCateringDaySummarySchema.index({ date: 1, status: 1 });

// =============================================
// EXPORTS
// =============================================
module.exports = {
  OutsideCateringRound: mongoose.model(
    "OutsideCateringRound",
    outsideCateringRoundSchema
  ),
  OutsideCateringCredit: mongoose.model(
    "OutsideCateringCredit",
    outsideCateringCreditSchema
  ),
  OutsideCateringDaySummary: mongoose.model(
    "OutsideCateringDaySummary",
    outsideCateringDaySummarySchema
  ),
};

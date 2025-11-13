// cafeRoutes.js - Updated to include everything
const express = require("express");
const router = express.Router();

// Import controllers
const authController = require("../controllers/auth");
const menuController = require("../controllers/menu");
const expenseController = require("../controllers/expenses");
const salesController = require("../controllers/sales");
const dashboardController = require("../controllers/dashboard");
const cateringController = require("../controllers/catering");

// =============================================
// AUTHENTICATION ROUTES
// =============================================
router.post("/auth/login", authController.login);
router.get(
  "/auth/me",
  authController.authenticate,
  authController.getCurrentUser
);

// User management (Manager only)
router.post(
  "/auth/register",
  authController.authenticate,
  authController.authorize("manager"),
  authController.register
);
router.get(
  "/users",
  authController.authenticate,
  authController.authorize("manager"),
  authController.getAllUsers
);
router.patch(
  "/users/:userId/status",
  authController.authenticate,
  authController.authorize("manager"),
  authController.updateUserStatus
);

// Temporary access management (Manager only)
router.post(
  "/users/temporary-access",
  authController.authenticate,
  authController.authorize("manager"),
  authController.assignTemporaryAccess
);
router.delete(
  "/users/:coveringUserId/temporary-access/:accessId",
  authController.authenticate,
  authController.authorize("manager"),
  authController.removeTemporaryAccess
);

// =============================================
// CATEGORY ROUTES
// =============================================
router.post(
  "/categories",
  authController.authenticate,
  authController.authorize("manager"),
  menuController.createCategory
);
router.get(
  "/categories",
  authController.authenticate,
  menuController.getCategories
);
router.patch(
  "/categories/:id",
  authController.authenticate,
  authController.authorize("manager"),
  menuController.updateCategory
);

// =============================================
// RAW MATERIAL GROUP ROUTES
// =============================================
router.post(
  "/raw-material-groups",
  authController.authenticate,
  authController.authorize("manager"),
  menuController.createRawMaterialGroup
);
router.get(
  "/raw-material-groups",
  authController.authenticate,
  menuController.getRawMaterialGroups
);
router.patch(
  "/raw-material-groups/:id",
  authController.authenticate,
  authController.authorize("manager"),
  menuController.updateRawMaterialGroup
);

// =============================================
// MENU ITEM ROUTES
// =============================================
router.post(
  "/menu-items",
  authController.authenticate,
  authController.authorize("manager"),
  menuController.createMenuItem
);
router.get(
  "/menu-items",
  authController.authenticate,
  menuController.getMenuItems
);
router.get(
  "/menu-items/by-category",
  authController.authenticate,
  menuController.getMenuByCategory
);
router.get(
  "/menu-items/:id",
  authController.authenticate,
  menuController.getMenuItem
);
router.patch(
  "/menu-items/:id",
  authController.authenticate,
  authController.authorize("manager"),
  menuController.updateMenuItem
);
router.delete(
  "/menu-items/:id",
  authController.authenticate,
  authController.authorize("manager"),
  menuController.deleteMenuItem
);

// =============================================
// EXPENSE ROUTES (Manager only)
// =============================================
router.post(
  "/expenses",
  authController.authenticate,
  authController.authorize("manager"),
  expenseController.createExpense
);
router.get(
  "/expenses",
  authController.authenticate,
  authController.authorize("manager"),
  expenseController.getExpenses
);
router.get(
  "/expenses/summary",
  authController.authenticate,
  authController.authorize("manager"),
  expenseController.getExpenseSummary
);
router.get(
  "/expenses/categories",
  authController.authenticate,
  authController.authorize("manager"),
  expenseController.getExpenseCategories
);
router.get(
  "/expenses/daily",
  authController.authenticate,
  authController.authorize("manager"),
  expenseController.calculateDailyExpenses
);
router.patch(
  "/expenses/:id",
  authController.authenticate,
  authController.authorize("manager"),
  expenseController.updateExpense
);
router.delete(
  "/expenses/:id",
  authController.authenticate,
  authController.authorize("manager"),
  expenseController.deleteExpense
);

// =============================================
// SALES ROUTES
// =============================================
router.post(
  "/sales/create-sale",
  authController.authenticate,
  salesController.createSale
);
router.get(
  "/sales",
  authController.authenticate,
  authController.canViewSales,
  salesController.getSales
);
router.get(
  "/sales/summary",
  authController.authenticate,
  salesController.getSalesSummary
);
router.get(
  "/sales/report",
  authController.authenticate,
  authController.canViewSales,
  salesController.getSalesReport
);
router.get(
  "/sales/profit-analysis",
  authController.authenticate,
  authController.authorize("manager"),
  salesController.getProfitAnalysis
);

// =============================================
// DASHBOARD ROUTES
// =============================================
router.get(
  "/dashboard/manager",
  authController.authenticate,
  authController.authorize("manager"),
  dashboardController.getManagerDashboard
);
router.get(
  "/dashboard/shop-attendant",
  authController.authenticate,
  authController.authorize("shop-attendant"),
  dashboardController.getShopAttendantDashboard
);
router.get(
  "/dashboard/vendor",
  authController.authenticate,
  authController.authorize("vendor"),
  dashboardController.getVendorDashboard
);

// =============================================
// OUTSIDE CATERING ROUTES (Vendor)
// =============================================

// Round management
router.post(
  "/outside-catering/rounds/start",
  authController.authenticate,
  cateringController.startRound
);
router.get(
  "/outside-catering/rounds",
  authController.authenticate,
  cateringController.getRounds
);
router.get(
  "/outside-catering/rounds/in-progress",
  authController.authenticate,
  cateringController.getInProgressRound
);
router.put(
  "/outside-catering/rounds/:roundId/complete",
  authController.authenticate,
  cateringController.completeRound
);

// Day summary
router.post(
  "/outside-catering/day-summary",
  authController.authenticate,
  cateringController.createDaySummary
);
router.get(
  "/outside-catering/summaries",
  authController.authenticate,
  cateringController.getDaySummaries
);

// Credits management
router.post(
  "/outside-catering/credits",
  authController.authenticate,
  cateringController.createCredit
);
router.get(
  "/outside-catering/credits",
  authController.authenticate,
  cateringController.getCredits
);
router.put(
  "/outside-catering/credits/:creditId/collect",
  authController.authenticate,
  cateringController.collectCredit
);
router.put(
  "/outside-catering/credits/:creditId",
  authController.authenticate,
  cateringController.updateCredit
);
router.delete(
  "/outside-catering/credits/:creditId",
  authController.authenticate,
  cateringController.deleteCredit
);
router.post(
  "/outside-catering/credits/send-reminders",
  authController.authenticate,
  cateringController.sendCreditReminders
);

// Dashboard & analytics
router.get(
  "/outside-catering/dashboard",
  authController.authenticate,
  cateringController.getDashboardStats
);
router.get(
  "/outside-catering/performance",
  authController.authenticate,
  cateringController.getVendorPerformance
);

module.exports = router;

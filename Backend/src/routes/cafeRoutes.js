const express = require("express");
const router = express.Router();

// Import controllers
const authController = require("../controllers/auth");
const menuController = require("../controllers/menu");
const expenseController = require("../controllers/expenses");
const salesController = require("../controllers/sales");

// Remove this line - we'll use authController directly
// const { authenticate, authorize, canViewSales } = require("../middleware/Auth");

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
// CATEGORY ROUTES (Manager only for CUD)
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
// RAW MATERIAL GROUP ROUTES (Manager only for CUD)
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
router.post("/sales", authController.authenticate, salesController.createSale);

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

module.exports = router;

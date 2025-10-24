const express = require("express");
const router = express.Router();
const {
  createSale,
  getSales,
  getSalesSummary,
  getSalesReport,
} = require("../controllers/sales");
// const { authenticate } = require("../middleware/auth");

// router.use(authenticate);

router.post("/create-sale", createSale);
router.get("/get-sales", getSales);
router.get("/summary", getSalesSummary);
router.get("/report", getSalesReport);

module.exports = router;

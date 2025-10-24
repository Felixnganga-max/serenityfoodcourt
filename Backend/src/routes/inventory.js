const express = require("express");
const router = express.Router();
const {
  getInventory,
  updateInventory,
  getLowStock,
} = require("../controllers/inventory");
// const { authenticate } = require("../middleware/auth");

// router.use(authenticate);

router.get("/", getInventory);
router.get("/low-stock", getLowStock);
router.put("/:itemName", updateInventory);

module.exports = router;

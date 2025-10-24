const express = require("express");
const router = express.Router();
const {
  getCredits,
  collectCredit,
  getCreditsByDate,
} = require("../controllers/credits");
// const { authenticate } = require("../middleware/auth");

// router.use(authenticate);

router.get("/", getCredits);
router.get("/by-date", getCreditsByDate);
router.post("/:creditId/collect", collectCredit);

module.exports = router;

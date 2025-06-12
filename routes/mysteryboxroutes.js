const express = require("express");
const router = express.Router();
const mysteryBoxController = require("../controllers/mysteryboxcontroller");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/mystery-box/options", mysteryBoxController.getOptions);

router.post(
  "/mystery-box/add-to-cart",
  verifyToken,
  mysteryBoxController.addToCart
);

module.exports = router;

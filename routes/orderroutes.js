const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

router.use(verifyToken);

router.post("/orders", orderController.createOrder);

router.put(
  "/orders/:orderCode/payment",
  upload.single("transferProof"),
  orderController.uploadPaymentProof
);

module.exports = router;

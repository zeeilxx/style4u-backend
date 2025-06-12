const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// --- USER ROUTES ---
router.get("/orders", verifyToken, orderController.getUserOrders);
router.post("/orders", verifyToken, orderController.createOrder);
router.delete("/orders/:orderId", verifyToken, orderController.cancelOrder);
router.put(
  "/orders/:orderCode/payment",
  verifyToken,
  upload.single("transferProof"),
  orderController.uploadPaymentProof
);

// --- ADMIN ROUTES ---
router.get("/admin/orders", verifyToken, orderController.getAllOrders);
router.get(
  "/admin/orders/pending",
  verifyToken,
  orderController.getPendingOrders
);
router.put(
  "/admin/orders/:orderId/status",
  verifyToken,
  orderController.updateOrderStatus
);

module.exports = router;

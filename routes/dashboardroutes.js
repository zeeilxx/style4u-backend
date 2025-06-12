const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardcontroller");
const { verifyToken } = require("../middleware/authMiddleware");

// router.use(verifyToken);

router.get("/dashboard/stats", verifyToken, dashboardController.getDashboardStats);

module.exports = router;

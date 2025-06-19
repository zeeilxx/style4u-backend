const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Gunakan isAdmin untuk rute yang hanya boleh diakses admin
router.post(
  "/register/admin",
  [verifyToken, isAdmin],
  adminController.registerAdmin
);
router.get("/admins", [verifyToken, isAdmin], adminController.getAllAdmins);
router.get("/users", [verifyToken, isAdmin], adminController.getAllUsers); // Ganti nama rute agar lebih jelas
router.delete("/user/:id", [verifyToken, isAdmin], adminController.deleteUser);

module.exports = router;

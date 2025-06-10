// routes/addressRoutes.js (FILE BARU)

const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { verifyToken } = require("../middleware/authMiddleware");

// Semua rute di bawah ini akan dilindungi oleh token
router.use(verifyToken);

// GET semua alamat milik user
router.get("/addresses/:id_user", addressController.getAllAddresses);

// POST alamat baru untuk user
router.post("/addresses/:id_user", addressController.addAddress);

// PUT (update) alamat spesifik
router.put("/addresses/:id_address", addressController.updateAddress);

// DELETE alamat spesifik
router.delete("/addresses/:id_address", addressController.deleteAddress);

module.exports = router;

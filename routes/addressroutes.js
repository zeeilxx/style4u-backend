// routes/addressRoutes.js (FILE BARU)

const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { verifyToken } = require("../middleware/authMiddleware");

// router.use(verifyToken);
router.get("/addresses/:id_user", verifyToken, addressController.getAllAddresses);
router.post("/addresses/:id_user", verifyToken, addressController.addAddress);
router.put("/addresses/:id_address", verifyToken, addressController.updateAddress);
router.delete("/addresses/:id_address", verifyToken, addressController.deleteAddress);

module.exports = router;

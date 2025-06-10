// routes/wishlistRoutes.js

const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const { verifyToken } = require("../middleware/authMiddleware");

// Semua rute di bawah ini akan diverifikasi tokennya terlebih dahulu
router.use(verifyToken);

// GET /api/wishlist/:id_user
router.get("/wishlist/:id_user", wishlistController.getWishlist);

// POST /api/wishlist/:id_user/add
router.post("/wishlist/:id_user/add", wishlistController.addToWishlist);

// DELETE /api/wishlist/:id_user/remove
router.delete(
  "/wishlist/:id_user/remove",
  wishlistController.removeFromWishlist
);

module.exports = router;

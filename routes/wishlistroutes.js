const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const { verifyToken } = require("../middleware/authMiddleware");

// router.use(verifyToken);
router.get("/wishlist/:id_user", verifyToken, wishlistController.getWishlist);
router.post(
  "/wishlist/:id_user/add",
  verifyToken,
  wishlistController.addToWishlist
);
router.delete(
  "/wishlist/:id_user/remove",
  verifyToken,
  wishlistController.removeFromWishlist
);

module.exports = router;

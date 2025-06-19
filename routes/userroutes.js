const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// --- Rute otentikasi ---
router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/user/:id_user", verifyToken, userController.getUserProfile);
router.put("/user/:id_user", verifyToken, userController.updateUserProfile);

router.put(
  "/user/:id_user/picture",
  verifyToken,
  upload.single("profile_picture"),
  userController.updateProfilePicture
);

module.exports = router;

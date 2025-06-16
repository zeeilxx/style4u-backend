const express = require("express");
const router = express.Router();
const path = require("path"); 
const multer = require("multer");

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage: storage });

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
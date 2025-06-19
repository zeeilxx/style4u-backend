const express = require("express");
const router = express.Router();
const produkController = require("../controllers/produkController");
const upload = require("../middleware/upload"); // Menggunakan middleware terpusat

router.get("/produk", produkController.getAllProduk);
router.get("/produk/:id", produkController.getProdukById);
router.post("/produk", upload.single("image"), produkController.createProduk);
router.put(
  "/produk/:id",
  upload.single("image"),
  produkController.updateProduk
);
router.delete("/produk/:id", produkController.deleteProduk);

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// CREATE Produk (sudah benar, tidak ada perubahan)
router.post("/produk", upload.single("image"), (req, res) => {
  // 1. Ambil 'gender' dari req.body
  const { nama, id_cat, id_brand, deskripsi, harga, id_grade, stok, gender } =
    req.body;
  const image_url = req.file ? req.file.filename : null;

  // 2. Tambahkan 'gender' ke dalam query INSERT
  const sqlProduk = `
      INSERT INTO produk (nama, id_cat, id_brand, deskripsi, harga, image_url, id_grade, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  db.query(
    sqlProduk,
    // 3. Tambahkan 'gender' ke dalam array parameter
    [nama, id_cat, id_brand, deskripsi, harga, image_url, id_grade, gender],
    (err, result) => {
      if (err) return res.status(500).send(err);

      const id_produk = result.insertId;
      let stockItems;
      try {
        stockItems = JSON.parse(stok);
      } catch (e) {
        return res.status(400).send({ message: "Format stok tidak valid" });
      }

      if (!Array.isArray(stockItems) || stockItems.length === 0) {
        return res
          .status(201)
          .send({ message: "Produk ditambahkan tanpa stok." });
      }

      const sqlStock = `INSERT INTO product_stocks (id_produk, size, stok) VALUES ?`;
      const stockValues = stockItems
        .filter((item) => item.size && item.stok)
        .map((item) => [id_produk, item.size, parseInt(item.stok, 10) || 0]);

      if (stockValues.length === 0) {
        return res
          .status(201)
          .send({ message: "Produk ditambahkan, stok kosong diabaikan." });
      }

      db.query(sqlStock, [stockValues], (err2) => {
        if (err2) {
          console.error("GAGAL INSERT STOK:", err2);
          return res.status(500).send(err2);
        }
        res
          .status(201)
          .send({ message: "Produk dan stok berhasil ditambahkan" });
      });
    }
  );
});

// READ Semua Produk
router.get("/produk", (req, res) => {
  // --- QUERY DIPERBARUI DENGAN JOIN ---
  // Kita mengambil nama dari tabel category, brands, dan grades
  const sql = `
    SELECT 
      p.*, 
      c.name AS category_name,
      b.nama AS brand_name,
      g.nama_grade,
      CONCAT('[', IFNULL(GROUP_CONCAT(JSON_OBJECT('size', ps.size, 'stok', ps.stok)), ''), ']') AS stocks
    FROM produk p
    LEFT JOIN category c ON p.id_cat = c.id_cat
    LEFT JOIN brands b ON p.id_brand = b.id_brand
    LEFT JOIN grades g ON p.id_grade = g.id_grade
    LEFT JOIN product_stocks ps ON p.id_produk = ps.id_produk
    GROUP BY p.id_produk
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);

    const finalResults = results.map((p) => ({
      ...p,
      stocks: JSON.parse(p.stocks),
    }));
    res.status(200).send(finalResults);
  });
});

// READ Produk by ID
router.get("/produk/:id", (req, res) => {
  const sql = `
    SELECT p.*,
      CONCAT('[', IFNULL(GROUP_CONCAT(JSON_OBJECT('size', ps.size, 'stok', ps.stok)), ''), ']') AS stocks
    FROM produk p
    LEFT JOIN product_stocks ps ON p.id_produk = ps.id_produk
    WHERE p.id_produk = ?
    GROUP BY p.id_produk
  `;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0)
      return res.status(404).send({ message: "Produk tidak ditemukan" });

    const finalResult = {
      ...result[0],
      stocks: JSON.parse(result[0].stocks),
    };
    res.status(200).send(finalResult);
  });
});

// DELETE Produk (tidak ada perubahan)
router.delete("/produk/:id", (req, res) => {
  const sql = `DELETE FROM produk WHERE id_produk = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0)
      return res.status(404).send({ message: "Produk tidak ditemukan" });
    res.status(200).send({ message: "Produk berhasil dihapus" });
  });
});

// UPDATE Produk by ID
router.put("/produk/:id", upload.single("image"), (req, res) => {
  const id_produk = req.params.id;
  const { nama, id_cat, id_brand, deskripsi, harga, id_grade, stok, gender } =
    req.body;

  const image_url = req.file ? req.file.filename : null;

  let sqlProduk;
  let sqlProdukParams;

  if (image_url) {
    sqlProduk = `UPDATE produk SET nama = ?, id_cat = ?, id_brand = ?, deskripsi = ?, harga = ?, image_url = ?, id_grade = ? WHERE id_produk = ?`;
    sqlProdukParams = [
      nama,
      id_cat,
      id_brand,
      deskripsi,
      harga,
      image_url,
      id_grade,
      gender,
      id_produk,
    ];
  } else {
    sqlProduk = `UPDATE produk SET nama = ?, id_cat = ?, id_brand = ?, deskripsi = ?, harga = ?, id_grade = ?, gender = ? WHERE id_produk = ?`;
    sqlProdukParams = [
      nama,
      id_cat,
      id_brand,
      deskripsi,
      harga,
      id_grade,
      gender,
      id_produk,
    ];
  }

  db.query(sqlProduk, sqlProdukParams, (err, result) => {
    if (err)
      return res
        .status(500)
        .send({ message: "Gagal update data produk utama", error: err });

    // Hapus stok lama untuk produk ini
    const sqlDeleteStock = `DELETE FROM product_stocks WHERE id_produk = ?`;
    db.query(sqlDeleteStock, [id_produk], (errDel, resDel) => {
      if (errDel)
        return res
          .status(500)
          .send({ message: "Gagal hapus stok lama", error: errDel });

      // Masukkan stok yang baru
      let stockItems;
      try {
        stockItems = JSON.parse(stok);
      } catch (e) {
        return res.status(400).send({ message: "Format stok tidak valid" });
      }

      if (!Array.isArray(stockItems) || stockItems.length === 0) {
        return res
          .status(200)
          .send({ message: "Produk berhasil diperbarui (tanpa stok)." });
      }

      const sqlInsertStock = `INSERT INTO product_stocks (id_produk, size, stok) VALUES ?`;
      const stockValues = stockItems.map((item) => [
        id_produk,
        item.size,
        item.stok,
      ]);

      db.query(sqlInsertStock, [stockValues], (err2, res2) => {
        if (err2)
          return res
            .status(500)
            .send({ message: "Gagal insert stok baru", error: err2 });

        res
          .status(200)
          .send({ message: "Produk dan stok berhasil diperbarui" });
      });
    });
  });
});

module.exports = router;

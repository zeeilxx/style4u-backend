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

router.post("/produk", upload.single("image"), (req, res) => {
  const { nama, id_cat, id_brand, deskripsi, harga, id_grade, stok, gender } =
    req.body;
  const image_url = req.file ? req.file.filename : null;
  const sqlProduk = `
      INSERT INTO produk (nama, id_cat, id_brand, deskripsi, harga, image_url, id_grade, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  db.query(
    sqlProduk,
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

router.get("/produk", (req, res) => {
  const {
    search,
    category,
    brand,
    grade,
    gender,
    min_price,
    max_price,
    sort_by,
  } = req.query;

  let sql = `
    SELECT 
      p.id_produk, p.nama, p.id_cat, p.deskripsi, p.harga, p.image_url, p.gender,
      c.name AS category_name,
      b.nama AS brand_name,
      g.nama_grade,
      (SELECT SUM(ps.stok) FROM product_stocks ps WHERE ps.id_produk = p.id_produk) as total_stock
    FROM produk p
    LEFT JOIN category c ON p.id_cat = c.id_cat
    LEFT JOIN brands b ON p.id_brand = b.id_brand
    LEFT JOIN grades g ON p.id_grade = g.id_grade
  `;

  // Inisialisasi filter dengan kondisi untuk mengecualikan Mystery Box
  const whereClauses = ["p.id_produk != ?"];
  const params = [99999];

  if (search) {
    whereClauses.push("(p.nama LIKE ? OR p.deskripsi LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    whereClauses.push("c.name = ?");
    params.push(category);
  }
  if (brand) {
    whereClauses.push("b.nama = ?");
    params.push(brand);
  }
  if (grade) {
    whereClauses.push("g.nama_grade = ?");
    params.push(grade);
  }
  if (gender) {
    whereClauses.push("p.gender = ?");
    params.push(gender);
  }
  if (min_price) {
    whereClauses.push("p.harga >= ?");
    params.push(min_price);
  }
  if (max_price) {
    whereClauses.push("p.harga <= ?");
    params.push(max_price);
  }

  if (whereClauses.length > 0) {
    sql += " WHERE " + whereClauses.join(" AND ");
  }

  let orderByClause = " ORDER BY p.id_produk DESC";
  if (sort_by === "price_asc") {
    orderByClause = " ORDER BY p.harga ASC";
  } else if (sort_by === "price_desc") {
    orderByClause = " ORDER BY p.harga DESC";
  }
  sql += orderByClause;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send(err);
    }
    res.status(200).send(results);
  });
});

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

router.delete("/produk/:id", (req, res) => {
  const sql = `DELETE FROM produk WHERE id_produk = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0)
      return res.status(404).send({ message: "Produk tidak ditemukan" });
    res.status(200).send({ message: "Produk berhasil dihapus" });
  });
});

router.put("/produk/:id", upload.single("image"), (req, res) => {
  const id_produk = req.params.id;
  const { nama, id_cat, id_brand, deskripsi, harga, id_grade, stok, gender } =
    req.body;

  const image_url = req.file ? req.file.filename : null;

  let sqlProduk;
  let sqlProdukParams;

  if (image_url) {
    sqlProduk = `UPDATE produk SET nama = ?, id_cat = ?, id_brand = ?, deskripsi = ?, harga = ?, image_url = ?, id_grade = ?, gender = ? WHERE id_produk = ?`;
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

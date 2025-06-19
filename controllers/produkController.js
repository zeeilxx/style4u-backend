const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const formatProductResponse = (product) => {
  if (product && product.image_url) {
    product.image_url = `/api/uploads/${product.image_url}`;
  }
  return product;
};

// MENGAMBIL SEMUA PRODUK (DENGAN FILTER)
exports.getAllProduk = (req, res) => {
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

  // Query dasar
  let sql = `SELECT p.id_produk, p.nama, p.id_cat, p.deskripsi, p.harga, p.image_url, p.gender, c.name AS category_name, b.nama AS brand_name, g.nama_grade, (SELECT SUM(ps.stok) FROM product_stocks ps WHERE ps.id_produk = p.id_produk) as total_stock FROM produk p LEFT JOIN category c ON p.id_cat = c.id_cat LEFT JOIN brands b ON p.id_brand = b.id_brand LEFT JOIN grades g ON p.id_grade = g.id_grade`;

  // Kumpulan kondisi WHERE
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

  // Menambahkan sorting
  if (sort_by === "price_asc") {
    sql += " ORDER BY p.harga ASC";
  } else if (sort_by === "price_desc") {
    sql += " ORDER BY p.harga DESC";
  } else {
    sql += " ORDER BY p.id_produk DESC";
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send(err);
    }

    const formattedResults = results.map(formatProductResponse);
    res.status(200).send(formattedResults);
  });
};

// MENGAMBIL PRODUK BERDASARKAN ID
exports.getProdukById = (req, res) => {
  const sql = `SELECT p.*, CONCAT('[', IFNULL(GROUP_CONCAT(JSON_OBJECT('size', ps.size, 'stok', ps.stok)), ''), ']') AS stocks FROM produk p LEFT JOIN product_stocks ps ON p.id_produk = ps.id_produk WHERE p.id_produk = ? GROUP BY p.id_produk`;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0)
      return res.status(404).send({ message: "Produk tidak ditemukan" });

    const finalResult = formatProductResponse(result[0]);
    finalResult.stocks = JSON.parse(result[0].stocks);

    res.status(200).send(finalResult);
  });
};

// MEMBUAT PRODUK BARU
exports.createProduk = (req, res) => {
  const { nama, id_cat, id_brand, deskripsi, harga, id_grade, stok, gender } =
    req.body;
  const image_url = req.file ? req.file.filename : null;

  const sqlProduk = `INSERT INTO produk (nama, id_cat, id_brand, deskripsi, harga, image_url, id_grade, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

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
};

// MENGUPDATE PRODUK
exports.updateProduk = (req, res) => {
  const id_produk = req.params.id;
  const { nama, id_cat, id_brand, deskripsi, harga, id_grade, stok, gender } =
    req.body;
  const image_url = req.file ? req.file.filename : null;

  let sqlProduk, sqlProdukParams;

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

  db.query(sqlProduk, sqlProdukParams, (err) => {
    if (err)
      return res
        .status(500)
        .send({ message: "Gagal update data produk utama", error: err });

    const sqlDeleteStock = `DELETE FROM product_stocks WHERE id_produk = ?`;
    db.query(sqlDeleteStock, [id_produk], (errDel) => {
      if (errDel)
        return res
          .status(500)
          .send({ message: "Gagal hapus stok lama", error: errDel });

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

      db.query(sqlInsertStock, [stockValues], (err2) => {
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
};

// MENGHAPUS PRODUK
exports.deleteProduk = (req, res) => {
  const id_produk = req.params.id;

  db.query(
    "SELECT image_url FROM produk WHERE id_produk = ?",
    [id_produk],
    (err, results) => {
      if (err) return res.status(500).send(err);

      if (results.length > 0 && results[0].image_url) {
        const imagePath = path.join(
          __dirname,
          "..",
          "uploads",
          results[0].image_url
        );
        fs.unlink(imagePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error(
              "Info: Gagal hapus file gambar (mungkin sudah tidak ada):",
              unlinkErr.message
            );
          }
        });
      }

      const sql = `DELETE FROM produk WHERE id_produk = ?`;
      db.query(sql, [id_produk], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0)
          return res.status(404).send({ message: "Produk tidak ditemukan" });
        res.status(200).send({ message: "Produk berhasil dihapus" });
      });
    }
  );
};

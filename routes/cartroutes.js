const express = require("express");
const router = express.Router();
const db = require("../config/db");

const { verifyToken } = require("../middleware/authMiddleware"); // Impor verifyToken

// TERAPKAN MIDDLEWARE DI SINI UNTUK MELINDUNGI SEMUA RUTE KERANJANG
// router.use(verifyToken);

const ensureCartExists = (id_user, callback) => {
  const sql = "SELECT * FROM cart WHERE id_user = ?";
  db.query(sql, [id_user], (err, results) => {
    if (err) return callback(err);
    if (results.length > 0) return callback(null, results[0].id_cart);

    db.query(
      "INSERT INTO cart (id_user) VALUES (?)",
      [id_user],
      (err, result) => {
        if (err) return callback(err);
        return callback(null, result.insertId);
      }
    );
  });
};

router.get("/cart", verifyToken, (req, res) => {
  // Ambil id_user dari token yang sudah diverifikasi, BUKAN dari params
  const id_user = req.user.id_user;

  // Hapus pengecekan 'if' yang lama karena tidak lagi relevan

  const sql = `
    SELECT 
      ci.id_cart_item, ci.id_produk, p.nama AS name, ci.quantity AS qty,
      ci.size, p.harga AS price, p.image_url AS image, ci.custom_details
    FROM cart c
    JOIN cart_item ci ON c.id_cart = ci.id_cart
    LEFT JOIN produk p ON ci.id_produk = p.id_produk
    WHERE c.id_user = ?
  `;
  db.query(sql, [id_user], (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
});

router.post("/cart/add", verifyToken, (req, res) => {
  const id_user = req.user.id_user; // Ambil id_user dari token
  const { id_produk, quantity, size } = req.body;

  if (!id_produk || !quantity || !size) {
    return res
      .status(400)
      .json({ message: "id_produk, quantity, dan size wajib diisi" });
  }

  ensureCartExists(id_user, (err, id_cart) => {
    if (err) return res.status(500).send(err);

    const checkSql =
      "SELECT * FROM cart_item WHERE id_cart = ? AND id_produk = ? AND size = ?";
    db.query(checkSql, [id_cart, id_produk, size], (err, results) => {
      if (err) return res.status(500).send(err);

      if (results.length > 0) {
        const updateSql =
          "UPDATE cart_item SET quantity = quantity + ? WHERE id_cart_item = ?";
        db.query(updateSql, [quantity, results[0].id_cart_item], (err) => {
          if (err) return res.status(500).send(err);
          return res.status(200).json({ message: "Quantity diperbarui" });
        });
      } else {
        const insertSql =
          "INSERT INTO cart_item (id_cart, id_produk, size, quantity) VALUES (?, ?, ?, ?)";
        db.query(insertSql, [id_cart, id_produk, size, quantity], (err) => {
          if (err) return res.status(500).send(err);
          return res
            .status(201)
            .json({ message: "Produk ditambahkan ke keranjang" });
        });
      }
    });
  });
});

router.put("/cart/:id_user/update", verifyToken, (req, res) => {
  const id_user = req.params.id_user;
  const { id_produk, size, quantity } = req.body;

  if (!id_produk || !size || quantity === undefined) {
    return res
      .status(400)
      .json({ message: "id_produk, size, dan quantity wajib diisi" });
  }

  if (quantity < 1) {
    return res.status(400).json({ message: "Kuantitas minimal adalah 1" });
  }

  ensureCartExists(id_user, (err, id_cart) => {
    if (err) return res.status(500).send(err);

    const updateSql =
      "UPDATE cart_item SET quantity = ? WHERE id_cart = ? AND id_produk = ? AND size = ?";
    db.query(updateSql, [quantity, id_cart, id_produk, size], (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Item tidak ditemukan di keranjang" });
      }
      res.status(200).json({ message: "Kuantitas item diperbarui" });
    });
  });
});

router.post("/cart/remove", verifyToken, (req, res) => {
  // <-- PERUBAHAN DI SINI
  const id_user = req.user.id_user;
  const { id_produk, size } = req.body;

  // Tambahkan validasi untuk memastikan body tidak kosong
  if (!id_produk || !size) {
    return res.status(400).json({ message: "id_produk dan size diperlukan." });
  }

  ensureCartExists(id_user, (err, id_cart) => {
    if (err) return res.status(500).send(err);

    const deleteSql =
      "DELETE FROM cart_item WHERE id_cart = ? AND id_produk = ? AND size = ?";
    db.query(deleteSql, [id_cart, id_produk, size], (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Item tidak ditemukan di keranjang." });
      }
      res.status(200).json({ message: "Produk dihapus dari keranjang" });
    });
  });
});

router.delete("/cart/:id_user/clear", verifyToken, (req, res) => {
  const id_user = req.params.id_user;

  ensureCartExists(id_user, (err, id_cart) => {
    if (err) return res.status(500).send(err);

    const deleteSql = "DELETE FROM cart_item WHERE id_cart = ?";
    db.query(deleteSql, [id_cart], (err) => {
      if (err) return res.status(500).send(err);
      res.status(200).json({ message: "Keranjang dikosongkan" });
    });
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Tambah stok per size
router.post("/", (req, res) => {
  const { id_produk, size, stok } = req.body;
  const sql = `
    INSERT INTO product_stocks (id_produk, size, stok)
    VALUES (?, ?, ?)
  `;
  db.query(sql, [id_produk, size, stok], (err, result) => {
    if (err) return res.status(500).send(err);
    res
      .status(201)
      .send({ message: "Stok size ditambahkan", id: result.insertId });
  });
});

// Ambil semua stok berdasarkan produk
router.get("/:id_produk", (req, res) => {
  const sql = `
    SELECT size, stok FROM product_stocks WHERE id_produk = ?
  `;
  db.query(sql, [req.params.id_produk], (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(results);
  });
});

// Update stok per size
router.put("/:id", (req, res) => {
  const { size, stok } = req.body;
  const sql = `
    UPDATE product_stocks SET size = ?, stok = ? WHERE id = ?
  `;
  db.query(sql, [size, stok, req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Stok tidak ditemukan" });
    }
    res.status(200).send({ message: "Stok size diperbarui" });
  });
});

// Hapus stok size
router.delete("/:id", (req, res) => {
  const sql = `DELETE FROM product_stocks WHERE id = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Stok tidak ditemukan" });
    }
    res.status(200).send({ message: "Stok size dihapus" });
  });
});

module.exports = router;

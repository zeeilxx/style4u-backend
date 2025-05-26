const express = require("express");
const mysql = require("mysql");
const router = express.Router();
// Konfigurasi koneksi MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Ganti dengan user MySQL Anda
  password: "", // Ganti dengan password MySQL Anda
  database: "style4u_db",
});
// Koneksi ke MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL");
});
// CREATE Category (POST)
router.post("/category", (req, res) => {
  const { id, name } = req.body;
  const sql = `INSERT INTO category (id, name,) VALUES (?,
?, ?)`;
  db.query(sql, [id, name], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).send({ id: result.insertId, id, name });
  });
});
// READ all category (GET)
router.get("/category", (req, res) => {
  const sql = `SELECT * FROM category`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(results);
  });
});

// READ single category by id (GET)
router.get("/category/:id", (req, res) => {
  const sql = `SELECT * FROM category WHERE id = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.length === 0) {
      return res.status(404).send({ message: "category not found" });
    }
    res.status(200).send(result[0]);
  });
});
// UPDATE category by id (PUT)
router.put("/category/:id", (req, res) => {
  const { id, name } = req.body;
  const sql = `UPDATE category SET id = ?, name = ? WHERE
id = ?`;
  db.query(sql, [id, name, , req.params.id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "category not found" });
    }
    res.status(200).send({ id: req.params.id, name });
  });
});
// DELETE category by id (DELETE)
router.delete("/category/:id", (req, res) => {
  const sql = `DELETE FROM category WHERE id = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "category not found" });
    }
    res.status(200).send({ message: "category deleted successfully" });
  });
});
module.exports = router;

// categoryroutes.js

const express = require("express");
const router = express.Router();
const db = require("../config/db"); // sesuaikan dengan lokasi file db.js

// CREATE Category (POST) - TIDAK PERLU DIUBAH
router.post("/category", (req, res) => {
  const { name } = req.body;
  const sql = `INSERT INTO category (name) VALUES (?)`;
  db.query(sql, [name], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).send({ id: result.insertId, name });
  });
});

// READ all category (GET)
router.get("/category", (req, res) => {
  const sql = `SELECT id_cat AS id, name FROM category`;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(results);
  });
});

// READ single category by id (GET) - TIDAK PERLU DIUBAH
router.get("/category/:id", (req, res) => {
  const sql = `SELECT * FROM category WHERE id_cat = ?`; // Sesuaikan dengan primary key Anda
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

// UPDATE category by id (PUT) - TIDAK PERLU DIUBAH
router.put("/category/:id", (req, res) => {
  const { name } = req.body;
  const sql = `UPDATE category SET name = ? WHERE id_cat = ?`; // Sesuaikan dengan primary key Anda
  db.query(sql, [name, req.params.id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "category not found" });
    }
    res.status(200).send({ id: req.params.id, name });
  });
});

// DELETE category by id (DELETE) - TIDAK PERLU DIUBAH
router.delete("/category/:id", (req, res) => {
  const sql = `DELETE FROM category WHERE id_cat = ?`; // Sesuaikan dengan primary key Anda
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

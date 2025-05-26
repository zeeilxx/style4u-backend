const express = require("express");
const mysql = require("mysql");
const router = express.Router();
// Konfigurasi koneksi MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "style4u_db",
});
// Koneksi ke MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL");
});
// CREATE user (POST)
router.post("/user", (req, res) => {
  const { name, password, password_confirm, email } = req.body;

  if (!name || !password || !password_confirm || !email) {
    return res.status(400).send({ message: "Semua field wajib diisi." });
  }

  // Validasi Password
  if (password !== password_confirm) {
    return res
      .status(400)
      .send({ message: "Password dan konfirmasi tidak cocok." });
  }

  const id_role = 2;

  const sql = `INSERT INTO user (id_role, name, password, password_confirm, email, created)
               VALUES (?, ?, ?, ?, ?, NOW())`;

  db.query(
    sql,
    [id_role, name, password, password_confirm, email],
    (err, result) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.status(201).send({
        id: result.insertId,
        name,
        email,
        message: "User berhasil ditambahkan.",
      });
    }
  );
});

// READ all user (GET)
router.get("/user", (req, res) => {
  const sql = `SELECT * FROM user`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(results);
  });
});

// READ single user by id (GET)
router.get("/user/:id_user", (req, res) => {
  const sql = `SELECT * FROM user WHERE id_user = ?`;
  db.query(sql, [req.params.id_user], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.length === 0) {
      return res.status(404).send({ message: "user not found" });
    }
    res.status(200).send(result[0]);
  });
});
// UPDATE user by id (PUT)
router.put("/user/:id_user", (req, res) => {
  const { id_user, id_role, name, password, password_confirm, email, created } =
    req.body;
  const sql = `UPDATE user SET id_role = ?, name = ?, password = ?, password_confirm = ?, email = ?, created = ? WHERE id_user = ?`;
  db.query(
    sql,
    [
      id_role,
      name,
      password,
      password_confirm,
      email,
      created,
      req.params.id_user,
    ],

    (err, result) => {
      if (err) {
        return res.status(500).send(err);
      }
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "user not found" });
      }
      res.status(200).send({ id: req.params.id, name });
    }
  );
});
// DELETE user by id (DELETE)
router.delete("/user/:id", (req, res) => {
  const sql = `DELETE FROM user WHERE id_user = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "user not found" });
    }
    res.status(200).send({ message: "user deleted successfully" });
  });
});

module.exports = router;

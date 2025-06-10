// routes/adminroutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "rahasia_jwt"; // Harus .env di production

// Middleware verifikasi token
const verifyToken = (req, res, next) => {
  const bearer = req.headers.authorization;
  if (!bearer || !bearer.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Token tidak tersedia." });
  }

  const token = bearer.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid." });
  }
};

// ✅ Daftar admin baru
router.post("/register/admin", verifyToken, async (req, res) => {
  if (req.user.id_role !== 1) {
    return res.status(403).json({
      message: "Hanya admin yang dapat mendaftarkan -admin baru.",
    });
  }

  const { name, password, password_confirm, email } = req.body;

  if (!name || !password || !password_confirm || !email) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }

  if (password !== password_confirm) {
    return res.status(400).json({ message: "Password tidak cocok." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id_role = 1;

    const sql = `INSERT INTO user (id_role, name, password, password_confirm, email, created)
                 VALUES (?, ?, ?, ?, ?, NOW())`;

    db.query(
      sql,
      [id_role, name, hashedPassword, hashedPassword, email],
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({
          id: result.insertId,
          name,
          email,
          message: "Admin berhasil didaftarkan.",
        });
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Gagal hashing password." });
  }
});

// ✅ Lihat semua admin
router.get("/admins", verifyToken, (req, res) => {
  const sql = `SELECT id_user, name, email, id_role FROM user WHERE id_role = 1`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    res.json(results);
  });
});

// ✅ Lihat semua user (hanya admin)
router.get("/user", verifyToken, (req, res) => {
  if (req.user.id_role !== 1) {
    return res.status(403).json({ message: "Akses ditolak. Hanya admin." });
  }

  const sql = `SELECT * FROM user`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
});

// ✅ Update user (admin)
router.put("/user/:id_user", verifyToken, async (req, res) => {
  const { id_role, name, password, password_confirm, email, created } =
    req.body;

  if (password !== password_confirm) {
    return res.status(400).json({ message: "Password tidak cocok." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `UPDATE user SET id_role = ?, name = ?, password = ?, password_confirm = ?, email = ?, created = ? WHERE id_user = ?`;
  db.query(
    sql,
    [
      id_role,
      name,
      hashedPassword,
      hashedPassword,
      email,
      created,
      req.params.id_user,
    ],
    (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "User tidak ditemukan." });
      }
      res.status(200).json({ message: "User berhasil diperbarui." });
    }
  );
});

// ✅ Delete user (admin)
router.delete("/user/:id", verifyToken, (req, res) => {
  if (req.user.id_role !== 1) {
    return res
      .status(403)
      .json({ message: "Hanya admin yang dapat menghapus user." });
  }

  const sql = `DELETE FROM user WHERE id_user = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "User tidak ditemukan." });
    }
    res.status(200).json({ message: "User berhasil dihapus." });
  });
});

module.exports = router;

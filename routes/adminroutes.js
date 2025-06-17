const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "rahasia_jwt";

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ✅ Daftar admin baru
router.post("/register/admin", [verifyToken, isAdmin], async (req, res) => {
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

    const sql = `INSERT INTO user (id_role, name, password, email, created_at) VALUES (?, ?, ?, ?, NOW())`;
    db.query(sql, [id_role, name, hashedPassword, email], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email sudah terdaftar." });
        }
        return res.status(500).json(err);
      }
      res.status(201).json({ message: "Admin berhasil didaftarkan." });
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal hashing password." });
  }
});

//  Lihat semua admin
router.get("/admins", [verifyToken, isAdmin], (req, res) => {
  const sql = `SELECT id_user, name, email, id_role FROM user WHERE id_role = 1`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    res.json(results);
  });
});
//  Lihat semua user (hanya admin)
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

//  Update user (admin)
router.put("/user/:id_user", verifyToken, async (req, res) => {
  const { id_role, name, password, email, created_at } = req.body;

  if (password !== password_confirm) {
    return res.status(400).json({ message: "Password tidak cocok." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `UPDATE user SET id_role = ?, name = ?, password = ?, email = ?, created_at = ? WHERE id_user = ?`;
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

//  Delete user (admin)
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

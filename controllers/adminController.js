const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Membuat Admin Baru
exports.registerAdmin = async (req, res) => {
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
    db.query(sql, [id_role, name, hashedPassword, email], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email sudah terdaftar." });
        }
        return res.status(500).json(err);
      }
      res.status(201).json({ message: "Admin berhasil didaftarkan." });
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal memproses password." });
  }
};

// Mendapatkan semua user dengan role admin
exports.getAllAdmins = (req, res) => {
  const sql = `SELECT id_user, name, email, id_role FROM user WHERE id_role = 1`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    res.json(results);
  });
};

// Mendapatkan semua user (customer & admin)
exports.getAllUsers = (req, res) => {
  const sql = `SELECT id_user, name, email, id_role, created_at, no_handphone, jenis_kelamin FROM user`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
};

// Menghapus user
exports.deleteUser = (req, res) => {
  // Hanya admin yang bisa menghapus
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
};

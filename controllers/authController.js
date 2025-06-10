const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SECRET_KEY = "rahasia_jwt";

// REGISTER
exports.register = async (req, res) => {
  const { name, password, password_confirm, email } = req.body;

  if (!name || !password || !password_confirm || !email) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }

  if (password !== password_confirm) {
    return res.status(400).json({ message: "Password tidak cocok." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id_role = 2;

    const sql = `
      INSERT INTO user (id_role, name, password, email, created_at) 
      VALUES (?, ?, ?, ?, NOW())`;

    db.query(sql, [id_role, name, hashedPassword, email], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email sudah terdaftar." });
        }
        return res.status(500).json(err);
      }
      res
        .status(201)
        .json({ message: "User berhasil didaftarkan. Silakan login." });
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// LOGIN
exports.login = (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM user WHERE email = ?`;
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.status(404).json({ message: "Email tidak ditemukan." });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ message: "Password salah." });

    const token = jwt.sign(
      {
        id_user: user.id_user,
        id_role: user.id_role,
        name: user.name,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login berhasil.",
      token,
      id_user: user.id_user,
      id_role: user.id_role,
    });
  });
};

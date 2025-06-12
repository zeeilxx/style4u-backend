const db = require("../config/db");

exports.getUserProfile = (req, res) => {
  if (
    req.user.id_user !== parseInt(req.params.id_user) &&
    req.user.id_role !== 1
  ) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  const sql = `SELECT id_user, username, name, email, no_handphone, jenis_kelamin FROM user WHERE id_user = ?`;

  db.query(sql, [req.params.id_user], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).send(err);
    }
    if (result.length === 0) {
      return res.status(404).send({ message: "User tidak ditemukan." });
    }
    res.status(200).json(result[0]);
  });
};

exports.updateUserProfile = (req, res) => {
  const id_user_param = parseInt(req.params.id_user);

  if (req.user.id_user !== id_user_param && req.user.id_role !== 1) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  const { username, name, email, no_handphone, jenis_kelamin } = req.body;

  const sql = `
    UPDATE user 
    SET username = ?, name = ?, email = ?, no_handphone = ?, jenis_kelamin = ?
    WHERE id_user = ?
  `;

  const params = [
    username,
    name,
    email,
    no_handphone,
    jenis_kelamin,
    id_user_param,
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ message: "Username atau Email sudah digunakan." });
      }
      return res.status(500).send(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }
    res.status(200).json({ message: "Profil berhasil diperbarui." });
  });
};

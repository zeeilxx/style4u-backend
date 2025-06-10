const db = require("../config/db");

exports.getAllAddresses = (req, res) => {
  const id_user = req.params.id_user;
  if (req.user.id_user !== parseInt(id_user)) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  const sql =
    "SELECT * FROM user_addresses WHERE id_user = ? ORDER BY is_utama DESC, id_address DESC";
  db.query(sql, [id_user], (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
};

// Menambah alamat BARU
exports.addAddress = (req, res) => {
  const id_user = req.params.id_user;
  const { label_alamat, alamat_lengkap, provinsi, kota, kode_pos, is_utama } =
    req.body;

  const newAddress = [
    id_user,
    label_alamat,
    alamat_lengkap,
    provinsi,
    kota,
    kode_pos,
    is_utama,
  ];
  const sql =
    "INSERT INTO user_addresses (id_user, label_alamat, alamat_lengkap, provinsi, kota, kode_pos, is_utama) VALUES (?)";

  db.query(sql, [newAddress], (err, result) => {
    if (err) return res.status(500).send(err);
    res
      .status(201)
      .json({
        message: "Alamat baru berhasil ditambahkan.",
        insertId: result.insertId,
      });
  });
};

// MENGUPDATE alamat yang sudah ada
exports.updateAddress = (req, res) => {
  const { id_address } = req.params;
  const { label_alamat, alamat_lengkap, provinsi, kota, kode_pos, is_utama } =
    req.body;

  const sql = `
        UPDATE user_addresses 
        SET label_alamat = ?, alamat_lengkap = ?, provinsi = ?, kota = ?, kode_pos = ?, is_utama = ?
        WHERE id_address = ? AND id_user = ?
    `;
  const params = [
    label_alamat,
    alamat_lengkap,
    provinsi,
    kota,
    kode_pos,
    is_utama,
    id_address,
    req.user.id_user,
  ];

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({
          message: "Alamat tidak ditemukan atau Anda tidak punya hak akses.",
        });
    res.status(200).json({ message: "Alamat berhasil diperbarui." });
  });
};

// MENGHAPUS alamat
exports.deleteAddress = (req, res) => {
  const { id_address } = req.params;
  const sql = "DELETE FROM user_addresses WHERE id_address = ? AND id_user = ?";

  db.query(sql, [id_address, req.user.id_user], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({
          message: "Alamat tidak ditemukan atau Anda tidak punya hak akses.",
        });
    res.status(200).json({ message: "Alamat berhasil dihapus." });
  });
};

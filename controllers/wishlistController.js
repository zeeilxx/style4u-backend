const db = require("../config/db");

exports.getWishlist = (req, res) => {
  const id_user = req.params.id_user;

  if (req.user.id_user !== parseInt(id_user) && req.user.id_role !== 1) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  const sql = `
    SELECT 
      p.*,
      b.nama AS brand_name,
      c.name AS category_name,
      g.nama_grade
    FROM wishlist w
    JOIN produk p ON w.id_produk = p.id_produk
    LEFT JOIN brands b ON p.id_brand = b.id_brand
    LEFT JOIN category c ON p.id_cat = c.id_cat
    LEFT JOIN grades g ON p.id_grade = g.id_grade
    WHERE w.id_user = ?
    ORDER BY w.created_at DESC
  `;

  db.query(sql, [id_user], (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
};

exports.addToWishlist = (req, res) => {
  const id_user = req.params.id_user;
  const { id_produk } = req.body;

  if (!id_produk) {
    return res.status(400).json({ message: "id_produk wajib diisi." });
  }

  if (req.user.id_user !== parseInt(id_user)) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  const sql = "INSERT INTO wishlist (id_user, id_produk) VALUES (?, ?)";
  db.query(sql, [id_user, id_produk], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ message: "Produk ini sudah ada di wishlist Anda." });
      }
      return res.status(500).send(err);
    }
    res
      .status(201)
      .json({ message: "Produk berhasil ditambahkan ke wishlist." });
  });
};

exports.removeFromWishlist = (req, res) => {
  const id_user = req.params.id_user;
  const { id_produk } = req.body;

  if (!id_produk) {
    return res.status(400).json({ message: "id_produk wajib diisi." });
  }

  if (req.user.id_user !== parseInt(id_user)) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  const sql = "DELETE FROM wishlist WHERE id_user = ? AND id_produk = ?";
  db.query(sql, [id_user, id_produk], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Item tidak ditemukan di wishlist." });
    }
    res.status(200).json({ message: "Produk berhasil dihapus dari wishlist." });
  });
};

const db = require("../config/db");

exports.getAllProduk = (req, res) => {
  db.query("SELECT * FROM produk", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
};

exports.getProdukById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM produk WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0)
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(result[0]);
  });
};

exports.createProduk = (req, res) => {
  const { id_cat, id_brand, deskripsi, size, harga, stok, grade } = req.body;
  const image_url = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO produk (id_cat, id_brand, deskripsi, size, harga, stok, image_url, grade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [id_cat, id_brand, deskripsi, size, harga, stok, image_url, grade],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: "Produk berhasil ditambahkan" });
    }
  );
};

exports.updateProduk = (req, res) => {
  const { id } = req.params;
  const { id_cat, id_brand, deskripsi, size, harga, stok, grade } = req.body;
  const image_url = req.file ? req.file.filename : null;

  const sql = `
    UPDATE produk SET id_cat = ?, id_brand = ?, deskripsi = ?, size = ?, harga = ?, stok = ?, grade = ?
    ${image_url ? ", image_url = ?" : ""}
    WHERE id = ?
  `;

  const values = image_url
    ? [id_cat, id_brand, deskripsi, size, harga, stok, grade, image_url, id]
    : [id_cat, id_brand, deskripsi, size, harga, stok, grade, id];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Produk berhasil diperbarui" });
  });
};

exports.deleteProduk = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM produk WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Produk berhasil dihapus" });
  });
};

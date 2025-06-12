const db = require("../config/db");

exports.addToCart = async (req, res) => {
  const { style, size, optionId } = req.body;
  const id_user = req.user.id_user;

  if (!style || !size || !optionId) {
    return res
      .status(400)
      .json({ message: "Style, size, dan pilihan box harus diisi." });
  }

  try {
    const getOptionSql = "SELECT * FROM mystery_box_options WHERE id = ?";
    db.query(getOptionSql, [optionId], (err, options) => {
      if (err || options.length === 0)
        return res
          .status(404)
          .json({ message: "Opsi Mystery Box tidak valid." });

      const selectedOption = options[0];

      const getCartSql = "SELECT id_cart FROM cart WHERE id_user = ?";
      db.query(getCartSql, [id_user], (err, carts) => {
        if (err || carts.length === 0)
          return res
            .status(404)
            .json({ message: "Keranjang tidak ditemukan." });

        const id_cart = carts[0].id_cart;
        const ID_PRODUK_MYSTERY_BOX = 99999;

        const customDetails = JSON.stringify({
          style: style,
          size: size,
          num_items: selectedOption.num_items,
          box_name: selectedOption.name,
        });

        const addToCartSql =
          "INSERT INTO cart_item (id_cart, id_produk, quantity, size, custom_details) VALUES (?, ?, 1, ?, ?)";
        const values = [id_cart, ID_PRODUK_MYSTERY_BOX, size, customDetails];

        db.query(addToCartSql, values, (err, result) => {
          if (err)
            return res
              .status(500)
              .json({ message: "Gagal menambah ke keranjang", error: err });
          res
            .status(200)
            .json({ message: "Mystery Box berhasil ditambahkan!" });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getOptions = (req, res) => {
  const sql =
    "SELECT id, name, num_items, price FROM mystery_box_options ORDER BY num_items ASC";
  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    res.status(200).json(results);
  });
};

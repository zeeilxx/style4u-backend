const db = require("../config/db");

exports.createOrder = (req, res) => {
  const {
    orderCode,
    id_address,
    subtotal,
    shipping_cost,
    total_amount,
    shipping_method,
    payment_method,
    payment_details,
    items, 
  } = req.body;
  const id_user = req.user.id_user;

  db.beginTransaction((err) => {
    if (err)
      return res.status(500).json({ message: "Transaction Error", error: err });

    const orderSql =
      "INSERT INTO orders (order_code, id_user, id_address, subtotal, shipping_cost, total_amount, shipping_method, payment_method, payment_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const orderValues = [
      orderCode,
      id_user,
      id_address,
      subtotal,
      shipping_cost,
      total_amount,
      shipping_method,
      payment_method,
      JSON.stringify(payment_details),
    ];

    db.query(orderSql, orderValues, (err, orderResult) => {
      if (err)
        return db.rollback(() =>
          res.status(500).json({ message: "Gagal membuat pesanan", error: err })
        );

      const newOrderId = orderResult.insertId;


      const itemsSql =
        "INSERT INTO order_items (id_order, id_produk, quantity, price_at_purchase, size) VALUES ?";
      const itemsValues = items.map((item) => [
        newOrderId,
        item.id_produk,
        item.quantity,
        item.price,
        item.size,
      ]);

      db.query(itemsSql, [itemsValues], (err, itemsResult) => {
        if (err)
          return db.rollback(() =>
            res
              .status(500)
              .json({ message: "Gagal menyimpan item pesanan", error: err })
          );

        const stockPromises = items.map((item) => {
          return new Promise((resolve, reject) => {
            const updateStockSql =
              "UPDATE product_stocks SET stok = stok - ? WHERE id_produk = ? AND size = ?";
            db.query(
              updateStockSql,
              [item.quantity, item.id_produk, item.size],
              (err, stockResult) => {
                if (err) return reject(err);
                if (stockResult.affectedRows === 0)
                  return reject(
                    new Error(
                      `Stok untuk produk ID ${item.id_produk} ukuran ${item.size} tidak ditemukan.`
                    )
                  );
                resolve(stockResult);
              }
            );
          });
        });

        Promise.all(stockPromises)
          .then(() => {
            const cartItemIds = items.map((item) => item.id_cart_item);

            const deleteCartSql = `DELETE FROM cart_item WHERE id_cart_item IN (?)`;
            db.query(deleteCartSql, [cartItemIds], (err, deleteResult) => {
              if (err)
                return db.rollback(() =>
                  res.status(500).json({
                    message: "Gagal membersihkan keranjang",
                    error: err,
                  })
                );

              db.commit((err) => {
                if (err)
                  return db.rollback(() =>
                    res
                      .status(500)
                      .json({ message: "Commit gagal", error: err })
                  );
                res.status(201).json({
                  message: "Pesanan berhasil dibuat!",
                  orderId: newOrderId,
                  orderCode,
                });
              });
            });
          })
          .catch((err) => {
            return db.rollback(() =>
              res
                .status(500)
                .json({ message: "Gagal memperbarui stok", error: err.message })
            );
          });
      });
    });
  });
};

exports.uploadPaymentProof = (req, res) => {
  const { orderCode } = req.params;
  const id_user = req.user.id_user;

  if (!req.file) {
    return res.status(400).json({ message: "Tidak ada file yang di-upload." });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const sql =
    "UPDATE orders SET payment_proof_image = ?, order_status = 'verifying_payment' WHERE order_code = ? AND id_user = ?";

  db.query(sql, [imageUrl, orderCode, id_user], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({
        message: "Order tidak ditemukan atau Anda tidak memiliki akses.",
      });

    res
      .status(200)
      .json({ message: "Bukti pembayaran berhasil di-upload.", imageUrl });
  });
};

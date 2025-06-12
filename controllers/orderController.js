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
        "INSERT INTO order_items (id_order, id_produk, quantity, price_at_purchase, size, custom_details) VALUES ?";
      const itemsValues = items.map((item) => [
        newOrderId,
        item.id_produk,
        item.quantity,
        item.price,
        item.size,
        item.custom_details || null,
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

exports.getUserOrders = (req, res) => {
  const id_user = req.user.id_user;

  const sql = `
        SELECT
            o.id_order, o.order_code, o.order_date, o.total_amount, o.order_status,
            oi.quantity, oi.price_at_purchase, oi.size,
            p.nama as product_name, p.image_url as product_image
        FROM orders o
        JOIN order_items oi ON o.id_order = oi.id_order
        JOIN produk p ON oi.id_produk = p.id_produk
        WHERE o.id_user = ?
        ORDER BY o.order_date DESC;
    `;

  db.query(sql, [id_user], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Database query error", error: err });

    const ordersMap = {};
    results.forEach((row) => {
      if (!ordersMap[row.id_order]) {
        ordersMap[row.id_order] = {
          id_order: row.id_order,
          order_code: row.order_code,
          order_date: row.order_date,
          total_amount: row.total_amount,
          order_status: row.order_status,
          items: [],
        };
      }
      ordersMap[row.id_order].items.push({
        product_name: row.product_name,
        product_image: row.product_image,
        quantity: row.quantity,
        price_at_purchase: row.price_at_purchase,
        size: row.size,
      });
    });

    const orders = Object.values(ordersMap);
    res.status(200).json(orders);
  });
};

exports.cancelOrder = (req, res) => {
  const { orderId } = req.params;
  const id_user = req.user.id_user;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ message: "Transaction Error", error: err });
    }

    const getItemsSql =
      "SELECT id_produk, quantity, size FROM order_items WHERE id_order = ?";
    db.query(getItemsSql, [orderId], (err, items) => {
      if (err) {
        return db.rollback(() =>
          res
            .status(500)
            .json({ message: "Gagal mengambil item pesanan.", error: err })
        );
      }
      if (items.length === 0) {
        return db.rollback(() =>
          res
            .status(404)
            .json({ message: "Item untuk pesanan ini tidak ditemukan." })
        );
      }

      const restoreStockPromises = items.map((item) => {
        return new Promise((resolve, reject) => {
          const restoreStockSql =
            "UPDATE product_stocks SET stok = stok + ? WHERE id_produk = ? AND size = ?";
          db.query(
            restoreStockSql,
            [item.quantity, item.id_produk, item.size],
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
        });
      });

      Promise.all(restoreStockPromises)
        .then(() => {
          const cancelOrderSql =
            "UPDATE orders SET order_status = 'cancelled' WHERE id_order = ? AND id_user = ? AND order_status = 'pending_payment'";
          db.query(cancelOrderSql, [orderId, id_user], (err, result) => {
            if (err) {
              return db.rollback(() =>
                res
                  .status(500)
                  .json({ message: "Gagal membatalkan pesanan.", error: err })
              );
            }
            if (result.affectedRows === 0) {
              return db.rollback(() =>
                res.status(403).json({
                  message:
                    "Pesanan tidak dapat dibatalkan. Mungkin sudah diproses atau bukan milik Anda.",
                })
              );
            }
            db.commit((err) => {
              if (err) {
                return db.rollback(() =>
                  res.status(500).json({ message: "Commit gagal.", error: err })
                );
              }
              res.status(200).json({ message: "Pesanan berhasil dibatalkan." });
            });
          });
        })
        .catch((err) => {
          return db.rollback(() =>
            res
              .status(500)
              .json({ message: "Gagal mengembalikan stok produk.", error: err })
          );
        });
    });
  });
};

exports.getPendingOrders = (req, res) => {
  if (req.user.id_role != 1) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  const sql = `
    SELECT 
      o.id_order, o.order_code, o.order_date, o.total_amount, o.order_status, o.payment_proof_image,
      u.name AS user_name, u.email AS user_email, u.no_handphone AS user_phone,
      addr.alamat_lengkap, addr.kota, addr.provinsi, addr.kode_pos,
      GROUP_CONCAT(
        JSON_OBJECT(
          'product_name', p.nama, 'quantity', oi.quantity, 'size', oi.size,
          'price', oi.price_at_purchase, 'image_url', p.image_url,
          'grade', g.nama_grade, 'category', c.name, 'description', p.deskripsi
        )
      ) AS items
    FROM orders o
    JOIN user u ON o.id_user = u.id_user
    JOIN user_addresses addr ON o.id_address = addr.id_address
    JOIN order_items oi ON o.id_order = oi.id_order
    JOIN produk p ON oi.id_produk = p.id_produk
    LEFT JOIN grades g ON p.id_grade = g.id_grade
    LEFT JOIN category c ON p.id_cat = c.id_cat
    WHERE o.order_status IN ('verifying_payment', 'processing') -- HANYA AMBIL STATUS YANG PERLU AKSI
    GROUP BY o.id_order
    ORDER BY o.order_date ASC; -- Diurutkan dari yang paling lama
  `;

  db.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    const orders = results.map((order) => ({
      ...order,
      items: JSON.parse(`[${order.items}]`),
    }));
    res.status(200).json(orders);
  });
};

// Mengambil semua pesanan untuk ditampilkan di halaman admin
exports.getAllOrders = (req, res) => {
  if (req.user.id_role != 1) {
    return res
      .status(403)
      .json({ message: "Akses ditolak. Rute ini hanya untuk admin." });
  }

  // === QUERY FINAL DENGAN PERBAIKAN TERAKHIR ===
  const sql = `
    SELECT 
      o.id_order, o.order_code, o.order_date, o.total_amount, o.order_status, o.payment_proof_image,
      u.name AS user_name,
      u.email AS user_email,
      u.no_handphone AS user_phone,
      addr.alamat_lengkap, addr.kota, addr.provinsi, addr.kode_pos,
      GROUP_CONCAT(
        JSON_OBJECT(
          'product_name', p.nama,
          'quantity', oi.quantity,
          'size', oi.size,
          'price', oi.price_at_purchase,
          'image_url', p.image_url,
          'grade', g.nama_grade,
          'category', c.name,
          'description', p.deskripsi
        )
      ) AS items
    FROM orders o
    JOIN user u ON o.id_user = u.id_user
    JOIN user_addresses addr ON o.id_address = addr.id_address
    JOIN order_items oi ON o.id_order = oi.id_order
    JOIN produk p ON oi.id_produk = p.id_produk
    LEFT JOIN grades g ON p.id_grade = g.id_grade -- KOREKSI: Kolom di tabel grades adalah id_grade, bukan id.
    LEFT JOIN category c ON p.id_cat = c.id_cat
    GROUP BY o.id_order
    ORDER BY o.order_date DESC;
  `;
  // ===============================================

  db.query(sql, (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database query error", error: err });
    }
    const orders = results.map((order) => {
      try {
        return {
          ...order,
          items: JSON.parse(`[${order.items}]`),
        };
      } catch (e) {
        return { ...order, items: [] };
      }
    });
    res.status(200).json(orders);
  });
};

exports.updateOrderStatus = (req, res) => {
  if (req.user.id_role != 1) {
    return res
      .status(403)
      .json({ message: "Akses ditolak. Rute ini hanya untuk admin." });
  }
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status tidak boleh kosong." });
  }

  const sql = "UPDATE orders SET order_status = ? WHERE id_order = ?";
  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order tidak ditemukan." });
    }
    res
      .status(200)
      .json({ message: `Status pesanan berhasil diubah menjadi ${status}` });
  });
};

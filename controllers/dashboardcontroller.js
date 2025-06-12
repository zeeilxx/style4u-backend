const db = require("../config/db");

const queryPromise = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getDashboardStats = async (req, res) => {
  if (req.user.id_role != 1) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  try {
    const productCountSql = "SELECT COUNT(*) as total FROM produk";

    const orderCountSql = "SELECT COUNT(*) as total FROM orders";

    const monthlyRevenueSql = `
      SELECT SUM(total_amount) as total 
      FROM orders 
      WHERE 
        (order_status = 'shipped' OR order_status = 'completed') 
        AND MONTH(order_date) = MONTH(CURDATE())
        AND YEAR(order_date) = YEAR(CURDATE())
    `;

    // Jalankan semua query secara paralel
    const [productResults, orderResults, revenueResults] = await Promise.all([
      queryPromise(productCountSql),
      queryPromise(orderCountSql),
      queryPromise(monthlyRevenueSql),
    ]);

    const stats = {
      productCount: productResults[0].total || 0,
      orderCount: orderResults[0].total || 0,
      monthlyRevenue: revenueResults[0].total || 0,
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error("Gagal mengambil statistik dashboard:", error);
    res.status(500).json({ message: "Gagal mengambil data statistik", error });
  }
};
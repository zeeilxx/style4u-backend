const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/grades", (req, res) => {
  const sql = "SELECT id_grade AS id, nama_grade FROM grades";

  db.query(sql, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Gagal mengambil data grades", error: err });
    res.status(200).json(results);
  });
});

module.exports = router;

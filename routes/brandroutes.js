const express = require("express");
const router = express.Router();
const db = require("../config/db");


router.get("/brands", (req, res) => {

  const sql = "SELECT id_brand AS id, nama FROM brands"; 

  db.query(sql, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Gagal mengambil data brands", error: err });
    res.status(200).json(results);
  });
});

module.exports = router;
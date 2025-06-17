const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Token diperlukan." });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid." });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.id_role === 1) {
    next();
  } else {
    res.status(401).json({ message: "Akses ditolak. Hanya untuk Admin." });
  }
};

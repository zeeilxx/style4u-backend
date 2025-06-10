const express = require("express");
const bodyParser = require("body-parser");
const categoryRoutes = require("./routes/categoryroutes");
const userRoutes = require("./routes/userroutes");
const cartRoutes = require("./routes/cartroutes");
const adminRoutes = require("./routes/adminroutes");
const produkRoutes = require("./routes/produkroutes");
const productStockRoutes = require("./routes/productstockroutes");
const gradeRoutes = require("./routes/graderoutes");
const brandRoutes = require("./routes/brandroutes");
const wishlistRoutes = require("./routes/wishlistroutes");
const addressRoutes = require("./routes/addressroutes");
const orderRoutes = require("./routes/orderroutes");

const app = express();
const port = process.env.PORT || 3001;

const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.json());
app.use("/api", categoryRoutes);
app.use("/api", userRoutes);
app.use("/api", cartRoutes);
app.use("/api", adminRoutes);
app.use("/api", produkRoutes);
app.use("/api/product-stocks", productStockRoutes);
app.use("/api", gradeRoutes);
app.use("/api", brandRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", addressRoutes);
app.use("/api", orderRoutes);

app.listen(port, () => {
  console.log(`Server berjalan pada port ${port}`);
});

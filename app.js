const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/categoryroutes');
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(bodyParser.json());
// Routing
app.use(userRoutes);
// Menjalankan server
app.listen(port, () => {
 console.log(`Server berjalan pada port ${port}`);
});
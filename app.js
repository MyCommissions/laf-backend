const express = require('express');
const dotenv = require('dotenv');
const dbConnect = require('./database/connection');
const authRoutes = require('./routes/auth.routes');
const itemRoutes = require("./routes/item.routes");
const cors = require('cors');
const cookieParser = require("cookie-parser");

const app = express();

dotenv.config();

const PORT = process.env.PORT || 8000;
const VERSION = process.env.VERSION || v1;

dbConnect();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "https://claime.site", // <-- your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // <-- allow cookies to be sent
  })
);

app.options(
  "*",
  cors({
    origin: "https://claime.site",
    credentials: true,
  })
);

app.use(`/api/${VERSION}/auth`, authRoutes);
app.use(`/api/${VERSION}/item`, itemRoutes);

app.get('/test-cookie', (req, res) => {
  console.log(req.cookies);
  res.json({ cookies: req.cookies });
})

app.get('/', (req, res) => {
    res.json({ message: "Welcome to Backend!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on https://claime.site:${PORT}`);
});
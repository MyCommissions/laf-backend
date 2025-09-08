const express = require('express');
const dotenv = require('dotenv');
const dbConnect = require('./database/connection');
const authRoutes = require('./routes/auth.routes');
const itemRoutes = require("./routes/item.routes");
const cors = require('cors');

const app = express();

dotenv.config();

const PORT = process.env.PORT || 8000;
const VERSION = process.env.VERSION || v1;

dbConnect();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use(`/api/${VERSION}/auth`, authRoutes);
app.use(`/api/${VERSION}/item`, itemRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Welcome to Backend!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
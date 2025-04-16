const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Import Routes
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const itemRoutes = require("./routes/itemRoutes");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require('./routes/userRoutes');

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes); 

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed: " + err.message);
    } else {
        console.log("Connected to MySQL Database");
    }
});

app.get("/", (req, res) => {
    res.send("DOLCE API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

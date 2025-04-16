const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

// DB connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// LOGIN (Staff & Admin)
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ error: "User not found" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Login successful", token, role: user.role });
    });
});

router.get('/:id', (req, res) => {
    const sql = "SELECT id, name, email FROM users WHERE id = ?";
    db.query(sql, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json(results[0]);
    });
  });
  

module.exports = router;

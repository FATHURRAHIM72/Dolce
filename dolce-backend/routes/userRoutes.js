const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
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

// Only return staff users
router.get("/", (req, res) => {
  db.query("SELECT id, name, email, role, created_at FROM users WHERE role = 'staff'", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 Add new user
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, email, hashedPassword, role], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "User added successfully" });
  });
});

// 🔹 Update user
router.put("/:email", async (req, res) => {
  const { name, role, password } = req.body;
  let sql = "UPDATE users SET name = ?, role = ?";
  const params = [name, role];

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    sql += ", password = ?";
    params.push(hashedPassword);
  }

  sql += " WHERE email = ?";
  params.push(req.params.email);

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User updated successfully" });
  });
});


// 🔹 Delete user
router.delete("/:email", (req, res) => {
  db.query("DELETE FROM users WHERE email = ?", [req.params.email], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User deleted successfully" });
  });
});

module.exports = router;

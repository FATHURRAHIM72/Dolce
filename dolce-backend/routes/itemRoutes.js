const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ error: "No token provided" });

    jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

// Multer config for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });


// 🔹 Create Item
router.post("/", authenticateToken, upload.single("image"), (req, res) => {
    const { name, price, category, availability, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const sql = `
        INSERT INTO items (name, price, category, availability, description, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [name, price, category, availability, description, imagePath], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Item added successfully" });
    });
});


// 🔹 Get All Items (Admin – show all)
router.get("/", (req, res) => {
    const sql = `
        SELECT id, name, price, category, availability, image_url AS image, description
        FROM items ORDER BY id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 🔹 Get item options for specific item
router.get('/:id/itemoptions', (req, res) => {
  const itemId = req.params.id;
  const sql = `SELECT id, item_id, name, price FROM item_options WHERE item_id = ? AND availability = 1 ORDER BY id DESC`;
  db.query(sql, [itemId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


// 🔹 Get all unique categories
router.get('/categories', (req, res) => {
    const sql = "SELECT DISTINCT category FROM items";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const categories = results.map(r => r.category);
        res.json(categories);
    });
});


// 🔹 Update Item
router.put("/:id", authenticateToken, upload.single("image"), (req, res) => {
    const { name, price, category, availability, description } = req.body;
    const itemId = req.params.id;

    let sql = `
        UPDATE items
        SET name = ?, price = ?, category = ?, availability = ?, description = ?
    `;
    const params = [name, price, category, availability, description];

    if (req.file) {
        sql += `, image_url = ?`;
        params.push(`/uploads/${req.file.filename}`);
    }

    sql += ` WHERE id = ?`;
    params.push(itemId);

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Item updated successfully" });
    });
});


// 🔹 Delete Item
router.delete("/:id", authenticateToken, (req, res) => {
    const sql = "DELETE FROM items WHERE id = ?";
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Item deleted successfully" });
    });
});

// 🔹 Get all item options (for Admin management)
router.get('/item-options', (req, res) => {
  const sql = `
    SELECT io.id, io.item_id, io.name, io.price, io.availability, i.name AS item_name
    FROM item_options io
    JOIN items i ON io.item_id = i.id
    ORDER BY io.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});




// Add item option
router.post('/item-options', (req, res) => {
  const { item_id, name, price, availability = 1 } = req.body;
  const sql = `
    INSERT INTO item_options (item_id, name, price, availability)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [item_id, name, price, availability], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Option added successfully" });
  });
});
  
  // Update item option
  router.put('/item-options/:id', (req, res) => {
    const { item_id, name, price, availability } = req.body;
    const { id } = req.params;
    const sql = `
      UPDATE item_options SET item_id = ?, name = ?, price = ?, availability = ?
      WHERE id = ?
    `;
    db.query(sql, [item_id, name, price, availability, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Option updated successfully" });
    });
  });
  
  
  // Delete item option
  router.delete('/item-options/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM item_options WHERE id = ?`;
    db.query(sql, [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Option deleted successfully" });
    });
  });
  


module.exports = router;

const express = require("express");
const mysql = require("mysql2");
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

// Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ error: "No token provided" });

    jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

// Place Order (Customer)
// ✅ Place Order (Customer)
router.post("/", (req, res) => {
  const { tableNumber, items, paymentMethod } = req.body;

  if (!tableNumber || !items || items.length === 0) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const sql = "INSERT INTO orders (table_number, payment_status, payment_method) VALUES (?, ?, ?)";
  db.query(sql, [tableNumber, paymentMethod === 'counter' ? 'pending' : 'paid', paymentMethod], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const orderId = result.insertId;

    // Insert items using a batch insert (for better performance)
    const values = items.map(item => [orderId, item.id, item.quantity, item.options || '', item.subtotal]);
    const itemSql = "INSERT INTO order_items (order_id, item_id, quantity, options, subtotal) VALUES ?";

    db.query(itemSql, [values], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // ✅ Include orderId in response so frontend can redirect correctly
      res.status(201).json({
        message: "Order placed successfully",
        insertId: orderId
      });
    });
  });
});

  

// Get Orders (Staff use)
router.get("/", authenticateToken, (req, res) => {
  const sql = `
    SELECT
      o.id AS order_id, o.table_number, o.status, o.payment_status, o.payment_method, o.created_at, o.cancelled_at,
      i.name AS item_name, oi.quantity, oi.options, oi.subtotal
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN items i ON oi.item_id = i.id
    WHERE o.status != 'served'
    ORDER BY o.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const ordersMap = {};

    results.forEach(row => {
      const orderId = row.order_id;
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          id: orderId,
          table_number: row.table_number,
          status: row.status,
          payment_status: row.payment_status,
          payment_method: row.payment_method,
          created_at: row.created_at,
          items: []
        };
      }

      if (row.item_name) {
        ordersMap[orderId].items.push({
          name: row.item_name,
          quantity: row.quantity,
          options: row.options,
          subtotal: row.subtotal
        });
      }
    });

    const orders = Object.values(ordersMap);
    res.json(orders);
  });
});



// 🆓 Public route to get all unserved orders (no token required) 
router.get("/public", (req, res) => {
  const sql = `
    SELECT 
     o.id AS order_id, o.table_number, o.status, o.payment_status, o.payment_method, o.created_at,
      i.name AS item_name, oi.quantity, oi.options, oi.subtotal
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN items i ON oi.item_id = i.id
    WHERE o.status != 'served'
    ORDER BY o.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const ordersMap = {};

    results.forEach(row => {
      const orderId = row.order_id;
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          id: orderId,
          table_number: row.table_number,
          status: row.status,
          payment_status: row.payment_status,
          payment_method: row.payment_method,
          created_at: row.created_at, 
          items: []
        };
      }

      if (row.item_name) {
        ordersMap[orderId].items.push({
          name: row.item_name,
          quantity: row.quantity,
          options: row.options,
          subtotal: row.subtotal
        });
      }
    });

    const orders = Object.values(ordersMap);
    res.json(orders);
  });
});


// ✅ Get order history (served + cancelled)
router.get("/history", authenticateToken, (req, res) => {
  const sql = `
    SELECT
      o.id AS order_id, o.table_number, o.status, o.payment_status, o.payment_method, o.created_at, o.served_at, o.cancelled_at,
      i.name AS item_name, oi.quantity, oi.options, oi.subtotal
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN items i ON oi.item_id = i.id
    WHERE o.status IN ('served', 'cancelled') -- ✅ include cancelled
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const ordersMap = {};
    results.forEach(row => {
      const orderId = row.order_id;
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          id: orderId,
          table_number: row.table_number,
          status: row.status,
          created_at: row.created_at,
          served_at: row.served_at,
          cancelled_at: row.cancelled_at,
          payment_status: row.payment_status,
          payment_method: row.payment_method,
          items: []
        };
      }

      if (row.item_name) {
        ordersMap[orderId].items.push({
          name: row.item_name,
          quantity: row.quantity,
          options: row.options,
          subtotal: row.subtotal
        });
      }
    });

    const orders = Object.values(ordersMap);
    res.json(orders);
  });
});


// 🔹 Get all counter orders with pending payments
router.get('/pending-payments', (req, res) => {
  const sql = `
    SELECT
      o.id AS order_id, o.table_number, o.status, o.payment_status, o.payment_method, o.created_at, o.served_at,
      i.name AS item_name, oi.quantity, oi.options,  oi.subtotal
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN items i ON oi.item_id = i.id
    WHERE o.payment_status = 'pending' AND o.payment_method = 'counter'
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const ordersMap = {};

    results.forEach(row => {
      const orderId = row.order_id;
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          id: orderId,
          table_number: row.table_number,
          status: row.status,
          payment_status: row.payment_status,
          payment_method: row.payment_method,
          created_at: row.created_at,
          served_at: row.served_at,
          items: []
        };
      }

      if (row.item_name) {
        ordersMap[orderId].items.push({
          name: row.item_name,
          quantity: row.quantity,
          options: row.options,
          subtotal: row.subtotal
        });
      }
    });

    const orders = Object.values(ordersMap);
    res.json(orders);
  });
});

// 🔹 Confirm payment for counter orders
router.put('/:id/confirm-payment', (req, res) => {
  const sql = `
    UPDATE orders
    SET payment_status = 'paid'
    WHERE id = ? AND payment_status = 'pending' AND payment_method = 'counter'
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'No matching pending payment found for this order.' });
    }

    res.json({ message: 'Payment confirmed successfully' });
  });
});



// Cancel order (Only if still in pending or preparing)
router.put("/:id/cancel", (req, res) => {
  const sql = `
    UPDATE orders 
    SET status = 'cancelled', cancelled_at = NOW() 
    WHERE id = ? AND status IN ('pending', 'preparing')
  `;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Order cannot be cancelled (already served or doesn't exist)." });
    }
    res.json({ message: "Order cancelled successfully" });
  });
});

router.put("/:id/status", authenticateToken, (req, res) => {
  const { status } = req.body;

  const sql =
    status === 'served'
      ? "UPDATE orders SET status = ?, served_at = NOW() WHERE id = ?"
      : "UPDATE orders SET status = ? WHERE id = ?";

  db.query(sql, [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Order status updated" });
  });
});





module.exports = router;

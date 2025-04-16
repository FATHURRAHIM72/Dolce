const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// 📊 Get Sales Summary
router.get("/", (req, res) => {
    const summary = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        bestSelling: []
    };

    const dailySql = `
        SELECT SUM(oi.subtotal) AS total
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE DATE(o.created_at) = CURDATE()
    `;

    const weeklySql = `
        SELECT SUM(oi.subtotal) AS total
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE YEARWEEK(o.created_at) = YEARWEEK(CURDATE())
    `;

    const monthlySql = `
        SELECT SUM(oi.subtotal) AS total
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE MONTH(o.created_at) = MONTH(CURDATE())
          AND YEAR(o.created_at) = YEAR(CURDATE())
    `;

    const bestSql = `
        SELECT i.name, SUM(oi.quantity) AS total_sales
        FROM order_items oi
        JOIN items i ON oi.item_id = i.id
        GROUP BY oi.item_id
        ORDER BY total_sales DESC
        LIMIT 5
    `;

    db.query(dailySql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        summary.daily = result[0].total || 0;

        db.query(weeklySql, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            summary.weekly = result[0].total || 0;

            db.query(monthlySql, (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                summary.monthly = result[0].total || 0;

                db.query(bestSql, (err, results) => {
                    if (err) return res.status(500).json({ error: err.message });
                    summary.bestSelling = results || [];
                    res.json(summary);
                });
            });
        });
    });
});

// 📈 Sales Trend Over Time (within date range)
router.get("/trend", (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: "Start and end dates are required" });
    }

    const sql = `
        SELECT DATE(o.created_at) AS date, SUM(oi.subtotal) AS total
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at)
    `;

    db.query(sql, [start, end], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


module.exports = router;

import express from 'express';
import pool from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get total products count
    const [productsCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM products'
    );

    // Get active loans amount (only approved loans)
    const [activeLoans] = await connection.execute(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM loans 
      WHERE status = 'approved' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `);

    // Get weather alerts count
    const [weatherAlerts] = await connection.execute(
      'SELECT COUNT(*) as total FROM weather_alerts WHERE end_date > NOW()'
    );

    // Get monthly revenue
    const [monthlyRevenue] = await connection.execute(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status = 'completed' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `);

    // Get recent products
    const [recentProducts] = await connection.execute(
      'SELECT name, stock FROM products ORDER BY created_at DESC LIMIT 3'
    );

    // Get recent loans
    const [recentLoans] = await connection.execute(`
      SELECT type as name, amount 
      FROM loans 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    connection.release();

    res.json({
      totalProducts: productsCount[0].total,
      activeLoans: Number(activeLoans[0].total) || 0,
      weatherAlerts: weatherAlerts[0].total,
      monthlyRevenue: monthlyRevenue[0].total,
      recentProducts,
      recentLoans
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router; 
import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'name', p.name,
                 'quantity', oi.quantity,
                 'price_per_unit', oi.price_per_unit,
                 'total_price', oi.total_price
               )
             ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create new order
router.post('/',
  authenticateToken,
  [
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.productId').isInt().withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Calculate total and verify stock
      let total = 0;
      const items = req.body.items;
      
      for (const item of items) {
        const [products] = await connection.execute(
          'SELECT price, stock FROM products WHERE id = ? FOR UPDATE',
          [item.productId]
        );

        if (products.length === 0) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const product = products[0];
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        total += product.price * item.quantity;

        // Update stock
        await connection.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      }

      // Create order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [req.user.id, total, 'pending']
      );

      // Create order items
      for (const item of items) {
        const [products] = await connection.execute(
          'SELECT price FROM products WHERE id = ?',
          [item.productId]
        );
        
        await connection.execute(
          `INSERT INTO order_items 
           (order_id, product_id, quantity, price_per_unit, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderResult.insertId,
            item.productId,
            item.quantity,
            products[0].price,
            products[0].price * item.quantity,
          ]
        );
      }

      await connection.commit();
      
      // Fetch the complete order
      const [order] = await connection.execute(`
        SELECT o.*, 
               JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'name', p.name,
                   'quantity', oi.quantity,
                   'price_per_unit', oi.price_per_unit,
                   'total_price', oi.total_price
                 )
               ) as items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.id = ?
        GROUP BY o.id
      `, [orderResult.insertId]);

      res.status(201).json(order[0]);
    } catch (error) {
      await connection.rollback();
      res.status(400).json({ error: error.message });
    } finally {
      connection.release();
    }
  }
);

export default router;
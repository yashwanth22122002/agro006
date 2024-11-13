import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product (admin only)
router.post('/',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category').isIn(['Seeds', 'Fertilizers', 'Pesticides']).withMessage('Invalid category'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    body('image_url').isURL().withMessage('Valid image URL is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add products' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, category, price, stock, image_url, description } = req.body;
      const [result] = await pool.execute(
        'INSERT INTO products (name, category, price, stock, image_url, description) VALUES (?, ?, ?, ?, ?, ?)',
        [name, category, price, stock, image_url, description]
      );

      const [newProduct] = await pool.execute(
        'SELECT * FROM products WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(newProduct[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// Update product (admin only)
router.put('/:id',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category').isIn(['Seeds', 'Fertilizers', 'Pesticides']).withMessage('Invalid category'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    body('image_url').isURL().withMessage('Valid image URL is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update products' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, category, price, stock, image_url, description } = req.body;
      const [result] = await pool.execute(
        `UPDATE products 
         SET name = ?, category = ?, price = ?, stock = ?, image_url = ?, description = ?, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, category, price, stock, image_url, description, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const [updatedProduct] = await pool.execute(
        'SELECT * FROM products WHERE id = ?',
        [req.params.id]
      );

      res.json(updatedProduct[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// Delete product (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete products' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
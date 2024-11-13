import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get farmer's crops
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM crops WHERE farmer_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// Get crop guides (public)
router.get('/guides', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM crop_guides');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

// Add more routes for CRUD operations

export default router; 
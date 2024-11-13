import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all loans for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// Get all loans (admin only)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [rows] = await pool.execute(`
      SELECT 
        l.*,
        u.username,
        u.email
      FROM loans l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);

    console.log('Fetched loans:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// Apply for a new loan
router.post('/',
  authenticateToken,
  [
    body('amount').isFloat({ min: 1000 }),
    body('interest_rate').isFloat({ min: 0 }),
    body('term_months').isInt({ min: 1 }),
    body('type').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { amount, interest_rate, term_months, type } = req.body;
      const [result] = await pool.execute(
        'INSERT INTO loans (user_id, amount, interest_rate, term_months, type, status) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, amount, interest_rate, term_months, type, 'pending']
      );

      res.status(201).json({ id: result.insertId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create loan application' });
    }
  }
);

// Update loan status (admin only)
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Update loan status
    const [result] = await pool.execute(
      'UPDATE loans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Get updated loan details
    const [updatedLoan] = await pool.execute(
      `SELECT l.*, u.username 
       FROM loans l 
       JOIN users u ON l.user_id = u.id 
       WHERE l.id = ?`,
      [req.params.id]
    );

    res.json(updatedLoan[0]);
  } catch (error) {
    console.error('Loan status update error:', error);
    res.status(500).json({ error: 'Failed to update loan status' });
  }
});

export default router;
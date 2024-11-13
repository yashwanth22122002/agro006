import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/init.js';

const router = express.Router();

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log(`Auth Route: ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

// Register new user (only farmers can register)
router.post('/register',
  [
    body('username').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').equals('farmer'),
  ],
  async (req, res) => {
    try {
      console.log('Processing registration request');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { username, email, password, role } = req.body;

      // Check if username or email already exists
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUsers.length > 0) {
        console.log('User already exists:', username);
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role]
      );

      console.log('User registered successfully:', result.insertId);

      const token = jwt.sign(
        { id: result.insertId, username, role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: result.insertId,
          username,
          email,
          role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

// Login user
router.post('/login',
  [
    body('username').notEmpty().trim(),
    body('password').notEmpty(),
    body('role').isIn(['admin', 'farmer']),
  ],
  async (req, res) => {
    try {
      console.log('Processing login request:', req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { username, password, role } = req.body;
      console.log('Login attempt for:', { username, role });

      // Get user with the given username and role
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE username = ? AND role = ?',
        [username, role]
      );

      console.log('Found users:', users.length);

      if (users.length === 0) {
        console.log('No user found with these credentials');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password validation:', isValidPassword);

      if (!isValidPassword) {
        console.log('Invalid password');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send response
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login. Please try again.' });
    }
  }
);

export default router;
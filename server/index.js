import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products.js';
import loansRouter from './routes/loans.js';
import weatherRouter from './routes/weather.js';
import authRouter from './routes/auth.js';
import ordersRouter from './routes/orders.js';
import dashboardRouter from './routes/dashboard.js';
import { initializeDatabase } from './database/init.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON and handling CORS
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware - place this before routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize database
try {
  await initializeDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/loans', loansRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler - place this after your routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
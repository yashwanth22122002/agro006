import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

console.log('Database configuration:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: process.env.DB_NAME || 'agromanage'
});

// Create initial connection to create database if it doesn't exist
const initialPool = mysql.createPool(dbConfig);

// Create the main connection pool with database selected
const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME || 'agromanage'
});

export async function initializeDatabase() {
  let initialConnection;
  try {
    console.log('Attempting to initialize database...');
    initialConnection = await initialPool.getConnection();
    
    // Create database if it doesn't exist
    await initialConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'agromanage'}`
    );
    console.log('Database created or already exists');
    
    // Switch to the database
    await initialConnection.query(`USE ${process.env.DB_NAME || 'agromanage'}`);
    console.log('Switched to database');
    
    // Create tables
    console.log('Creating tables...');
    
    await initialConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'farmer') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created');

    await initialConnection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        category ENUM('Seeds', 'Fertilizers', 'Pesticides') NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        image_url TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Products table created');

    await initialConnection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    console.log('Orders table created');

    await initialConnection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      )
    `);
    console.log('Order items table created');

    await initialConnection.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        term_months INT NOT NULL,
        type VARCHAR(100) NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'paid') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    console.log('Loans table created');

    await initialConnection.query(`
      CREATE TABLE IF NOT EXISTS weather_alerts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type VARCHAR(100) NOT NULL,
        severity ENUM('low', 'medium', 'high') NOT NULL,
        description TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Weather alerts table created');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    try {
      await initialConnection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@agromanage.com', hashedPassword, 'admin']
      );
      console.log('Default admin user created');
    } catch (error) {
      // Ignore duplicate entry error
      if (error.code !== 'ER_DUP_ENTRY') {
        throw error;
      } else {
        console.log('Admin user already exists');
      }
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    if (initialConnection) {
      initialConnection.release();
    }
    await initialPool.end();
  }
}

// Test the main connection pool
try {
  const connection = await pool.getConnection();
  console.log('Database connection test successful');
  
  // Verify admin user exists
  const [adminUsers] = await connection.execute(
    'SELECT id, username, role FROM users WHERE username = ? AND role = ?',
    ['admin', 'admin']
  );
  console.log('Admin user verification:', adminUsers.length > 0 ? 'Found' : 'Not found');
  
  connection.release();
} catch (error) {
  console.error('Database connection test failed:', error);
  process.exit(1);
}

export default pool;
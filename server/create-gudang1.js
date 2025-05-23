const mysql = require('mysql2/promise');
require('dotenv').config();

async function createGudang1Database() {
  let connection;
  
  try {
    console.log('🚂 Creating gudang1 database in Railway...');
    
    // Connect to Railway (default database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME, // Connect to 'railway' database first
      connectTimeout: 30000
    });
    
    console.log('✅ Connected to Railway MySQL');
    
    // Create gudang1 database
    await connection.query('CREATE DATABASE IF NOT EXISTS gudang1');
    console.log('✅ Database "gudang1" created successfully');
    
    // Switch to gudang1 database
    await connection.query('USE gudang1');
    console.log('✅ Switched to gudang1 database');
    
    // Create essential tables
    console.log('📊 Creating tables...');
    
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id varchar(36) PRIMARY KEY,
        username varchar(255) NOT NULL,
        email varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        role enum('admin','manager','user') DEFAULT 'user',
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');
    
    // Categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id int AUTO_INCREMENT PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created categories table');
    
    // Items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS items (
        id int AUTO_INCREMENT PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        category_id int,
        quantity int DEFAULT 0,
        min_quantity int DEFAULT 0,
        unit varchar(50),
        price decimal(10,2),
        status enum('in-stock','low-stock','out-of-stock') DEFAULT 'in-stock',
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);
    console.log('✅ Created items table');
    
    // Requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id int AUTO_INCREMENT PRIMARY KEY,
        user_id varchar(36),
        status enum('pending','approved','rejected','completed') DEFAULT 'pending',
        notes text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Created requests table');
    
    // Request items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS request_items (
        id int AUTO_INCREMENT PRIMARY KEY,
        request_id int,
        item_id int,
        quantity int NOT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES requests(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      )
    `);
    console.log('✅ Created request_items table');
    
    // Insert sample data
    console.log('📊 Inserting sample data...');
    
    // Insert users
    await connection.query(`
      INSERT IGNORE INTO users (id, username, email, password, role) VALUES 
      ('admin-1', 'Admin', 'admin@gudangmitra.com', 'password123', 'admin'),
      ('manager-1', 'Manager User', 'manager@gudangmitra.com', 'password123', 'manager'),
      ('user-1', 'Bob', 'bob@example.com', 'password', 'user'),
      ('user-2', 'User', 'user@example.com', 'password123', 'user')
    `);
    console.log('✅ Inserted sample users');
    
    // Insert categories
    await connection.query(`
      INSERT IGNORE INTO categories (id, name, description) VALUES 
      (1, 'Electronics', 'Electronic devices and components'),
      (2, 'Office Supplies', 'Office equipment and supplies'),
      (3, 'Tools', 'Various tools and equipment'),
      (4, 'Cleaning Materials', 'Cleaning supplies and materials')
    `);
    console.log('✅ Inserted sample categories');
    
    // Insert items
    await connection.query(`
      INSERT IGNORE INTO items (id, name, description, category_id, quantity, min_quantity, unit, price, status) VALUES 
      (1, 'Laptop', 'Dell Laptop', 1, 10, 5, 'pcs', 1000.00, 'in-stock'),
      (2, 'Mouse', 'Wireless Mouse', 1, 25, 10, 'pcs', 25.00, 'in-stock'),
      (3, 'Keyboard', 'Mechanical Keyboard', 1, 15, 5, 'pcs', 75.00, 'in-stock'),
      (4, 'Printer Paper', 'A4 Paper', 2, 100, 20, 'reams', 5.00, 'in-stock'),
      (5, 'Cleaning Spray', 'Multi-purpose cleaning spray', 4, 25, 10, 'bottles', 15.00, 'in-stock')
    `);
    console.log('✅ Inserted sample items');
    
    // Verify setup
    console.log('🔍 Verifying setup...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Found ${tables.length} tables:`, tables.map(t => Object.values(t)[0]));
    
    // Check data counts
    for (const table of ['users', 'categories', 'items']) {
      const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${count[0].count} records`);
    }
    
    await connection.end();
    
    console.log('\n🎉 Railway database setup complete!');
    console.log('✅ Database "gudang1" created with all tables and sample data');
    console.log('✅ Ready to run the application with Railway database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      await connection.end();
    }
  }
}

createGudang1Database();

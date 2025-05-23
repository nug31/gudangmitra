/**
 * Setup Railway Tables and Data
 * 
 * This script creates all necessary tables and imports data to Railway MySQL.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function heading(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
}

// Railway configuration
const railwayConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT),
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  database: 'railway', // Use the default Railway database
  multipleStatements: true
};

async function setupRailwayTables() {
  let connection;
  
  try {
    heading('🚂 Setting Up Railway MySQL Tables');
    
    info('Railway Configuration:');
    log(`  Host: ${railwayConfig.host}`);
    log(`  Port: ${railwayConfig.port}`);
    log(`  Database: ${railwayConfig.database}`);
    
    // Connect to Railway
    info('Connecting to Railway MySQL...');
    connection = await mysql.createConnection(railwayConfig);
    success('Connected to Railway MySQL!');
    
    // Step 1: Drop existing tables if they exist
    heading('Step 1: Cleaning up existing tables');
    
    const tablesToDrop = ['pickup_details', 'request_items', 'requests', 'notifications', 'items', 'categories', 'users'];
    
    for (const table of tablesToDrop) {
      try {
        await connection.query(`DROP TABLE IF EXISTS ${table}`);
        info(`Dropped table: ${table}`);
      } catch (err) {
        warning(`Could not drop table ${table}: ${err.message}`);
      }
    }
    
    // Step 2: Create tables
    heading('Step 2: Creating tables');
    
    // Create users table
    await connection.query(`
      CREATE TABLE users (
        id varchar(36) PRIMARY KEY,
        username varchar(255) NOT NULL,
        email varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        role enum('admin','manager','user') DEFAULT 'user',
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    success('Created users table');
    
    // Create categories table
    await connection.query(`
      CREATE TABLE categories (
        id int AUTO_INCREMENT PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);
    success('Created categories table');
    
    // Create items table
    await connection.query(`
      CREATE TABLE items (
        id int AUTO_INCREMENT PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        category_id int,
        quantity int DEFAULT 0,
        unit varchar(50),
        location varchar(255),
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);
    success('Created items table');
    
    // Create requests table
    await connection.query(`
      CREATE TABLE requests (
        id varchar(36) PRIMARY KEY,
        project_name varchar(255) NOT NULL,
        requester_id varchar(36) NOT NULL,
        reason text,
        priority enum('low','medium','high') DEFAULT 'medium',
        due_date date,
        status enum('pending','approved','rejected','completed') DEFAULT 'pending',
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id)
      )
    `);
    success('Created requests table');
    
    // Create request_items table
    await connection.query(`
      CREATE TABLE request_items (
        id int AUTO_INCREMENT PRIMARY KEY,
        request_id varchar(36) NOT NULL,
        item_id int NOT NULL,
        quantity int NOT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES requests(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      )
    `);
    success('Created request_items table');
    
    // Create notifications table
    await connection.query(`
      CREATE TABLE notifications (
        id int AUTO_INCREMENT PRIMARY KEY,
        user_id varchar(36) NOT NULL,
        message text NOT NULL,
        type enum('info','success','warning','error') DEFAULT 'info',
        is_read boolean DEFAULT false,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    success('Created notifications table');
    
    // Step 3: Insert sample data
    heading('Step 3: Inserting sample data');
    
    // Insert users
    await connection.query(`
      INSERT INTO users (id, username, email, password, role) VALUES 
      ('admin-1', 'Admin', 'admin@gudangmitra.com', 'password123', 'admin'),
      ('manager-1', 'Manager', 'manager@gudangmitra.com', 'password123', 'manager'),
      ('user-1', 'User', 'user@gudangmitra.com', 'password123', 'user')
    `);
    success('Inserted sample users');
    
    // Insert categories
    await connection.query(`
      INSERT INTO categories (id, name, description) VALUES 
      (1, 'Electronics', 'Electronic devices and components'),
      (2, 'Office Supplies', 'Office equipment and supplies'),
      (3, 'Tools', 'Various tools and equipment'),
      (4, 'Furniture', 'Office and warehouse furniture'),
      (5, 'Safety Equipment', 'Safety gear and equipment')
    `);
    success('Inserted sample categories');
    
    // Insert items (more comprehensive list)
    await connection.query(`
      INSERT INTO items (id, name, description, category_id, quantity, unit, location) VALUES 
      (1, 'Laptop Dell Inspiron', 'Dell Inspiron 15 3000 Series', 1, 10, 'pcs', 'Warehouse A-1'),
      (2, 'Wireless Mouse', 'Logitech M705 Wireless Mouse', 1, 25, 'pcs', 'Warehouse A-2'),
      (3, 'Mechanical Keyboard', 'Corsair K95 RGB Platinum', 1, 15, 'pcs', 'Warehouse A-2'),
      (4, 'Monitor 24 inch', 'ASUS VA24EHE 24 inch Monitor', 1, 8, 'pcs', 'Warehouse A-3'),
      (5, 'Printer Paper A4', 'HVS 80gsm A4 Paper', 2, 100, 'reams', 'Warehouse B-1'),
      (6, 'Ballpoint Pen', 'Pilot G2 Gel Pen Blue', 2, 200, 'pcs', 'Warehouse B-2'),
      (7, 'Stapler', 'Heavy Duty Stapler', 2, 12, 'pcs', 'Warehouse B-2'),
      (8, 'Screwdriver Set', 'Phillips and Flathead Set', 3, 20, 'sets', 'Warehouse C-1'),
      (9, 'Drill Machine', 'Bosch GSB 550 Impact Drill', 3, 5, 'pcs', 'Warehouse C-1'),
      (10, 'Office Chair', 'Ergonomic Office Chair', 4, 15, 'pcs', 'Warehouse D-1'),
      (11, 'Desk Lamp', 'LED Desk Lamp Adjustable', 4, 30, 'pcs', 'Warehouse D-2'),
      (12, 'Safety Helmet', 'Construction Safety Helmet', 5, 50, 'pcs', 'Warehouse E-1'),
      (13, 'Safety Gloves', 'Cut Resistant Work Gloves', 5, 100, 'pairs', 'Warehouse E-1'),
      (14, 'First Aid Kit', 'Complete First Aid Kit', 5, 10, 'kits', 'Warehouse E-2'),
      (15, 'Cable Organizer', 'Desk Cable Management Tray', 1, 40, 'pcs', 'Warehouse A-4')
    `);
    success('Inserted sample items');
    
    // Insert sample requests
    await connection.query(`
      INSERT INTO requests (id, project_name, requester_id, reason, priority, due_date, status) VALUES 
      ('req-1', 'Office Setup Project', 'user-1', 'Setting up new office space', 'high', '2024-02-15', 'pending'),
      ('req-2', 'Warehouse Maintenance', 'manager-1', 'Monthly maintenance supplies', 'medium', '2024-02-20', 'approved'),
      ('req-3', 'IT Equipment Upgrade', 'user-1', 'Upgrading old computers', 'high', '2024-02-10', 'pending')
    `);
    success('Inserted sample requests');
    
    // Insert request items
    await connection.query(`
      INSERT INTO request_items (request_id, item_id, quantity) VALUES 
      ('req-1', 1, 2),
      ('req-1', 2, 2),
      ('req-1', 10, 2),
      ('req-2', 8, 1),
      ('req-2', 12, 5),
      ('req-3', 1, 3),
      ('req-3', 4, 3)
    `);
    success('Inserted sample request items');
    
    // Step 4: Verify the setup
    heading('Step 4: Verifying setup');
    
    const [tables] = await connection.query('SHOW TABLES');
    success(`Created ${tables.length} tables:`);
    tables.forEach(table => {
      log(`  - ${Object.values(table)[0]}`);
    });
    
    // Check data counts
    const tableNames = ['users', 'categories', 'items', 'requests', 'request_items', 'notifications'];
    for (const tableName of tableNames) {
      try {
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        success(`${tableName}: ${count[0].count} records`);
      } catch (err) {
        warning(`Could not count ${tableName}: ${err.message}`);
      }
    }
    
    await connection.end();
    
    heading('🎉 Railway Database Setup Complete!');
    success('Your Railway MySQL database is now ready with all tables and sample data');
    
    info('Next steps:');
    info('1. Refresh your Railway dashboard to see the tables');
    info('2. Test your application with the Railway database');
    info('3. Deploy your application to production');
    
  } catch (err) {
    error(`Setup failed: ${err.message}`);
    console.error(err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Validate configuration
if (!railwayConfig.host || !railwayConfig.user || !railwayConfig.password) {
  error('Missing Railway configuration!');
  info('Please check your .env file');
  process.exit(1);
}

setupRailwayTables();

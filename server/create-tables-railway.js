/**
 * Create Essential Tables in Railway
 * 
 * This script creates the essential tables needed for the application.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const railwayConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT),
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  database: process.env.AWS_RDS_DATABASE,
};

async function createTables() {
  let connection;
  
  try {
    console.log('🚂 Creating Essential Tables in Railway');
    
    connection = await mysql.createConnection(railwayConfig);
    console.log('✅ Connected to Railway MySQL');
    
    // Create tables in dependency order
    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id varchar(36) PRIMARY KEY,
          username varchar(255) NOT NULL,
          email varchar(255) UNIQUE NOT NULL,
          password varchar(255) NOT NULL,
          role enum('admin','manager','user') DEFAULT 'user',
          created_at timestamp DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'categories',
        sql: `CREATE TABLE IF NOT EXISTS categories (
          id int AUTO_INCREMENT PRIMARY KEY,
          name varchar(255) NOT NULL,
          description text,
          created_at timestamp DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'items',
        sql: `CREATE TABLE IF NOT EXISTS items (
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
        )`
      },
      {
        name: 'requests',
        sql: `CREATE TABLE IF NOT EXISTS requests (
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
        )`
      },
      {
        name: 'request_items',
        sql: `CREATE TABLE IF NOT EXISTS request_items (
          id int AUTO_INCREMENT PRIMARY KEY,
          request_id varchar(36) NOT NULL,
          item_id int NOT NULL,
          quantity int NOT NULL,
          created_at timestamp DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (request_id) REFERENCES requests(id),
          FOREIGN KEY (item_id) REFERENCES items(id)
        )`
      },
      {
        name: 'notifications',
        sql: `CREATE TABLE IF NOT EXISTS notifications (
          id int AUTO_INCREMENT PRIMARY KEY,
          user_id varchar(36) NOT NULL,
          message text NOT NULL,
          type enum('info','success','warning','error') DEFAULT 'info',
          is_read boolean DEFAULT false,
          created_at timestamp DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`
      }
    ];
    
    // Create tables
    for (const table of tables) {
      try {
        await connection.query(table.sql);
        console.log(`✅ Created table: ${table.name}`);
      } catch (err) {
        console.log(`⚠️ Table ${table.name}: ${err.message}`);
      }
    }
    
    // Insert sample data
    console.log('\n📊 Inserting sample data...');
    
    // Insert admin user
    try {
      await connection.query(`
        INSERT IGNORE INTO users (id, username, email, password, role) 
        VALUES ('admin-1', 'Admin', 'admin@gudangmitra.com', 'password123', 'admin')
      `);
      console.log('✅ Admin user created');
    } catch (err) {
      console.log('⚠️ Admin user:', err.message);
    }
    
    // Insert sample categories
    try {
      await connection.query(`
        INSERT IGNORE INTO categories (id, name, description) VALUES 
        (1, 'Electronics', 'Electronic devices and components'),
        (2, 'Office Supplies', 'Office equipment and supplies'),
        (3, 'Tools', 'Various tools and equipment')
      `);
      console.log('✅ Sample categories created');
    } catch (err) {
      console.log('⚠️ Categories:', err.message);
    }
    
    // Insert sample items
    try {
      await connection.query(`
        INSERT IGNORE INTO items (id, name, description, category_id, quantity, unit) VALUES 
        (1, 'Laptop', 'Dell Laptop', 1, 10, 'pcs'),
        (2, 'Mouse', 'Wireless Mouse', 1, 25, 'pcs'),
        (3, 'Keyboard', 'Mechanical Keyboard', 1, 15, 'pcs'),
        (4, 'Printer Paper', 'A4 Paper', 2, 100, 'reams'),
        (5, 'Screwdriver', 'Phillips Head Screwdriver', 3, 20, 'pcs')
      `);
      console.log('✅ Sample items created');
    } catch (err) {
      console.log('⚠️ Items:', err.message);
    }
    
    // Verify tables
    console.log('\n🔍 Verifying tables...');
    const [tables_result] = await connection.query('SHOW TABLES');
    console.log('Tables created:');
    tables_result.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    // Check data counts
    for (const table of ['users', 'categories', 'items']) {
      try {
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${count[0].count} records`);
      } catch (err) {
        console.log(`  ${table}: Error - ${err.message}`);
      }
    }
    
    await connection.end();
    console.log('\n🎉 Railway database setup complete!');
    console.log('Your application should now work with Railway MySQL');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTables();

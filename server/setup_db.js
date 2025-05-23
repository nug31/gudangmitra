const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Database connection configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "gudang1",
  multipleStatements: true, // Allow multiple SQL statements
};

async function setupDatabase() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);

    console.log("Connected to the database");

    // Check if items table exists and add status column if needed
    console.log("Checking items table...");
    const [columns] = await connection.query("DESCRIBE items");
    const hasStatusColumn = columns.some((col) => col.Field === "status");

    if (!hasStatusColumn) {
      console.log("Adding status column to items table...");
      await connection.query(`
        ALTER TABLE items
        ADD COLUMN status ENUM('in-stock', 'low-stock', 'out-of-stock') NOT NULL DEFAULT 'in-stock'
      `);
    }

    // Create categories table
    console.log("Creating categories table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      )
    `);

    // Check if users table exists
    console.log("Checking users table...");
    try {
      await connection.query("DESCRIBE users");
      console.log("Users table already exists");
    } catch (error) {
      console.log("Creating users table...");
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'manager', 'user') NOT NULL,
          department VARCHAR(100),
          avatar_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Check if requests table exists
    console.log("Checking requests table...");
    try {
      await connection.query("DESCRIBE requests");
      console.log("Requests table already exists");
    } catch (error) {
      console.log("Creating requests table...");
      await connection.query(`
        CREATE TABLE IF NOT EXISTS requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          itemId INT NOT NULL,
          itemName VARCHAR(255) NOT NULL,
          quantity INT NOT NULL,
          priority ENUM('high', 'medium', 'low') NOT NULL,
          status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL,
          description TEXT,
          requestedDeliveryDate DATE,
          attachment VARCHAR(255),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (itemId) REFERENCES items(id)
        )
      `);
    }

    // Check if items table has data
    console.log("Checking if items table has data...");
    const [itemCount] = await connection.query(
      "SELECT COUNT(*) as count FROM items"
    );

    if (itemCount[0].count === 0) {
      // Insert sample data for items
      console.log("Inserting sample items...");
      await connection.query(`
        INSERT INTO items (name, description, category, quantity, minQuantity, status) VALUES
        ('Dell XPS 13 Laptop', 'High-performance laptop with 16GB RAM and 512GB SSD', 'electronics', 5, 2, 'in-stock'),
        ('Ergonomic Office Chair', 'Adjustable office chair with lumbar support', 'furniture', 10, 3, 'in-stock'),
        ('Wireless Mouse', 'Bluetooth wireless mouse', 'electronics', 15, 5, 'in-stock'),
        ('Whiteboard', 'Large whiteboard for meeting rooms', 'office-supplies', 2, 1, 'in-stock'),
        ('Microsoft Office 365', 'Office productivity suite', 'software', 20, 5, 'in-stock'),
        ('Monitor Stand', 'Adjustable monitor stand', 'office-supplies', 8, 3, 'in-stock'),
        ('Desk Lamp', 'LED desk lamp with adjustable brightness', 'office-supplies', 12, 4, 'in-stock'),
        ('Wireless Keyboard', 'Bluetooth wireless keyboard', 'electronics', 0, 3, 'out-of-stock')
      `);
    } else {
      console.log("Items table already has data, skipping insertion");
    }

    // Check if users table has data
    console.log("Checking if users table has data...");
    const [userCount] = await connection.query(
      "SELECT COUNT(*) as count FROM users"
    );

    if (userCount[0].count === 0) {
      // Insert sample data for users
      console.log("Inserting sample users...");
      await connection.query(`
        INSERT INTO users (id, name, email, password, role) VALUES
        (UUID(), 'Admin User', 'admin@example.com', 'admin123', 'admin'),
        (UUID(), 'Regular User', 'user@example.com', 'user123', 'user')
      `);
    } else {
      console.log("Users table already has data, skipping insertion");
    }

    // Check if requests table has data
    console.log("Checking if requests table has data...");
    try {
      const [requestCount] = await connection.query(
        "SELECT COUNT(*) as count FROM requests"
      );

      if (requestCount[0].count === 0) {
        // Get a user ID for the sample requests
        const [users] = await connection.query("SELECT id FROM users LIMIT 1");
        if (users.length > 0) {
          const userId = users[0].id;

          // Insert sample data for requests
          console.log("Inserting sample requests...");
          await connection.query(`
            INSERT INTO requests (userId, itemId, itemName, quantity, priority, status, description, requestedDeliveryDate) VALUES
            ('${userId}', 1, 'Dell XPS 13 Laptop', 1, 'high', 'pending', 'Need a new laptop for development work', '2025-07-15'),
            ('${userId}', 2, 'Ergonomic Office Chair', 2, 'medium', 'approved', 'Dual monitors for better productivity', '2025-06-20')
          `);
        } else {
          console.log("No users found, skipping request insertion");
        }
      } else {
        console.log("Requests table already has data, skipping insertion");
      }
    } catch (error) {
      console.error("Error checking or inserting requests:", error);
    }

    console.log("Database setup completed successfully");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    // Close connection if it was established
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase();

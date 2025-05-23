const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { dbConfig, serverConfig } = require('./config');

console.log('🚀 Starting simple Railway test server...');
console.log('Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***' + dbConfig.password.slice(-4) : 'not set'
});

const app = express();
const PORT = 3003; // Use a different port

// Middleware
app.use(cors());
app.use(express.json());

// Create database pool
let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Database pool created');
} catch (error) {
  console.error('❌ Error creating database pool:', error.message);
}

// Test endpoint
app.get("/api/test", (req, res) => {
  console.log("GET /api/test - Testing server");
  res.json({ success: true, message: "Simple Railway test server is running" });
});

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  try {
    console.log("Testing database connection...");
    const connection = await pool.getConnection();
    connection.release();
    console.log("✅ Database connection successful");
    res.json({ success: true, message: "Database connection successful" });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Test items endpoint
app.get("/api/items", async (req, res) => {
  try {
    console.log("GET /api/items - Fetching items from Railway");
    const [items] = await pool.query("SELECT * FROM items LIMIT 10");
    console.log(`Found ${items.length} items`);
    res.json({
      success: true,
      count: items.length,
      items: items
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching items",
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Railway test server running on http://localhost:${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  /api/test`);
  console.log(`   GET  /api/test-connection`);
  console.log(`   GET  /api/items`);
  console.log(`\n✅ Server ready for testing!`);
});

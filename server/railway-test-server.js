/**
 * Railway Test Server
 *
 * A server that connects to Railway database for authentication
 * but provides simple endpoints for testing
 */

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all origins
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }
  next();
});

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 30000
};

console.log('Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***' + dbConfig.password.slice(-4) : 'not set'
});

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
  res.json({ success: true, message: "Railway test server is running" });
});

// Database connection test
app.get("/api/test-connection", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    res.json({ success: true, message: "Railway database connection successful" });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Railway database connection failed",
      error: error.message,
    });
  }
});

// Login endpoint with Railway database
app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("POST /api/auth/login - Login attempt with Railway database");
    console.log("Request body:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Try to get connection
    let connection;
    try {
      connection = await pool.getConnection();
      console.log("✅ Got database connection");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError.message);

      // Fallback to mock users if database is not available
      console.log("🔄 Falling back to mock authentication");
      const mockUsers = [
        {
          id: "1",
          name: "Manager User",
          email: "manager@gudangmitra.com",
          password: "password123",
          role: "manager"
        },
        {
          id: "2",
          name: "Bob",
          email: "bob@example.com",
          password: "password",
          role: "user"
        },
        {
          id: "3",
          name: "Admin User",
          email: "user@example.com",
          password: "password123",
          role: "user"
        },
        {
          id: "4",
          name: "Admin",
          email: "admin@example.com",
          password: "password123",
          role: "admin"
        }
      ];

      const user = mockUsers.find(u => u.email === email && u.password === password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password (mock auth)",
        });
      }

      const userData = {
        id: user.id,
        username: user.name,
        email: user.email,
        role: user.role,
      };

      console.log(`✅ Mock login successful for ${email}:`, userData);

      return res.json({
        success: true,
        message: "Login successful (mock auth - database unavailable)",
        user: userData,
      });
    }

    try {
      // Query users from Railway database
      const [users] = await connection.query(
        'SELECT id, username, email, password, role FROM users WHERE email = ?',
        [email]
      );

      connection.release();

      if (users.length === 0) {
        console.log(`❌ User not found in Railway database: ${email}`);
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const user = users[0];

      // Check password (in production, use bcrypt)
      if (user.password !== password) {
        console.log(`❌ Password mismatch for ${email}`);
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Success
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      console.log(`✅ Railway login successful for ${email}:`, userData);

      res.json({
        success: true,
        message: "Login successful (Railway database)",
        user: userData,
      });

    } catch (queryError) {
      connection.release();
      console.error("❌ Database query error:", queryError.message);

      return res.status(500).json({
        success: false,
        message: "Database query failed",
        error: queryError.message,
      });
    }

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Mock items endpoint
app.get("/api/items", (req, res) => {
  console.log("GET /api/items - Fetching mock items");

  const mockItems = [
    {
      id: "1",
      name: "Test Item 1",
      description: "A test item",
      category: "Electronics",
      quantity: 10,
      minQuantity: 5,
      status: "in-stock",
      price: 100
    },
    {
      id: "2",
      name: "Cleaning Spray",
      description: "Multi-purpose cleaning spray",
      category: "Cleaning Materials",
      quantity: 25,
      minQuantity: 10,
      status: "in-stock",
      price: 15
    }
  ];

  res.json(mockItems);
});

// Mock categories endpoint
app.get("/api/categories", (req, res) => {
  console.log("GET /api/categories - Fetching mock categories");

  const mockCategories = [
    {
      id: "1",
      name: "Electronics",
      description: "Electronic devices",
      item_count: 1
    },
    {
      id: "2",
      name: "Cleaning Materials",
      description: "Cleaning supplies",
      item_count: 1
    }
  ];

  res.json(mockCategories);
});

// Mock requests endpoint
app.get("/api/requests", (req, res) => {
  console.log("GET /api/requests - Fetching mock requests");
  res.json([]);
});

// Handle 404
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Railway test server running on http://localhost:${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  /api/test`);
  console.log(`   GET  /api/test-connection`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/items`);
  console.log(`   GET  /api/categories`);
  console.log(`   GET  /api/requests`);
  console.log(`\n🔑 Will try Railway database first, fallback to mock data`);
  console.log(`\n✅ Server ready for testing!`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  if (pool) {
    pool.end();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  if (pool) {
    pool.end();
  }
  process.exit(0);
});

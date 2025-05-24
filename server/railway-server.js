const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

// Database configuration directly from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

console.log('🚀 Starting Railway server...');
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('DB_HOST:', process.env.DB_HOST);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Create database pool
let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Database pool created');
} catch (error) {
  console.error('❌ Error creating database pool:', error);
}

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Gudang Mitra API Server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }

    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();

    res.json({
      success: true,
      message: "Database connection successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Query user from database
    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    // Simple password check (in production, use proper hashing)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      success: true,
      message: "Login successful",
      user: userData
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Get all items
app.get("/api/items", async (req, res) => {
  try {
    console.log("GET /api/items - Fetching all items");

    const [items] = await pool.query("SELECT * FROM items");

    const formattedItems = items.map(item => ({
      id: item.id.toString(),
      name: item.name || "Unknown Item",
      description: item.description || "",
      category: item.category || "Other",
      quantity: typeof item.quantity === "number" ? item.quantity : 0,
      minQuantity: typeof item.minQuantity === "number" ? item.minQuantity : 0,
      status: item.quantity > 0 ? (item.quantity <= item.minQuantity ? "low-stock" : "in-stock") : "out-of-stock",
      price: item.price || 0,
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching items",
      error: error.message,
    });
  }
});

// Get all requests
app.get("/api/requests", async (req, res) => {
  try {
    console.log("GET /api/requests - Fetching all requests");

    const [requests] = await pool.query(`
      SELECT * FROM requests
      ORDER BY created_at DESC
    `);

    res.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching requests",
      error: error.message,
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Railway server running on port ${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  /`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/test-connection`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/items`);
  console.log(`   GET  /api/requests`);
  console.log(`\n✅ Server ready!`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

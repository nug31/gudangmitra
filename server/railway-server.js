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

    console.log(`Found ${users.length} users with email ${email}`);

    if (users.length === 0) {
      // Let's also check what users exist in the database
      const [allUsers] = await pool.query("SELECT id, name, email, role FROM users LIMIT 5");
      console.log("Available users in database:", allUsers);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        debug: `No user found with email: ${email}. Available users: ${allUsers.map(u => u.email).join(', ')}`
      });
    }

    const user = users[0];
    console.log(`User found: ${user.email}, checking password...`);
    console.log(`Stored password: "${user.password}", Provided password: "${password}"`);

    // Simple password check (in production, use proper hashing)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        debug: `Password mismatch for user ${email}`
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

// Get all users (for debugging)
app.get("/api/users", async (req, res) => {
  try {
    console.log("GET /api/users - Fetching all users");

    const [users] = await pool.query("SELECT id, name, email, role FROM users");

    res.json({
      success: true,
      users: users,
      count: users.length
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// Debug endpoint to check database structure
app.get("/api/debug/users", async (req, res) => {
  try {
    console.log("GET /api/debug/users - Debug user information");

    // Get table structure
    const [structure] = await pool.query("DESCRIBE users");

    // Get all users with passwords (for debugging only)
    const [users] = await pool.query("SELECT * FROM users LIMIT 10");

    res.json({
      success: true,
      table_structure: structure,
      users: users,
      count: users.length
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Error in debug endpoint",
      error: error.message,
    });
  }
});

// Get requests by user ID
app.get("/api/requests/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`GET /api/requests/user/${userId} - Fetching user requests`);

    const [requests] = await pool.query(`
      SELECT * FROM requests
      WHERE requester_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    res.json(requests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user requests",
      error: error.message,
    });
  }
});

// Get a single request by ID
app.get("/api/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/requests/${id} - Fetching request details`);

    const [requests] = await pool.query(`
      SELECT * FROM requests
      WHERE id = ?
    `, [id]);

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const request = requests[0];

    // Get items for the request
    const [items] = await pool.query(`
      SELECT ri.*, i.name, i.description, i.category
      FROM request_items ri
      JOIN items i ON ri.item_id = i.id
      WHERE ri.request_id = ?
    `, [id]);

    // Add items to the request
    request.items = items;

    res.json(request);
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching request",
      error: error.message,
    });
  }
});

// Create a new request
app.post("/api/requests", async (req, res) => {
  let connection;
  try {
    console.log("POST /api/requests - Creating new request");
    console.log("Request body:", req.body);

    const {
      project_name,
      requester_id,
      requester_name,
      reason,
      priority,
      due_date,
      items,
    } = req.body;

    // Validate required fields
    if (!project_name || !items || !items.length) {
      console.error("Missing required fields:", {
        project_name,
        requester_id,
        items,
      });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: project_name and items are required",
      });
    }

    // Get a connection from the pool
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Generate a UUID for the request
    const { v4: uuidv4 } = require('uuid');
    const requestId = uuidv4();

    console.log("Generated request ID:", requestId);

    // Insert the main request
    const [requestResult] = await connection.query(
      `
      INSERT INTO requests (
        id, project_name, requester_id, requester_name, reason, priority, due_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `,
      [
        requestId,
        project_name,
        requester_id,
        requester_name || "Unknown User",
        reason || "",
        priority || "medium",
        due_date || null,
      ]
    );

    console.log("Request inserted:", requestResult);

    // Insert request items
    for (const item of items) {
      const { item_id, quantity } = item;

      if (!item_id || !quantity) {
        throw new Error("Each item must have item_id and quantity");
      }

      await connection.query(
        `
        INSERT INTO request_items (request_id, item_id, quantity)
        VALUES (?, ?, ?)
      `,
        [requestId, item_id, quantity]
      );

      console.log(`Inserted item: ${item_id}, quantity: ${quantity}`);
    }

    // Commit the transaction
    await connection.commit();

    // Fetch the created request with items
    const [createdRequest] = await pool.query(`
      SELECT * FROM requests WHERE id = ?
    `, [requestId]);

    const [requestItems] = await pool.query(`
      SELECT ri.*, i.name, i.description, i.category
      FROM request_items ri
      JOIN items i ON ri.item_id = i.id
      WHERE ri.request_id = ?
    `, [requestId]);

    const response = {
      ...createdRequest[0],
      items: requestItems
    };

    console.log("Request created successfully:", response);

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating request:", error);

    // Rollback transaction if connection exists
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error creating request",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Update request status
app.patch("/api/requests/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`PATCH /api/requests/${id}/status - Updating request status to ${status}`);

    // Validate status
    const validStatuses = ["pending", "approved", "denied", "fulfilled", "out_of_stock"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const [result] = await pool.query(`
      UPDATE requests
      SET status = ?
      WHERE id = ?
    `, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.json({ success: true, message: "Request status updated successfully" });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating request status",
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
  console.log(`   GET  /api/requests/user/:userId`);
  console.log(`   GET  /api/requests/:id`);
  console.log(`   POST /api/requests`);
  console.log(`   PATCH /api/requests/:id/status`);
  console.log(`   GET  /api/users`);
  console.log(`   GET  /api/debug/users`);
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

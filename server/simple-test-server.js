/**
 * Simple Test Server
 * 
 * A minimal server to test login functionality without complex database connections
 */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3002;

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
  console.log("Headers:", req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }
  next();
});

// Test endpoint
app.get("/api/test", (req, res) => {
  console.log("GET /api/test - Testing server");
  res.json({ success: true, message: "Simple test server is running" });
});

// Mock users for testing
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

// Login endpoint
app.post("/api/auth/login", (req, res) => {
  try {
    console.log("POST /api/auth/login - Login attempt");
    console.log("Request body:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    if (user.password !== password) {
      console.log(`Password mismatch for ${email}. Expected: ${user.password}, Got: ${password}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Success
    const userData = {
      id: user.id,
      username: user.name,
      email: user.email,
      role: user.role,
    };

    console.log(`Login successful for ${email}:`, userData);

    res.json({
      success: true,
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
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
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  /api/test`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/items`);
  console.log(`   GET  /api/categories`);
  console.log(`   GET  /api/requests`);
  console.log(`\n🔑 Test credentials:`);
  mockUsers.forEach(user => {
    console.log(`   ${user.email} / ${user.password} (${user.role})`);
  });
  console.log(`\n✅ Server ready for testing!`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

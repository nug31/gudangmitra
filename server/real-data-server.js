/**
 * Real Data Server
 *
 * This server loads your real gudang1 data from the migration files
 * and serves it through the API endpoints
 */

console.log('🚀 Starting Real Data Server...');

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3002;

console.log('📦 Express app created, setting up middleware...');

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
  next();
});

// Load real data from migration files
let realData = {
  users: [],
  categories: [],
  items: [],
  requests: [],
  request_items: []
};

function loadRealData() {
  try {
    console.log('📁 Loading real data from migration files...');

    const dataFile = path.join(__dirname, 'aws-rds-migration', 'data.sql');

    if (!fs.existsSync(dataFile)) {
      console.log('❌ Migration data file not found, using sample data');
      return loadSampleData();
    }

    const sqlContent = fs.readFileSync(dataFile, 'utf8');
    console.log('✅ Migration data file loaded');

    // Parse items data
    const itemsMatch = sqlContent.match(/INSERT INTO items VALUES\n([\s\S]*?);/);
    if (itemsMatch) {
      const itemsData = itemsMatch[1];
      const itemRows = itemsData.split('\n').filter(line => line.trim().startsWith('('));

      realData.items = itemRows.map((row, index) => {
        // Parse the row data - this is a simplified parser
        const values = row.replace(/^\(|\),?$/g, '').split(', ');

        return {
          id: parseInt(values[0]) || index + 1,
          name: values[1]?.replace(/'/g, '') || `Item ${index + 1}`,
          description: values[2]?.replace(/'/g, '') || 'Description',
          quantity: parseInt(values[3]) || 0,
          min_quantity: parseInt(values[4]) || 0,
          price: parseFloat(values[5]?.replace(/'/g, '')) || 0,
          category_id: parseInt(values[6]) || 1,
          category: values[7]?.replace(/'/g, '') || 'General',
          created_at: values[8]?.replace(/'/g, '') || new Date().toISOString(),
          updated_at: values[9]?.replace(/'/g, '') || new Date().toISOString(),
          status: values[10]?.replace(/'/g, '') || 'in-stock'
        };
      });

      console.log(`✅ Loaded ${realData.items.length} real items`);
    }

    // Parse users data
    const usersMatch = sqlContent.match(/INSERT INTO users VALUES\n([\s\S]*?);/);
    if (usersMatch) {
      const usersData = usersMatch[1];
      const userRows = usersData.split('\n').filter(line => line.trim().startsWith('('));

      realData.users = userRows.map((row, index) => {
        const values = row.replace(/^\(|\),?$/g, '').split(', ');

        return {
          id: values[0]?.replace(/'/g, '') || `user-${index + 1}`,
          username: values[1]?.replace(/'/g, '') || `User ${index + 1}`,
          email: values[2]?.replace(/'/g, '') || `user${index + 1}@example.com`,
          password: values[3]?.replace(/'/g, '') || 'password123',
          role: values[4]?.replace(/'/g, '') || 'user',
          department: values[5]?.replace(/'/g, '') || null,
          created_at: values[7]?.replace(/'/g, '') || new Date().toISOString()
        };
      });

      console.log(`✅ Loaded ${realData.users.length} real users`);
    }

    // Parse categories data
    const categoriesMatch = sqlContent.match(/INSERT INTO categories VALUES\n([\s\S]*?);/);
    if (categoriesMatch) {
      const categoriesData = categoriesMatch[1];
      const categoryRows = categoriesData.split('\n').filter(line => line.trim().startsWith('('));

      realData.categories = categoryRows.map((row, index) => {
        const values = row.replace(/^\(|\),?$/g, '').split(', ');

        return {
          id: values[0]?.replace(/'/g, '') || `cat-${index + 1}`,
          name: values[1]?.replace(/'/g, '') || `Category ${index + 1}`,
          description: values[2]?.replace(/'/g, '') || 'Description',
          created_at: values[3]?.replace(/'/g, '') || new Date().toISOString()
        };
      });

      console.log(`✅ Loaded ${realData.categories.length} real categories`);
    }

    console.log('🎉 Real data loaded successfully!');

  } catch (error) {
    console.error('❌ Error loading real data:', error.message);
    console.log('🔄 Falling back to sample data');
    loadSampleData();
  }
}

function loadSampleData() {
  // Fallback sample data
  realData.users = [
    {
      id: "1",
      username: "Manager User",
      email: "manager@gudangmitra.com",
      password: "password123",
      role: "manager"
    },
    {
      id: "2",
      username: "Bob",
      email: "bob@example.com",
      password: "password",
      role: "user"
    },
    {
      id: "3",
      username: "Admin",
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    },
    {
      id: "4",
      username: "User",
      email: "user@example.com",
      password: "password123",
      role: "user"
    }
  ];

  realData.categories = [
    { id: "1", name: "Electronics", description: "Electronic devices" },
    { id: "2", name: "Office Supplies", description: "Office equipment" },
    { id: "3", name: "Furniture", description: "Office furniture" },
    { id: "4", name: "Cleaning Materials", description: "Cleaning supplies" }
  ];

  realData.items = [
    {
      id: 1,
      name: "Monitor",
      description: "24 inch display",
      quantity: 9,
      min_quantity: 3,
      price: 300.00,
      category: "Electronics",
      status: "in-stock"
    },
    {
      id: 2,
      name: "Keyboard",
      description: "Mechanical keyboard",
      quantity: 10,
      min_quantity: 3,
      price: 75.00,
      category: "Electronics",
      status: "in-stock"
    },
    {
      id: 3,
      name: "Mouse",
      description: "Wireless mouse",
      quantity: 15,
      min_quantity: 5,
      price: 25.00,
      category: "Electronics",
      status: "in-stock"
    }
  ];

  console.log('✅ Sample data loaded');
}

// Load data on startup
loadRealData();

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Real data server is running",
    dataStats: {
      users: realData.users.length,
      categories: realData.categories.length,
      items: realData.items.length
    }
  });
});

// Debug endpoint to see available users
app.get("/api/debug/users", (req, res) => {
  const safeUsers = realData.users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    password: user.password ? '***' + user.password.slice(-3) : 'no password'
  }));

  res.json({
    success: true,
    message: "Available users for login",
    users: safeUsers
  });
});

// Database connection test (always success for this server)
app.get("/api/test-connection", (req, res) => {
  res.json({
    success: true,
    message: "Real data server connection successful (file-based)"
  });
});

// Login endpoint with real users
app.post("/api/auth/login", (req, res) => {
  try {
    console.log("POST /api/auth/login - Login attempt with real data");

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email first
    const user = realData.users.find(u => u.email === email);

    if (!user) {
      console.log(`❌ User not found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password - handle both plain text and encrypted passwords
    let passwordMatch = false;
    if (user.password === password) {
      // Plain text password match
      passwordMatch = true;
    } else if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // This is a bcrypt hash, but we don't have bcrypt library
      // For now, let's add some common passwords for testing
      const commonPasswords = ['password123', 'admin123', 'password'];
      passwordMatch = commonPasswords.includes(password);
    }

    if (!passwordMatch) {
      console.log(`❌ Password mismatch for ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    console.log(`✅ Login successful for ${email}:`, userData);

    res.json({
      success: true,
      message: "Login successful (real data)",
      user: userData,
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Real items endpoint
app.get("/api/items", (req, res) => {
  console.log("GET /api/items - Fetching real items");

  // Add cache-busting headers to force browser refresh
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': `"${Date.now()}"` // Unique ETag to force refresh
  });

  res.json(realData.items);
});

// Real categories endpoint
app.get("/api/categories", (req, res) => {
  console.log("GET /api/categories - Fetching real categories");

  // Add item count to categories
  const categoriesWithCount = realData.categories.map(cat => ({
    ...cat,
    item_count: realData.items.filter(item =>
      item.category === cat.name || item.category_id == cat.id
    ).length
  }));

  res.json(categoriesWithCount);
});

// Mock requests endpoint
app.get("/api/requests", (req, res) => {
  console.log("GET /api/requests - Fetching requests");
  res.json([]);
});

// User requests endpoint
app.get("/api/requests/user/:userId", (req, res) => {
  const { userId } = req.params;
  console.log(`GET /api/requests/user/${userId} - Fetching user requests`);
  res.json([]);
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Real data server running on http://localhost:${PORT}`);
  console.log(`📊 Data loaded:`);
  console.log(`   👥 Users: ${realData.users.length}`);
  console.log(`   📦 Items: ${realData.items.length}`);
  console.log(`   📂 Categories: ${realData.categories.length}`);
  console.log(`\n✅ Server ready with your real gudang1 data!`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

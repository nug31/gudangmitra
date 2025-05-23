const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Mock data
const mockItems = [
  {
    id: "1",
    name: "Test Monitor",
    description: "24 inch display",
    category: "Electronics",
    quantity: 9,
    minQuantity: 2,
    status: "in-stock"
  },
  {
    id: "2",
    name: "Test Keyboard",
    description: "Mechanical keyboard",
    category: "Electronics",
    quantity: 10,
    minQuantity: 3,
    status: "in-stock"
  },
  {
    id: "3",
    name: "Test Mouse",
    description: "Wireless mouse",
    category: "Electronics",
    quantity: 15,
    minQuantity: 5,
    status: "in-stock"
  }
];

const mockUsers = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    role: "admin"
  },
  {
    id: "2",
    username: "user",
    email: "user@example.com",
    role: "user"
  }
];

const mockRequests = [];
const mockCategories = [
  { id: "1", name: "Electronics", description: "Electronic devices" },
  { id: "2", name: "Office Supplies", description: "Office supplies and stationery" },
  { id: "3", name: "Furniture", description: "Office furniture" }
];

// Test connection endpoint
app.get("/api/test-connection", (req, res) => {
  res.json({ success: true, message: "Mock server connection successful" });
});

// Items API endpoints
app.get("/api/items", (req, res) => {
  console.log("GET /api/items - Fetching all items");
  res.json(mockItems);
});

app.get("/api/items/:id", (req, res) => {
  const { id } = req.params;
  const item = mockItems.find(item => item.id === id);
  
  if (!item) {
    return res.status(404).json({ success: false, message: "Item not found" });
  }
  
  res.json(item);
});

app.post("/api/items", (req, res) => {
  const { name, description, category, quantity, minQuantity } = req.body;
  
  // Calculate status based on quantity and minQuantity
  let status = "out-of-stock";
  if (quantity > 0) {
    status = quantity <= minQuantity ? "low-stock" : "in-stock";
  }
  
  const newItem = {
    id: (mockItems.length + 1).toString(),
    name,
    description,
    category,
    quantity,
    minQuantity,
    status
  };
  
  mockItems.push(newItem);
  res.status(201).json(newItem);
});

// User API endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  // For demo purposes, accept any login
  const user = mockUsers.find(u => u.email === email) || mockUsers[0];
  
  res.json({
    success: true,
    message: "Login successful",
    user: user
  });
});

app.get("/api/users", (req, res) => {
  res.json(mockUsers);
});

// Categories API endpoints
app.get("/api/categories", (req, res) => {
  res.json(mockCategories);
});

// Requests API endpoints
app.get("/api/requests", (req, res) => {
  res.json(mockRequests);
});

app.post("/api/requests", (req, res) => {
  const { project_name, requester_id, items } = req.body;
  
  const newRequest = {
    id: (mockRequests.length + 1).toString(),
    project_name,
    requester_id,
    items,
    status: "pending",
    created_at: new Date().toISOString()
  };
  
  mockRequests.push(newRequest);
  res.status(201).json(newRequest);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock server is running on port ${PORT}`);
});

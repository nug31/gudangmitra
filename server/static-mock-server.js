const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockRequests = [
  {
    id: "1",
    project_name: "Office Supplies Request",
    requester_id: "1",
    reason: "Need supplies for new employees",
    priority: "medium",
    due_date: "2025-06-15",
    status: "pending",
    created_at: "2025-05-20T08:00:00.000Z",
    updated_at: "2025-05-20T08:00:00.000Z",
    requester_name: "John Doe",
    requester_email: "john@example.com",
    items: [
      {
        id: 1,
        request_id: "1",
        item_id: 1,
        quantity: 5,
        name: "Ballpoint Pen",
        description: "Blue ballpoint pen",
        category: "Office Supplies"
      },
      {
        id: 2,
        request_id: "1",
        item_id: 2,
        quantity: 2,
        name: "Notebook",
        description: "Spiral notebook, 100 pages",
        category: "Office Supplies"
      }
    ]
  },
  {
    id: "2",
    project_name: "IT Equipment Request",
    requester_id: "2",
    reason: "Replacement for broken equipment",
    priority: "high",
    due_date: "2025-06-10",
    status: "approved",
    created_at: "2025-05-19T10:00:00.000Z",
    updated_at: "2025-05-19T14:30:00.000Z",
    requester_name: "Jane Smith",
    requester_email: "jane@example.com",
    items: [
      {
        id: 3,
        request_id: "2",
        item_id: 3,
        quantity: 1,
        name: "Laptop",
        description: "Dell XPS 13",
        category: "IT Equipment"
      }
    ]
  },
  {
    id: "3",
    project_name: "Office Furniture Request",
    requester_id: "3",
    reason: "New office setup",
    priority: "low",
    due_date: "2025-07-01",
    status: "pending",
    created_at: "2025-05-18T09:15:00.000Z",
    updated_at: "2025-05-18T09:15:00.000Z",
    requester_name: "Bob Johnson",
    requester_email: "bob@example.com",
    items: [
      {
        id: 4,
        request_id: "3",
        item_id: 4,
        quantity: 2,
        name: "Office Chair",
        description: "Ergonomic office chair",
        category: "Furniture"
      },
      {
        id: 5,
        request_id: "3",
        item_id: 5,
        quantity: 1,
        name: "Desk",
        description: "Standing desk, adjustable height",
        category: "Furniture"
      }
    ]
  }
];

// Get all requests
app.get("/api/requests", (req, res) => {
  console.log("GET /api/requests - Returning mock requests");
  res.json(mockRequests);
});

// Get a single request by ID
app.get("/api/requests/:id", (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/requests/${id} - Fetching mock request`);
  
  const request = mockRequests.find(r => r.id === id);
  
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }
  
  res.json(request);
});

// Get requests by user ID
app.get("/api/requests/user/:userId", (req, res) => {
  const { userId } = req.params;
  console.log(`GET /api/requests/user/${userId} - Fetching user mock requests`);
  
  const userRequests = mockRequests.filter(r => r.requester_id === userId);
  res.json(userRequests);
});

// Create a new request
app.post("/api/requests", (req, res) => {
  console.log("POST /api/requests - Creating mock request");
  
  const newRequest = {
    id: (mockRequests.length + 1).toString(),
    ...req.body,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  res.status(201).json(newRequest);
});

// Update request status
app.patch("/api/requests/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log(`PATCH /api/requests/${id}/status - Updating mock request status to ${status}`);
  
  res.json({ success: true, message: "Request status updated successfully" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Static mock server is running on port ${PORT}`);
});

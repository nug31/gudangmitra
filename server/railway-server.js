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

console.log('🚀 Starting Railway server with bcrypt support...');
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

    // Check password - handle both plain text and bcrypt hashed passwords
    let passwordMatches = false;

    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // Bcrypt hashed password
      const bcrypt = require('bcrypt');
      passwordMatches = await bcrypt.compare(password, user.password);
      console.log(`Bcrypt password check for ${email}: ${passwordMatches}`);
    } else {
      // Plain text password
      passwordMatches = user.password === password;
      console.log(`Plain text password check for ${email}: ${passwordMatches}`);
    }

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        debug: `Password mismatch for user ${email}`
      });
    }

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      username: user.name,
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

// Update an existing item
app.put("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`PUT /api/items/${id} - Updating item`);
    console.log("Updates:", updates);

    // Check if the item exists
    const [existingItems] = await pool.query("SELECT * FROM items WHERE id = ?", [id]);

    if (existingItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // Build the update query dynamically
    const updateFields = [];
    const updateValues = [];

    // Only update fields that are provided
    const allowedFields = ['name', 'description', 'category', 'quantity', 'minQuantity', 'price', 'lastRestocked'];

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
      });
    }

    // Add the id to the values array for the WHERE clause
    updateValues.push(id);

    const query = `UPDATE items SET ${updateFields.join(", ")} WHERE id = ?`;
    console.log("Update query:", query);
    console.log("Update values:", updateValues);

    const [result] = await pool.query(query, updateValues);

    if (result.affectedRows > 0) {
      // Fetch the updated item
      const [updatedItems] = await pool.query("SELECT * FROM items WHERE id = ?", [id]);
      const updatedItem = updatedItems[0];

      // Format the response
      const formattedItem = {
        id: updatedItem.id.toString(),
        name: updatedItem.name || "Unknown Item",
        description: updatedItem.description || "",
        category: updatedItem.category || "Other",
        quantity: typeof updatedItem.quantity === "number" ? updatedItem.quantity : 0,
        minQuantity: typeof updatedItem.minQuantity === "number" ? updatedItem.minQuantity : 0,
        status: updatedItem.quantity > 0 ? (updatedItem.quantity <= updatedItem.minQuantity ? "low-stock" : "in-stock") : "out-of-stock",
        price: updatedItem.price || 0,
        lastRestocked: updatedItem.lastRestocked
      };

      console.log("Item updated successfully:", formattedItem);
      res.json(formattedItem);
    } else {
      res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({
      success: false,
      message: "Error updating item",
      error: error.message,
    });
  }
});

// Delete an item
app.delete("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/items/${id} - Deleting item`);

    // Check if the item exists
    const [existingItems] = await pool.query("SELECT * FROM items WHERE id = ?", [id]);

    if (existingItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // Check if item is referenced in any requests
    const [requestItems] = await pool.query(
      "SELECT COUNT(*) as count FROM request_items WHERE item_id = ?",
      [id]
    );

    if (requestItems[0].count > 0) {
      // If item is referenced in requests, do a soft delete by setting a flag or status
      // For now, we'll still allow deletion but log a warning
      console.log(`Warning: Item ${id} is referenced in ${requestItems[0].count} request(s)`);
    }

    // Perform the deletion
    const [result] = await pool.query("DELETE FROM items WHERE id = ?", [id]);

    if (result.affectedRows > 0) {
      console.log(`Item ${id} deleted successfully`);
      res.json({
        success: true,
        message: "Item deleted successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }
  } catch (error) {
    console.error("Error deleting item:", error);

    // Check if it's a foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(400).json({
        success: false,
        message: "Cannot delete item because it is referenced in existing requests",
        error: "Foreign key constraint violation"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error deleting item",
        error: error.message,
      });
    }
  }
});

// Get unique categories
app.get("/api/categories", async (req, res) => {
  try {
    console.log("GET /api/categories - Fetching unique categories");

    const [rows] = await pool.query("SELECT DISTINCT category FROM items WHERE category IS NOT NULL ORDER BY category");

    const categories = rows.map(row => row.category);
    console.log(`Found categories:`, categories);

    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// Get all requests
app.get("/api/requests", async (req, res) => {
  try {
    console.log("GET /api/requests - Fetching all requests");

    const [requests] = await pool.query(`
      SELECT r.*, u.name as requester_name, u.email as requester_email
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      ORDER BY r.created_at DESC
    `);

    // Get items for each request
    const requestsWithItems = await Promise.all(
      requests.map(async (request) => {
        const [items] = await pool.query(
          `
          SELECT ri.*, i.name, i.description, i.category
          FROM request_items ri
          JOIN items i ON ri.item_id = i.id
          WHERE ri.request_id = ?
        `,
          [request.id]
        );

        return {
          ...request,
          items: items,
        };
      })
    );

    console.log(`Returning ${requestsWithItems.length} requests`);
    res.json(requestsWithItems);
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

// Get a single user by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/users/${id} - Fetching user details`);

    const [users] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];
    const userData = {
      id: user.id.toString(),
      username: user.name,
      email: user.email,
      role: user.role || "user",
    };

    res.json(userData);
  } catch (error) {
    console.error(`Error fetching user with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
});

// Create a new user (registration)
app.post("/api/users", async (req, res) => {
  try {
    console.log("POST /api/users - Creating new user");
    console.log("Request body:", req.body);

    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash the password
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate a UUID for the user
    const { v4: uuidv4 } = require('uuid');
    const userId = uuidv4();

    // Insert the new user
    const [result] = await pool.query(
      `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, role || "user"]
    );

    console.log("User created successfully:", result);

    // Return user data (excluding password)
    const userData = {
      id: userId,
      username: name,
      email: email,
      role: role || "user",
    };

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
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

// Debug endpoint to check requests table structure
app.get("/api/debug/requests", async (req, res) => {
  try {
    console.log("GET /api/debug/requests - Debug requests table information");

    // Get table structure
    const [structure] = await pool.query("DESCRIBE requests");

    // Get sample requests
    const [requests] = await pool.query("SELECT * FROM requests LIMIT 5");

    res.json({
      success: true,
      table_structure: structure,
      sample_requests: requests,
      count: requests.length
    });
  } catch (error) {
    console.error("Error in debug requests endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Error in debug requests endpoint",
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
      SELECT r.*, u.name as requester_name, u.email as requester_email
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      WHERE r.requester_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    // Get items for each request
    const requestsWithItems = await Promise.all(
      requests.map(async (request) => {
        const [items] = await pool.query(
          `
          SELECT ri.*, i.name, i.description, i.category
          FROM request_items ri
          JOIN items i ON ri.item_id = i.id
          WHERE ri.request_id = ?
        `,
          [request.id]
        );

        return {
          ...request,
          items: items,
        };
      })
    );

    res.json(requestsWithItems);
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
      SELECT r.*, u.name as requester_name, u.email as requester_email
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      WHERE r.id = ?
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

    // Insert the main request (without requester_name since it doesn't exist in the table)
    const [requestResult] = await connection.query(
      `
      INSERT INTO requests (
        id, project_name, requester_id, reason, priority, due_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `,
      [
        requestId,
        project_name,
        requester_id,
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

    // Create notifications for admins/managers about the new request
    try {
      console.log("Creating notifications for admins about new request...");

      // Get all admin and manager users
      const [adminUsers] = await pool.query(`
        SELECT id, name FROM users WHERE role IN ('admin', 'manager')
      `);

      console.log(`Found ${adminUsers.length} admin/manager users for notifications`);

      // Create notification for each admin/manager
      for (const admin of adminUsers) {
        const { v4: uuidv4 } = require('uuid');
        const notificationId = uuidv4();

        await pool.query(`
          INSERT INTO notifications (id, user_id, type, message, related_item_id, is_read, created_at)
          VALUES (?, ?, 'request_submitted', ?, ?, 0, NOW())
        `, [
          notificationId,
          admin.id,
          `New request "${project_name}" requires your review`,
          requestId
        ]);

        console.log(`Created notification for admin ${admin.name} (${admin.id})`);
      }

      // Also create a confirmation notification for the requester
      if (requester_id) {
        const { v4: uuidv4 } = require('uuid');
        const requesterNotificationId = uuidv4();

        await pool.query(`
          INSERT INTO notifications (id, user_id, type, message, related_item_id, is_read, created_at)
          VALUES (?, ?, 'request_submitted', ?, ?, 0, NOW())
        `, [
          requesterNotificationId,
          requester_id,
          `Your request "${project_name}" has been submitted and is pending review`,
          requestId
        ]);

        console.log(`Created confirmation notification for requester ${requester_id}`);
      }

    } catch (notificationError) {
      console.error("Error creating notifications:", notificationError);
      // Don't fail the request creation if notifications fail
    }

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
    // Release connection back to pool
    if (connection) {
      connection.release();
    }
  }
});

// Update request status
app.patch("/api/requests/:id/status", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status, approved_by } = req.body;

    console.log(`PATCH /api/requests/${id}/status - Updating status to: ${status}`);
    console.log(`Request ID: "${id}", Status: "${status}"`);
    console.log(`Request body:`, req.body);

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // Validate status
    const validStatuses = ["pending", "approved", "denied", "fulfilled", "out_of_stock"];
    if (!validStatuses.includes(status)) {
      console.log(`Invalid status provided: ${status}`);
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Get a connection from the pool and start a transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // First, check if the request exists
    console.log(`Checking if request exists with ID: ${id}`);
    const [existingRequests] = await connection.query(`
      SELECT id, status FROM requests WHERE id = ?
    `, [id]);

    console.log(`Found ${existingRequests.length} requests with ID ${id}:`, existingRequests);

    if (existingRequests.length === 0) {
      await connection.rollback();
      console.log(`Request not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Request not found",
        debug: `No request found with ID: ${id}`
      });
    }

    console.log(`Updating request ${id} from status "${existingRequests[0].status}" to "${status}"`);

    // If status is being set to "approved", update item quantities
    if (status === "approved") {
      console.log(`Request ${id} is being approved, updating item quantities...`);

      // Get the items in the request
      const [requestItems] = await connection.query(`
        SELECT ri.*, i.name, i.quantity as current_quantity, i.minQuantity
        FROM request_items ri
        JOIN items i ON ri.item_id = i.id
        WHERE ri.request_id = ?
      `, [id]);

      console.log(`Found ${requestItems.length} items in request ${id}:`, requestItems);

      // Update each item's quantity
      for (const item of requestItems) {
        const newQuantity = Math.max(0, item.current_quantity - item.quantity);
        console.log(`Updating item ${item.item_id} (${item.name}) quantity from ${item.current_quantity} to ${newQuantity}`);

        // Calculate new status based on new quantity and minQuantity
        let newStatus = "out-of-stock";
        if (newQuantity > 0) {
          newStatus = newQuantity <= item.minQuantity ? "low-stock" : "in-stock";
        }

        console.log(`Setting item ${item.item_id} status to: ${newStatus}`);

        // Update the item quantity and status
        const [itemUpdateResult] = await connection.query(`
          UPDATE items
          SET quantity = ?, status = ?, updatedAt = NOW()
          WHERE id = ?
        `, [newQuantity, newStatus, item.item_id]);

        console.log(`Item ${item.item_id} update result:`, itemUpdateResult);

        if (itemUpdateResult.affectedRows === 0) {
          throw new Error(`Failed to update item ${item.item_id} quantity`);
        }
      }

      console.log(`Successfully updated quantities for all items in request ${id}`);
    }

    // Update the request status
    const [updateResult] = await connection.query(
      `UPDATE requests SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    console.log(`Request status update result:`, updateResult);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      console.log(`No rows affected when updating request ${id}`);
      return res.status(404).json({
        success: false,
        message: "Request not found or no changes made",
        debug: `Update affected ${updateResult.affectedRows} rows`
      });
    }

    // Commit the transaction
    await connection.commit();
    console.log(`Successfully committed transaction for request ${id}`);

    // Create notification for the requester about the status change
    try {
      console.log("Creating notification for requester about status change...");

      // Get the request details to find the requester and project name
      const [requestDetails] = await pool.query(`
        SELECT requester_id, project_name FROM requests WHERE id = ?
      `, [id]);

      if (requestDetails.length > 0) {
        const { requester_id, project_name } = requestDetails[0];

        // Create appropriate notification message based on status
        let notificationType = 'request_approved';
        let message = '';

        switch (status) {
          case 'approved':
            notificationType = 'request_approved';
            message = `Your request "${project_name}" has been approved`;
            break;
          case 'denied':
            notificationType = 'request_rejected';
            message = `Your request "${project_name}" has been rejected`;
            break;
          case 'fulfilled':
            notificationType = 'request_fulfilled';
            message = `Your request "${project_name}" has been fulfilled`;
            break;
          case 'out_of_stock':
            notificationType = 'request_rejected';
            message = `Your request "${project_name}" cannot be fulfilled due to insufficient stock`;
            break;
          default:
            // Don't send notification for pending status
            console.log(`No notification needed for status: ${status}`);
            break;
        }

        // Only create notification if we have a message (not for pending status)
        if (message) {
          const { v4: uuidv4 } = require('uuid');
          const notificationId = uuidv4();

          await pool.query(`
            INSERT INTO notifications (id, user_id, type, message, related_item_id, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, NOW())
          `, [
            notificationId,
            requester_id,
            notificationType,
            message,
            id
          ]);

          console.log(`Created notification for requester ${requester_id}: ${message}`);
        }
      }

    } catch (notificationError) {
      console.error("Error creating status change notification:", notificationError);
      // Don't fail the status update if notification fails
    }

    // Fetch the updated request
    const [updatedRequest] = await pool.query(`
      SELECT * FROM requests WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: "Request status updated successfully",
      request: updatedRequest[0],
      debug: `Updated ${updateResult.affectedRows} row(s)`,
      itemsUpdated: status === "approved" ? "Item quantities reduced automatically" : "No item updates needed"
    });

  } catch (error) {
    console.error("Error updating request status:", error);
    console.error("Error stack:", error.stack);

    // Rollback transaction if connection exists
    if (connection) {
      try {
        await connection.rollback();
        console.log("Transaction rolled back due to error");
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error updating request status",
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
    }
  }
});

// Notification endpoints

// Get notifications for a user
app.get("/api/notifications/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`GET /api/notifications/user/${userId} - Fetching user notifications`);

    const [notifications] = await pool.query(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    console.log(`Found ${notifications.length} notifications for user ${userId}`);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
});

// Get unread notification count for a user
app.get("/api/notifications/user/:userId/unread-count", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`GET /api/notifications/user/${userId}/unread-count - Fetching unread count`);

    const [result] = await pool.query(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    const count = result[0].count;
    console.log(`User ${userId} has ${count} unread notifications`);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      error: error.message,
    });
  }
});

// Create a new notification
app.post("/api/notifications", async (req, res) => {
  try {
    console.log("POST /api/notifications - Creating new notification");
    console.log("Request body:", req.body);

    const { user_id, type, message, related_item_id } = req.body;

    // Validate required fields
    if (!user_id || !type || !message) {
      return res.status(400).json({
        success: false,
        message: "user_id, type, and message are required",
      });
    }

    // Generate a UUID for the notification
    const { v4: uuidv4 } = require('uuid');
    const notificationId = uuidv4();

    // Insert the notification
    const [result] = await pool.query(`
      INSERT INTO notifications (id, user_id, type, message, related_item_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `, [notificationId, user_id, type, message, related_item_id || null]);

    console.log("Notification created:", result);

    // Fetch the created notification
    const [notifications] = await pool.query(`
      SELECT * FROM notifications WHERE id = ?
    `, [notificationId]);

    res.status(201).json(notifications[0]);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Error creating notification",
      error: error.message,
    });
  }
});

// Mark a notification as read
app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`PATCH /api/notifications/${id}/read - Marking notification as read`);

    const [result] = await pool.query(`
      UPDATE notifications SET is_read = 1 WHERE id = ?
    `, [id]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Notification marked as read" });
    } else {
      res.status(404).json({ success: false, message: "Notification not found" });
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
});

// Mark all notifications as read for a user
app.patch("/api/notifications/user/:userId/mark-all-read", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`PATCH /api/notifications/user/${userId}/mark-all-read - Marking all notifications as read`);

    const [result] = await pool.query(`
      UPDATE notifications SET is_read = 1 WHERE user_id = ?
    `, [userId]);

    console.log(`Marked ${result.affectedRows} notifications as read for user ${userId}`);
    res.json({
      success: true,
      message: "All notifications marked as read",
      updated_count: result.affectedRows
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
});

// Delete a notification
app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/notifications/${id} - Deleting notification`);

    const [result] = await pool.query(`
      DELETE FROM notifications WHERE id = ?
    `, [id]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Notification deleted" });
    } else {
      res.status(404).json({ success: false, message: "Notification not found" });
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
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

// Dashboard API endpoints
// Get comprehensive dashboard statistics
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    console.log("GET /api/dashboard/stats - Fetching dashboard statistics");

    // Get user statistics
    const [userStats] = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count
      FROM users
    `);

    // Get item statistics
    const [itemStats] = await pool.query(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COUNT(CASE WHEN quantity <= minQuantity THEN 1 END) as low_stock_items
      FROM items
    `);

    // Get category count
    const [categoryStats] = await pool.query(`
      SELECT COUNT(DISTINCT category) as total_categories FROM items WHERE category IS NOT NULL
    `);

    // Get request statistics
    const [requestStats] = await pool.query(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied_count,
        SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled_count
      FROM requests
    `);

    // Get recent requests (last 7 days)
    const [recentRequests] = await pool.query(`
      SELECT COUNT(*) as recent_count
      FROM requests
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Get top requested items
    const [topItems] = await pool.query(`
      SELECT
        i.name,
        COALESCE(SUM(ri.quantity), 0) as total_requested
      FROM items i
      LEFT JOIN request_items ri ON i.id = ri.item_id
      LEFT JOIN requests r ON ri.request_id = r.id
      GROUP BY i.id, i.name
      ORDER BY total_requested DESC
      LIMIT 5
    `);

    // Get recent activity
    const [recentActivity] = await pool.query(`
      SELECT
        r.id,
        'request_created' as type,
        CONCAT('Request "', r.project_name, '" was created') as description,
        r.created_at as timestamp,
        u.name as user
      FROM requests r
      JOIN users u ON r.requester_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    const dashboardStats = {
      // User statistics
      totalUsers: userStats[0].total_users,
      usersByRole: {
        admin: userStats[0].admin_count,
        manager: userStats[0].manager_count,
        user: userStats[0].user_count
      },

      // Item statistics
      totalItems: itemStats[0].total_items,
      totalQuantity: parseInt(itemStats[0].total_quantity),
      lowStockItems: itemStats[0].low_stock_items,
      totalCategories: categoryStats[0].total_categories,

      // Request statistics
      totalRequests: requestStats[0].total_requests,
      requestsByStatus: {
        pending: requestStats[0].pending_count,
        approved: requestStats[0].approved_count,
        denied: requestStats[0].denied_count,
        fulfilled: requestStats[0].fulfilled_count
      },
      recentRequests: recentRequests[0].recent_count,

      // Top requested items
      topRequestedItems: topItems.map(item => ({
        name: item.name,
        totalRequested: parseInt(item.total_requested)
      })),

      // Recent activity
      recentActivity: recentActivity.map(activity => ({
        id: activity.id.toString(),
        type: activity.type,
        description: activity.description,
        timestamp: activity.timestamp.toISOString(),
        user: activity.user
      }))
    };

    console.log("Dashboard stats compiled successfully");
    res.json(dashboardStats);

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message
    });
  }
});

// Get user statistics
app.get("/api/dashboard/users", async (req, res) => {
  try {
    const [userStats] = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count
      FROM users
    `);

    res.json({
      totalUsers: userStats[0].total_users,
      usersByRole: {
        admin: userStats[0].admin_count,
        manager: userStats[0].manager_count,
        user: userStats[0].user_count
      }
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ success: false, message: "Error fetching user statistics" });
  }
});

// Get item statistics
app.get("/api/dashboard/items", async (req, res) => {
  try {
    const [itemStats] = await pool.query(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COUNT(CASE WHEN quantity <= minQuantity THEN 1 END) as low_stock_items
      FROM items
    `);

    const [categoryStats] = await pool.query(`
      SELECT COUNT(DISTINCT category) as total_categories FROM items WHERE category IS NOT NULL
    `);

    res.json({
      totalItems: itemStats[0].total_items,
      totalQuantity: parseInt(itemStats[0].total_quantity),
      lowStockItems: itemStats[0].low_stock_items,
      totalCategories: categoryStats[0].total_categories
    });
  } catch (error) {
    console.error("Error fetching item stats:", error);
    res.status(500).json({ success: false, message: "Error fetching item statistics" });
  }
});

// Get request statistics
app.get("/api/dashboard/requests", async (req, res) => {
  try {
    const [requestStats] = await pool.query(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied_count,
        SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled_count
      FROM requests
    `);

    const [recentRequests] = await pool.query(`
      SELECT COUNT(*) as recent_count
      FROM requests
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.json({
      totalRequests: requestStats[0].total_requests,
      requestsByStatus: {
        pending: requestStats[0].pending_count,
        approved: requestStats[0].approved_count,
        denied: requestStats[0].denied_count,
        fulfilled: requestStats[0].fulfilled_count
      },
      recentRequests: recentRequests[0].recent_count
    });
  } catch (error) {
    console.error("Error fetching request stats:", error);
    res.status(500).json({ success: false, message: "Error fetching request statistics" });
  }
});

// Get top requested items
app.get("/api/dashboard/top-items", async (req, res) => {
  try {
    const [topItems] = await pool.query(`
      SELECT
        i.name,
        COALESCE(SUM(ri.quantity), 0) as total_requested
      FROM items i
      LEFT JOIN request_items ri ON i.id = ri.item_id
      LEFT JOIN requests r ON ri.request_id = r.id
      GROUP BY i.id, i.name
      ORDER BY total_requested DESC
      LIMIT 10
    `);

    res.json(topItems.map(item => ({
      name: item.name,
      totalRequested: parseInt(item.total_requested)
    })));
  } catch (error) {
    console.error("Error fetching top items:", error);
    res.status(500).json({ success: false, message: "Error fetching top requested items" });
  }
});

// Get recent activity
app.get("/api/dashboard/activity", async (req, res) => {
  try {
    const [recentActivity] = await pool.query(`
      SELECT
        r.id,
        'request_created' as type,
        CONCAT('Request "', r.project_name, '" was created') as description,
        r.created_at as timestamp,
        u.name as user
      FROM requests r
      JOIN users u ON r.requester_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 20
    `);

    res.json(recentActivity.map(activity => ({
      id: activity.id.toString(),
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp.toISOString(),
      user: activity.user
    })));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ success: false, message: "Error fetching recent activity" });
  }
});

// Get user-specific dashboard statistics
app.get("/api/dashboard/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`GET /api/dashboard/user/${userId} - Fetching user dashboard statistics`);

    // Get user's request statistics
    const [userRequestStats] = await pool.query(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied_count,
        SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled_count
      FROM requests
      WHERE requester_id = ?
    `, [userId]);

    // Get user's recent requests (last 7 days)
    const [recentUserRequests] = await pool.query(`
      SELECT COUNT(*) as recent_count
      FROM requests
      WHERE requester_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [userId]);

    // Get user's top requested items
    const [userTopItems] = await pool.query(`
      SELECT
        i.name,
        COALESCE(SUM(ri.quantity), 0) as total_requested
      FROM items i
      LEFT JOIN request_items ri ON i.id = ri.item_id
      LEFT JOIN requests r ON ri.request_id = r.id AND r.requester_id = ?
      WHERE r.requester_id IS NOT NULL
      GROUP BY i.id, i.name
      ORDER BY total_requested DESC
      LIMIT 5
    `, [userId]);

    // Get available items count
    const [availableItems] = await pool.query(`
      SELECT COUNT(*) as available_items FROM items WHERE quantity > 0
    `);

    // Get available categories count
    const [availableCategories] = await pool.query(`
      SELECT COUNT(DISTINCT category) as available_categories FROM items WHERE category IS NOT NULL
    `);

    // Get user's recent activity
    const [userRecentActivity] = await pool.query(`
      SELECT
        r.id,
        CASE
          WHEN r.status = 'pending' THEN 'request_created'
          WHEN r.status = 'approved' THEN 'request_approved'
          WHEN r.status = 'denied' THEN 'request_denied'
          WHEN r.status = 'fulfilled' THEN 'request_fulfilled'
          ELSE 'request_created'
        END as type,
        CONCAT('Request "', r.project_name, '" was ', r.status) as description,
        r.updated_at as timestamp
      FROM requests r
      WHERE r.requester_id = ?
      ORDER BY r.updated_at DESC
      LIMIT 10
    `, [userId]);

    const userDashboardStats = {
      myRequests: {
        total: userRequestStats[0].total_requests,
        pending: userRequestStats[0].pending_count,
        approved: userRequestStats[0].approved_count,
        denied: userRequestStats[0].denied_count,
        fulfilled: userRequestStats[0].fulfilled_count
      },
      recentRequests: recentUserRequests[0].recent_count,
      myTopRequestedItems: userTopItems.map(item => ({
        name: item.name,
        totalRequested: parseInt(item.total_requested)
      })),
      availableItems: availableItems[0].available_items,
      availableCategories: availableCategories[0].available_categories,
      myRecentActivity: userRecentActivity.map(activity => ({
        id: activity.id.toString(),
        type: activity.type,
        description: activity.description,
        timestamp: activity.timestamp.toISOString()
      }))
    };

    console.log("User dashboard stats compiled successfully");
    res.json(userDashboardStats);

  } catch (error) {
    console.error("Error fetching user dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user dashboard statistics",
      error: error.message
    });
  }
});

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
    timestamp: new Date().toISOString()
  });
});

// Error handler (must be last)
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
  console.log(`   GET  /api/categories`);
  console.log(`   GET  /api/requests`);
  console.log(`   GET  /api/requests/user/:userId`);
  console.log(`   GET  /api/requests/:id`);
  console.log(`   POST /api/requests`);
  console.log(`   PATCH /api/requests/:id/status`);
  console.log(`   GET  /api/users`);
  console.log(`   GET  /api/debug/users`);
  console.log(`   GET  /api/debug/requests`);
  console.log(`   GET  /api/dashboard/stats`);
  console.log(`   GET  /api/dashboard/users`);
  console.log(`   GET  /api/dashboard/items`);
  console.log(`   GET  /api/dashboard/requests`);
  console.log(`   GET  /api/dashboard/top-items`);
  console.log(`   GET  /api/dashboard/activity`);
  console.log(`   GET  /api/dashboard/user/:userId`);
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

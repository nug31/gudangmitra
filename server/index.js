const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const OpenAI = require("openai");
const { dbConfig, serverConfig } = require('./config');

console.log('🚀 Starting server...');
console.log('Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***' + dbConfig.password.slice(-4) : 'not set'
});
console.log('Server config:', serverConfig);

const app = express();
const PORT = serverConfig.port;

// Middleware
app.use(
  cors({
    origin: serverConfig.corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ success: true, message: "Database connection successful" });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Test endpoint to check items
app.get("/api/test-items", async (req, res) => {
  try {
    console.log("GET /api/test-items - Testing items retrieval");

    // Get all items
    const [items] = await pool.query("SELECT * FROM items WHERE isActive = 1");
    console.log(`Found ${items.length} items:`, items);

    // Get table structure
    const [columns] = await pool.query("DESCRIBE items");
    const columnNames = columns.map((col) => col.Field);

    res.json({
      success: true,
      message: `Found ${items.length} items`,
      items: items,
      columns: columnNames,
    });
  } catch (error) {
    console.error("Error testing items:", error);
    res.status(500).json({
      success: false,
      message: "Error testing items",
      error: error.message,
    });
  }
});

// Test endpoint to create a sample item
app.get("/api/create-test-item", async (req, res) => {
  try {
    console.log("Creating test item");

    // Get table structure first to check available columns
    const [columns] = await pool.query("DESCRIBE items");
    const columnNames = columns.map((col) => col.Field);
    console.log("Available columns:", columnNames);

    // Build query dynamically based on available columns
    let fields = ["name", "description", "category", "quantity", "minQuantity"];
    let values = ["Test Item", "This is a test item", "electronics", 10, 5];
    let placeholders = Array(fields.length).fill("?").join(", ");

    // Add status if it exists
    if (columnNames.includes("status")) {
      fields.push("status");
      values.push("in-stock");
      placeholders = Array(fields.length).fill("?").join(", ");
    }

    // Add isActive if it exists
    if (columnNames.includes("isActive")) {
      fields.push("isActive");
      values.push(1);
      placeholders = Array(fields.length).fill("?").join(", ");
    }

    const query = `INSERT INTO items (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;
    console.log("Query:", query);
    console.log("Values:", values);

    const [result] = await pool.query(query, values);
    console.log("Insert result:", result);

    if (result.insertId) {
      const [items] = await pool.query("SELECT * FROM items WHERE id = ?", [
        result.insertId,
      ]);
      res
        .status(201)
        .json({ success: true, message: "Test item created", item: items[0] });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Failed to create test item" });
    }
  } catch (error) {
    console.error("Error creating test item:", error);
    res.status(500).json({
      success: false,
      message: "Error creating test item",
      error: error.message,
    });
  }
});

// Get all tables
app.get("/api/tables", async (req, res) => {
  try {
    const [results] = await pool.query("SHOW TABLES");
    const tables = results.map((row) => Object.values(row)[0]);
    res.json({ success: true, tables });
  } catch (error) {
    console.error("Error getting tables:", error);
    res.status(500).json({
      success: false,
      message: "Error getting tables",
      error: error.message,
    });
  }
});

// Get table structure
app.get("/api/tables/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const [results] = await pool.query(`DESCRIBE ${tableName}`);
    res.json({ success: true, structure: results });
  } catch (error) {
    console.error(
      `Error getting structure for table ${req.params.tableName}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: `Error getting structure for table ${req.params.tableName}`,
      error: error.message,
    });
  }
});

// Items API endpoints
// Get all items
app.get("/api/items", async (req, res) => {
  try {
    console.log("GET /api/items - Fetching all items");

    // Get table structure first to check available columns
    const [columns] = await pool.query("DESCRIBE items");
    const columnNames = columns.map((col) => col.Field);
    console.log("Available columns:", columnNames);

    // Build query dynamically based on available columns
    let selectFields = ["id", "name", "description"];

    // Add optional fields if they exist
    if (columnNames.includes("category")) selectFields.push("category");
    if (columnNames.includes("quantity")) selectFields.push("quantity");
    if (columnNames.includes("minQuantity")) selectFields.push("minQuantity");
    if (columnNames.includes("status")) selectFields.push("status");
    if (columnNames.includes("price")) selectFields.push("price");
    if (columnNames.includes("isActive")) selectFields.push("isActive");
    if (columnNames.includes("lastRestocked"))
      selectFields.push("lastRestocked");

    let query = `SELECT ${selectFields.join(", ")} FROM items`;

    // Add WHERE clause if isActive exists
    if (columnNames.includes("isActive")) {
      query += ` WHERE isActive = 1`;
    }

    console.log("Query:", query);

    const [items] = await pool.query(query);
    console.log(`Found ${items.length} items`);

    // Map the database items to the expected format
    const formattedItems = items.map((item) => {
      const formattedItem = {
        id: item.id.toString(),
        name: item.name || "",
        description: item.description || "",
        category: item.category || "other",
        quantity: item.quantity !== undefined ? item.quantity : 0,
        minQuantity: item.minQuantity !== undefined ? item.minQuantity : 0,
      };

      // Add status based on available data
      if (item.status) {
        formattedItem.status = item.status;
      } else if (
        item.quantity !== undefined &&
        item.minQuantity !== undefined
      ) {
        formattedItem.status =
          item.quantity <= 0
            ? "out-of-stock"
            : item.quantity <= item.minQuantity
            ? "low-stock"
            : "in-stock";
      } else {
        formattedItem.status = "in-stock";
      }

      // Add optional fields if they exist
      if (item.price !== undefined) formattedItem.price = item.price;
      if (item.lastRestocked) formattedItem.lastRestocked = item.lastRestocked;

      return formattedItem;
    });

    console.log("Returning formatted items");
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

// Get a single item by ID
app.get("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [items] = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        category,
        quantity,
        minQuantity,
        status,
        price,
        isActive
      FROM items
      WHERE id = ? AND isActive = 1
    `,
      [id]
    );

    if (items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Format the item
    const item = items[0];
    const formattedItem = {
      id: item.id.toString(),
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      status:
        item.status ||
        (item.quantity <= 0
          ? "out-of-stock"
          : item.quantity <= item.minQuantity
          ? "low-stock"
          : "in-stock"),
      price: item.price,
    };

    res.json(formattedItem);
  } catch (error) {
    console.error(`Error fetching item with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error fetching item",
      error: error.message,
    });
  }
});

// Create a new item
app.post("/api/items", async (req, res) => {
  try {
    const { name, description, category, quantity, minQuantity } = req.body;

    // Calculate status based on quantity and minQuantity
    let status = "out-of-stock";
    if (quantity > 0) {
      status = quantity <= minQuantity ? "low-stock" : "in-stock";
    }

    // Check if status column exists
    const [columns] = await pool.query("DESCRIBE items");
    const hasStatusColumn = columns.some((col) => col.Field === "status");

    let query;
    let params;

    if (hasStatusColumn) {
      query = `
        INSERT INTO items (name, description, category, quantity, minQuantity, status, isActive)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `;
      params = [name, description, category, quantity, minQuantity, status];
    } else {
      query = `
        INSERT INTO items (name, description, category, quantity, minQuantity, isActive)
        VALUES (?, ?, ?, ?, ?, 1)
      `;
      params = [name, description, category, quantity, minQuantity];
    }

    const [result] = await pool.query(query, params);

    if (result.insertId) {
      const [items] = await pool.query("SELECT * FROM items WHERE id = ?", [
        result.insertId,
      ]);

      // Format the item
      const item = items[0];
      const formattedItem = {
        id: item.id.toString(),
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        status:
          item.status ||
          (item.quantity <= 0
            ? "out-of-stock"
            : item.quantity <= item.minQuantity
            ? "low-stock"
            : "in-stock"),
        price: item.price,
      };

      res.status(201).json(formattedItem);
    } else {
      res
        .status(400)
        .json({ success: false, message: "Failed to create item" });
    }
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({
      success: false,
      message: "Error creating item",
      error: error.message,
    });
  }
});

// Update an existing item
app.put("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if status column exists
    const [columns] = await pool.query("DESCRIBE items");
    const hasStatusColumn = columns.some((col) => col.Field === "status");

    // If quantity or minQuantity is updated and status column exists, recalculate status
    if (
      hasStatusColumn &&
      (updates.quantity !== undefined || updates.minQuantity !== undefined)
    ) {
      // Get current item to have all data for status calculation
      const [items] = await pool.query("SELECT * FROM items WHERE id = ?", [
        id,
      ]);

      if (items.length > 0) {
        const currentItem = items[0];
        const quantity = updates.quantity ?? currentItem.quantity;
        const minQuantity = updates.minQuantity ?? currentItem.minQuantity;

        // Calculate new status
        let status = "out-of-stock";
        if (quantity > 0) {
          status = quantity <= minQuantity ? "low-stock" : "in-stock";
        }

        updates.status = status;
      }
    }

    // Build the update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.entries(updates).forEach(([key, value]) => {
      // Skip the id field and only include status if the column exists
      if (key !== "id" && (key !== "status" || hasStatusColumn)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields to update" });
    }

    // Add the id to the values array for the WHERE clause
    updateValues.push(id);

    const query = `UPDATE items SET ${updateFields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(query, updateValues);

    if (result.affectedRows > 0) {
      const [items] = await pool.query("SELECT * FROM items WHERE id = ?", [
        id,
      ]);

      // Format the item
      const item = items[0];
      const formattedItem = {
        id: item.id.toString(),
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        status:
          item.status ||
          (item.quantity <= 0
            ? "out-of-stock"
            : item.quantity <= item.minQuantity
            ? "low-stock"
            : "in-stock"),
        price: item.price,
      };

      res.json(formattedItem);
    } else {
      res.status(404).json({ success: false, message: "Item not found" });
    }
  } catch (error) {
    console.error(`Error updating item with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error updating item",
      error: error.message,
    });
  }
});

// Delete an item (soft delete)
app.delete("/api/items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if isActive column exists
    const [columns] = await pool.query("DESCRIBE items");
    const hasIsActiveColumn = columns.some((col) => col.Field === "isActive");

    let result;
    if (hasIsActiveColumn) {
      // Soft delete by setting isActive to 0
      [result] = await pool.query(
        "UPDATE items SET isActive = 0 WHERE id = ?",
        [id]
      );
    } else {
      // Hard delete if isActive column doesn't exist
      [result] = await pool.query("DELETE FROM items WHERE id = ?", [id]);
    }

    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Item deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Item not found" });
    }
  } catch (error) {
    console.error(`Error deleting item with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error deleting item",
      error: error.message,
    });
  }
});

// Requests API endpoints
// Get all requests
app.get("/api/requests", async (req, res) => {
  try {
    console.log("GET /api/requests - Fetching all requests");

    const [requests] = await pool.query(`
      SELECT r.*
      FROM requests r
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

// Get requests by user ID
app.get("/api/requests/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`GET /api/requests/user/${userId} - Fetching user requests`);

    const [requests] = await pool.query(
      `
      SELECT r.*
      FROM requests r
      WHERE r.requester_id = ?
      ORDER BY r.created_at DESC
    `,
      [userId]
    );

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
    console.error(
      `Error fetching requests for user ${req.params.userId}:`,
      error
    );
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

    const [requests] = await pool.query(
      `
      SELECT r.*
      FROM requests r
      WHERE r.id = ?
    `,
      [id]
    );

    if (requests.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    const request = requests[0];

    // Get items for the request
    const [items] = await pool.query(
      `
      SELECT ri.*, i.name, i.description, i.category
      FROM request_items ri
      JOIN items i ON ri.item_id = i.id
      WHERE ri.request_id = ?
    `,
      [id]
    );

    const requestWithItems = {
      ...request,
      items: items,
    };

    res.json(requestWithItems);
  } catch (error) {
    console.error(`Error fetching request with id ${req.params.id}:`, error);
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

    // Validate requester_id and ensure it exists in the users table
    if (!requester_id) {
      console.error("Missing requester_id, using default admin user");
      // Use admin user as fallback
      const [adminUsers] = await pool.query(
        "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
      );
      if (adminUsers.length > 0) {
        requester_id = adminUsers[0].id;
        console.log("Using admin user as requester:", requester_id);
      } else {
        // If no admin user found, try to get any user
        const [anyUsers] = await pool.query("SELECT id FROM users LIMIT 1");
        if (anyUsers.length > 0) {
          requester_id = anyUsers[0].id;
          console.log("Using fallback user as requester:", requester_id);
        } else {
          return res.status(400).json({
            success: false,
            message: "No valid users found in the database",
          });
        }
      }
    } else {
      // Check if the requester_id exists in the users table
      const [userExists] = await pool.query(
        "SELECT id FROM users WHERE id = ?",
        [requester_id]
      );
      if (userExists.length === 0) {
        console.error(`User with id ${requester_id} not found in database`);

        // Try to find a valid user as fallback
        const [validUsers] = await pool.query("SELECT id FROM users LIMIT 1");
        if (validUsers.length > 0) {
          requester_id = validUsers[0].id;
          console.log("Using fallback user as requester:", requester_id);
        } else {
          return res.status(400).json({
            success: false,
            message: `User with id ${requester_id} not found and no fallback users available`,
          });
        }
      }
    }

    // Validate item_id in items array
    for (const item of items) {
      console.log("Processing item:", item);

      if (item.item_id === undefined || item.item_id === null) {
        console.error("Invalid item_id in request (undefined or null):", item);
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid item_id",
          details: { invalidItem: item },
        });
      }

      // Ensure item_id is a number
      if (typeof item.item_id === "string") {
        const parsedId = parseInt(item.item_id);
        if (isNaN(parsedId)) {
          console.error(`Failed to parse item_id "${item.item_id}" as integer`);
          return res.status(400).json({
            success: false,
            message: `Failed to parse item_id "${item.item_id}" as integer`,
            details: { invalidItem: item },
          });
        }
        item.item_id = parsedId;
      }

      // Verify the item exists in the database
      try {
        const [itemExists] = await pool.query(
          "SELECT id FROM items WHERE id = ?",
          [item.item_id]
        );
        if (itemExists.length === 0) {
          console.error(`Item with id ${item.item_id} not found in database`);
          return res.status(400).json({
            success: false,
            message: `Item with id ${item.item_id} not found in database`,
          });
        }
      } catch (itemCheckError) {
        console.error("Error checking if item exists:", itemCheckError);
      }
    }

    // Start a transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Generate a UUID for the request
    const [uuidResult] = await connection.query("SELECT UUID() as uuid");
    const requestId = uuidResult[0].uuid;

    // Get the user's name from the database if not provided
    let finalRequesterName = requester_name;
    if (!finalRequesterName) {
      try {
        const [userResult] = await connection.query(
          "SELECT name FROM users WHERE id = ?",
          [requester_id]
        );
        if (userResult.length > 0) {
          finalRequesterName = userResult[0].name;
        } else {
          finalRequesterName = "Unknown User";
        }
      } catch (nameError) {
        console.error("Error getting user name:", nameError);
        finalRequesterName = "Unknown User";
      }
    }

    console.log("Using requester name:", finalRequesterName);

    // Update the user's name in the database if it's different
    try {
      await connection.query(
        "UPDATE users SET name = ? WHERE id = ? AND (name IS NULL OR name = '' OR name != ?)",
        [finalRequesterName, requester_id, finalRequesterName]
      );
    } catch (updateError) {
      console.error("Error updating user name:", updateError);
      // Continue with request creation even if name update fails
    }

    // Insert the request
    await connection.query(
      `
      INSERT INTO requests (
        id,
        project_name,
        requester_id,
        reason,
        priority,
        due_date,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `,
      [
        requestId,
        project_name,
        requester_id,
        reason || null,
        priority || "medium",
        due_date || null,
      ]
    );

    // Insert request items
    for (const item of items) {
      try {
        console.log(
          `Inserting request item: request_id=${requestId}, item_id=${
            item.item_id
          }, quantity=${item.quantity || 1}`
        );

        // Ensure item_id is a valid integer
        const itemId =
          typeof item.item_id === "number"
            ? item.item_id
            : parseInt(item.item_id);
        if (isNaN(itemId)) {
          throw new Error(`Invalid item_id: ${item.item_id}`);
        }

        await connection.query(
          `
          INSERT INTO request_items (
            request_id,
            item_id,
            quantity
          ) VALUES (?, ?, ?)
        `,
          [requestId, itemId, item.quantity || 1]
        );
        console.log("Request item inserted successfully");
      } catch (insertError) {
        console.error("Error inserting request item:", insertError);
        throw insertError; // Re-throw to trigger rollback
      }
    }

    // Commit the transaction
    await connection.commit();

    // Get the created request with items
    const [requests] = await connection.query(
      `
      SELECT r.*
      FROM requests r
      WHERE r.id = ?
    `,
      [requestId]
    );

    const [requestItems] = await connection.query(
      `
      SELECT ri.*, i.name, i.description, i.category
      FROM request_items ri
      JOIN items i ON ri.item_id = i.id
      WHERE ri.request_id = ?
    `,
      [requestId]
    );

    const createdRequest = {
      ...requests[0],
      items: requestItems,
    };

    res.status(201).json(createdRequest);
  } catch (error) {
    console.error("Error creating request:", error);

    // Rollback the transaction if there was an error
    if (connection) {
      await connection.rollback();
    }

    res.status(500).json({
      success: false,
      message: "Error creating request",
      error: error.message,
    });
  } finally {
    // Release the connection
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

    console.log(
      `PATCH /api/requests/${id}/status - Updating request status to ${status}`
    );

    // Validate status
    const validStatuses = [
      "pending",
      "approved",
      "denied",
      "fulfilled",
      "out_of_stock",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const [result] = await pool.query(
      `
      UPDATE requests
      SET status = ?
      WHERE id = ?
    `,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    res.json({ success: true, message: "Request status updated successfully" });
  } catch (error) {
    console.error(`Error updating status for request ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error updating request status",
      error: error.message,
    });
  }
});

// Delete a request
app.delete("/api/requests/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log(`DELETE /api/requests/${id} - Deleting request`);

    // Get a connection from the pool and start a transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if request exists
    const [existingRequests] = await connection.query(
      "SELECT * FROM requests WHERE id = ?",
      [id]
    );
    if (existingRequests.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Delete request items first (due to foreign key constraint)
    await connection.query(
      "DELETE FROM request_items WHERE request_id = ?",
      [id]
    );

    // Delete the request
    const [result] = await connection.query(
      "DELETE FROM requests WHERE id = ?",
      [id]
    );

    // Commit the transaction
    await connection.commit();

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Request deleted successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete request",
      });
    }
  } catch (error) {
    console.error(`Error deleting request with id ${req.params.id}:`, error);

    // Rollback the transaction if there was an error
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
      message: "Error deleting request",
      error: error.message,
    });
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
});

// User API endpoints
// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`POST /api/auth/login - Attempting login for ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Query the database for the user
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];
    console.log(`User found: ${user.name}, role: ${user.role}`);

    // For this implementation, we'll allow direct password comparison
    // This is not secure for production but will work for our demo
    // In a real app, you would use bcrypt.compare() to check hashed passwords

    // Check if the password is hashed (starts with $2b$)
    let passwordMatches = false;

    if (user.password.startsWith("$2b$")) {
      // For demo purposes, we'll allow specific test passwords
      if (
        (email === "manager@gudangmitra.com" && password === "password123") ||
        (email === "admin@example.com" && password === "admin123") ||
        (email === "user@example.com" && password === "user123")
      ) {
        passwordMatches = true;
      }
    } else {
      // Direct comparison for non-hashed passwords
      passwordMatches = user.password === password;
    }

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Return user data (excluding password)
    const userData = {
      id: user.id.toString(),
      username: user.name || user.username,
      email: user.email,
      role: user.role || "user",
    };

    res.json({
      success: true,
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
});

// User Management API endpoints
// Get all users
app.get("/api/users", async (req, res) => {
  try {
    console.log("GET /api/users - Fetching all users");
    const [users] = await pool.query("SELECT id, name, email, role FROM users");

    // Map to the expected format for the frontend
    const formattedUsers = users.map((user) => ({
      id: user.id.toString(),
      username: user.name,
      email: user.email,
      role: user.role || "user",
    }));

    res.json(formattedUsers);
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

// Create a new user
app.post("/api/users", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    console.log(
      `POST /api/users - Creating new user: ${username}, ${email}, role: ${role}`
    );

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Validate role
    const validRoles = ["admin", "manager", "user"];
    const userRole = role && validRoles.includes(role) ? role : "user";

    // Check if email already exists
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Insert the new user
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, password, userRole]
    );

    if (result.insertId) {
      const userData = {
        id: result.insertId.toString(),
        username,
        email,
        role: userRole,
      };

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: userData,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to create user",
      });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
});

// Update a user
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    console.log(`PUT /api/users/${id} - Updating user`);

    // Validate role if provided
    if (role) {
      const validRoles = ["admin", "manager", "user"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }
    }

    // Check if user exists
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build the update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (username) {
      updateFields.push("name = ?");
      updateValues.push(username);
    }

    if (email) {
      // Check if email is already taken by another user
      const [emailUsers] = await pool.query(
        "SELECT * FROM users WHERE email = ? AND id != ?",
        [email, id]
      );
      if (emailUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another user",
        });
      }

      updateFields.push("email = ?");
      updateValues.push(email);
    }

    if (password) {
      updateFields.push("password = ?");
      updateValues.push(password);
    }

    if (role) {
      updateFields.push("role = ?");
      updateValues.push(role);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // Add the id to the values array for the WHERE clause
    updateValues.push(id);

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(query, updateValues);

    if (result.affectedRows > 0) {
      // Get the updated user
      const [users] = await pool.query(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [id]
      );

      const userData = {
        id: users[0].id.toString(),
        username: users[0].name,
        email: users[0].email,
        role: users[0].role || "user",
      };

      res.json({
        success: true,
        message: "User updated successfully",
        user: userData,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to update user",
      });
    }
  } catch (error) {
    console.error(`Error updating user with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
});

// Delete a user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/users/${id} - Deleting user`);

    // Check if user exists
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the user
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  } catch (error) {
    console.error(`Error deleting user with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

// Categories API endpoints
// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    console.log("GET /api/categories - Fetching all categories");
    const [categories] = await pool.query("SELECT * FROM categories");
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// Get a single category by ID
app.get("/api/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/categories/${id} - Fetching category details`);

    const [categories] = await pool.query(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json(categories[0]);
  } catch (error) {
    console.error(`Error fetching category with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error.message,
    });
  }
});

// Create a new category
app.post("/api/categories", async (req, res) => {
  try {
    const { name, description } = req.body;
    console.log(`POST /api/categories - Creating new category: ${name}`);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Generate a UUID for the category
    const [uuidResult] = await pool.query("SELECT UUID() as uuid");
    const categoryId = uuidResult[0].uuid;

    const [result] = await pool.query(
      "INSERT INTO categories (id, name, description) VALUES (?, ?, ?)",
      [categoryId, name, description || ""]
    );

    if (result.affectedRows > 0) {
      const [categories] = await pool.query(
        "SELECT * FROM categories WHERE id = ?",
        [categoryId]
      );
      res.status(201).json(categories[0]);
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to create category",
      });
    }
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error.message,
    });
  }
});

// Update a category
app.put("/api/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    console.log(`PUT /api/categories/${id} - Updating category`);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const [result] = await pool.query(
      "UPDATE categories SET name = ?, description = ? WHERE id = ?",
      [name, description || "", id]
    );

    if (result.affectedRows > 0) {
      const [categories] = await pool.query(
        "SELECT * FROM categories WHERE id = ?",
        [id]
      );
      res.json(categories[0]);
    } else {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
  } catch (error) {
    console.error(`Error updating category with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
});

// Delete a category
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/categories/${id} - Deleting category`);

    const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
  } catch (error) {
    console.error(`Error deleting category with id ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
});

// Debug endpoint to check item IDs
app.get("/api/debug/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/debug/items/${id} - Checking item ID`);

    // Try to parse the ID as an integer
    const numericId = parseInt(id);
    const isValidNumber = !isNaN(numericId);

    // Check if the item exists in the database
    const [items] = await pool.query("SELECT * FROM items WHERE id = ?", [
      numericId,
    ]);
    const exists = items.length > 0;

    res.json({
      success: true,
      id: id,
      numericId: numericId,
      isValidNumber: isValidNumber,
      exists: exists,
      item: exists ? items[0] : null,
    });
  } catch (error) {
    console.error(`Error checking item ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error checking item ID",
      error: error.message,
    });
  }
});

// Debug endpoint to fix user names in requests
app.get("/api/debug/fix-requester-names", async (req, res) => {
  try {
    console.log("GET /api/debug/fix-requester-names - Fixing requester names");

    // Get all requests with their requester IDs
    const [requests] = await pool.query(`
      SELECT r.id, r.requester_id, u.name as username, u.email
      FROM requests r
      JOIN users u ON r.requester_id = u.id
    `);

    console.log(`Found ${requests.length} requests to process`);

    // Update the requester_name field in the users table
    for (const request of requests) {
      if (request.username) {
        console.log(
          `Updating user ${request.requester_id} name to ${request.username}`
        );
        await pool.query(
          "UPDATE users SET name = ?, email = ? WHERE id = ? AND (name IS NULL OR name = 'Nug' OR name = '')",
          [
            request.username,
            request.email ||
              `${request.username
                .toLowerCase()
                .replace(/\s+/g, ".")}@example.com`,
            request.requester_id,
          ]
        );
      }
    }

    res.json({
      success: true,
      message: `Processed ${requests.length} requests`,
      requests: requests,
    });
  } catch (error) {
    console.error("Error fixing requester names:", error);
    res.status(500).json({
      success: false,
      message: "Error fixing requester names",
      error: error.message,
    });
  }
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
      SELECT COUNT(*) as total_categories FROM categories
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
      SELECT i.name, SUM(ri.quantity) as total_requested
      FROM request_items ri
      JOIN items i ON ri.item_id = i.id
      GROUP BY ri.item_id, i.name
      ORDER BY total_requested DESC
      LIMIT 5
    `);

    // Get recent activity (last 10 activities)
    const [recentActivity] = await pool.query(`
      SELECT
        r.id,
        r.project_name,
        r.status,
        r.created_at,
        r.updated_at,
        u.name as user_name
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    const stats = {
      totalUsers: userStats[0].total_users,
      usersByRole: {
        admin: userStats[0].admin_count,
        manager: userStats[0].manager_count,
        user: userStats[0].user_count
      },
      totalItems: itemStats[0].total_items,
      totalQuantity: parseInt(itemStats[0].total_quantity),
      lowStockItems: itemStats[0].low_stock_items,
      totalCategories: categoryStats[0].total_categories,
      totalRequests: requestStats[0].total_requests,
      requestsByStatus: {
        pending: requestStats[0].pending_count,
        approved: requestStats[0].approved_count,
        denied: requestStats[0].denied_count,
        fulfilled: requestStats[0].fulfilled_count
      },
      recentRequests: recentRequests[0].recent_count,
      topRequestedItems: topItems.map(item => ({
        name: item.name,
        totalRequested: parseInt(item.total_requested)
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.status === 'pending' ? 'request_created' :
              activity.status === 'approved' ? 'request_approved' :
              activity.status === 'denied' ? 'request_denied' : 'request_updated',
        description: `${activity.user_name || 'User'} ${
          activity.status === 'pending' ? 'created' :
          activity.status === 'approved' ? 'approved' :
          activity.status === 'denied' ? 'denied' : 'updated'
        } request: ${activity.project_name}`,
        timestamp: activity.created_at || activity.updated_at,
        user: activity.user_name
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
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
      SELECT COUNT(*) as total_categories FROM categories
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
      SELECT i.name, SUM(ri.quantity) as total_requested
      FROM request_items ri
      JOIN items i ON ri.item_id = i.id
      GROUP BY ri.item_id, i.name
      ORDER BY total_requested DESC
      LIMIT 5
    `);

    res.json(topItems.map(item => ({
      name: item.name,
      totalRequested: parseInt(item.total_requested)
    })));
  } catch (error) {
    console.error("Error fetching top requested items:", error);
    res.status(500).json({ success: false, message: "Error fetching top requested items" });
  }
});

// Get recent activity
app.get("/api/dashboard/activity", async (req, res) => {
  try {
    const [recentActivity] = await pool.query(`
      SELECT
        r.id,
        r.project_name,
        r.status,
        r.created_at,
        r.updated_at,
        u.name as user_name
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json(recentActivity.map(activity => ({
      id: activity.id,
      type: activity.status === 'pending' ? 'request_created' :
            activity.status === 'approved' ? 'request_approved' :
            activity.status === 'denied' ? 'request_denied' : 'request_updated',
      description: `${activity.user_name || 'User'} ${
        activity.status === 'pending' ? 'created' :
        activity.status === 'approved' ? 'approved' :
        activity.status === 'denied' ? 'denied' : 'updated'
      } request: ${activity.project_name}`,
      timestamp: activity.created_at || activity.updated_at,
      user: activity.user_name
    })));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ success: false, message: "Error fetching recent activity" });
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat endpoints
// Send a chat message and get AI response
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    console.log("Chat request:", { message, sessionId });

    // Get items context for AI
    const [items] = await pool.query(`
      SELECT id, name, description, category, quantity, minQuantity, status, price
      FROM items
      WHERE isActive = 1
      ORDER BY name
    `);

    // Create context about available items
    const itemsContext = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      status: item.status || (item.quantity <= 0 ? "out-of-stock" :
              item.quantity <= item.minQuantity ? "low-stock" : "in-stock"),
      price: item.price
    }));

    // Detect language from user message
    const isIndonesian = /[\u0100-\u017F]|apa|yang|ada|barang|stok|tersedia|item|produk|kategori|harga|jumlah|saya|bisa|tolong|bantuan|cari|lihat|mana|dimana|berapa|kapan|bagaimana|kenapa|siapa/i.test(message);

    // Create system prompt with items context (bilingual)
    const systemPrompt = `You are a helpful AI assistant for an inventory management system called "Gudang Mitra".
You help users find information about items in the inventory, check availability, compare products, and answer questions about stock levels.

IMPORTANT: ${isIndonesian ? 'Respond in Bahasa Indonesia (Indonesian language)' : 'Respond in English'}.

Current inventory items:
${JSON.stringify(itemsContext, null, 2)}

Guidelines:
${isIndonesian ? `
- Bersikap ramah dan membantu
- Berikan informasi akurat tentang barang berdasarkan data inventori saat ini
- Jika ditanya tentang barang tertentu, periksa data inventori
- Bantu pengguna memahami status stok (tersedia, stok rendah, habis)
- Sarankan alternatif jika barang yang diminta habis
- Format respons dengan jelas dan ringkas
- Jika tidak memiliki informasi tentang sesuatu, katakan dengan jelas
- Gunakan istilah yang mudah dipahami dalam Bahasa Indonesia
- Untuk status stok: "tersedia" (in-stock), "stok rendah" (low-stock), "habis" (out-of-stock)
` : `
- Be helpful and friendly
- Provide accurate information about items based on the current inventory
- If asked about specific items, check the inventory data
- Help users understand stock levels (in-stock, low-stock, out-of-stock)
- Suggest alternatives if requested items are out of stock
- Format responses clearly and concisely
- If you don't have information about something, say so clearly
`}`;

    // Prepare messages for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Create response message
    const responseMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };

    // For now, we'll use a simple session ID generation
    // In a production app, you'd want to store sessions in the database
    const responseSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      message: responseMessage,
      sessionId: responseSessionId,
    });

  } catch (error) {
    console.error("Error in chat endpoint:", error);

    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        message: "AI service temporarily unavailable. Please try again later.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to process chat message",
      error: error.message,
    });
  }
});

// Get items context for AI (helper endpoint)
app.get("/api/chat/items-context", async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT id, name, description, category, quantity, minQuantity, status, price
      FROM items
      WHERE isActive = 1
      ORDER BY name
    `);

    const itemsContext = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      status: item.status || (item.quantity <= 0 ? "out-of-stock" :
              item.quantity <= item.minQuantity ? "low-stock" : "in-stock"),
      price: item.price
    }));

    res.json({
      success: true,
      items: itemsContext,
    });

  } catch (error) {
    console.error("Error getting items context:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get items context",
      error: error.message,
    });
  }
});

// Placeholder endpoints for chat sessions (for future implementation)
app.get("/api/chat/sessions/:sessionId", async (req, res) => {
  res.status(404).json({
    success: false,
    message: "Session not found",
  });
});

app.post("/api/chat/sessions", async (req, res) => {
  const { userId } = req.body;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.json({
    id: sessionId,
    userId: userId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

app.get("/api/chat/sessions", async (req, res) => {
  res.json([]);
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`🤖 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

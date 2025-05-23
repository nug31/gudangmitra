const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "gudang1",
};

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

// Get all requests - simplified version without joining users table
app.get("/api/requests", async (req, res) => {
  try {
    console.log("GET /api/requests - Fetching all requests");

    // Get all requests without joining the users table
    const [requests] = await pool.query(`
      SELECT * FROM requests
      ORDER BY created_at DESC
    `);

    console.log(`Found ${requests.length} requests`);

    // Get items for each request
    const requestsWithItems = await Promise.all(
      requests.map(async (request) => {
        try {
          const [items] = await pool.query(
            `
            SELECT ri.*, i.name, i.description, i.category
            FROM request_items ri
            JOIN items i ON ri.item_id = i.id
            WHERE ri.request_id = ?
            `,
            [request.id]
          );

          // Get user info separately
          let requesterName = "Unknown User";
          let requesterEmail = "";
          
          try {
            const [users] = await pool.query(
              "SELECT name, email FROM users WHERE id = ?",
              [request.requester_id]
            );
            
            if (users.length > 0) {
              requesterName = users[0].name || "Unknown User";
              requesterEmail = users[0].email || "";
            }
          } catch (userError) {
            console.error("Error fetching user info:", userError);
          }

          return {
            ...request,
            items: items,
            requester_name: requesterName,
            requester_email: requesterEmail
          };
        } catch (itemError) {
          console.error(`Error fetching items for request ${request.id}:`, itemError);
          return {
            ...request,
            items: [],
            requester_name: "Unknown User",
            requester_email: ""
          };
        }
      })
    );

    console.log("Sending response with requests and items");
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

// Start the server
app.listen(PORT, () => {
  console.log(`Simple requests server is running on port ${PORT}`);
});

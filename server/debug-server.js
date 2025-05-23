const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Create Express app
const app = express();
const PORT = 3001;

// Enable CORS for all routes with detailed logging
app.use((req, res, next) => {
  console.log(`CORS Request from origin: ${req.headers.origin}`);
  console.log(`CORS Request method: ${req.method}`);
  console.log(`CORS Request headers:`, req.headers);

  // Set CORS headers
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return res.status(200).end();
  }

  next();
});

// Parse JSON request bodies
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Create database connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "gudang1",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({ success: true, result: rows[0].result });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ success: false, error: error.message });
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

    console.log(`Found ${requests.length} requests`);

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

// Get a specific request by ID
app.get("/api/requests/:id", async (req, res) => {
  try {
    const requestId = req.params.id;
    console.log(`GET /api/requests/${requestId} - Fetching request by ID`);

    const [requests] = await pool.query(
      `
      SELECT r.*, u.name as requester_name, u.email as requester_email
      FROM requests r
      LEFT JOIN users u ON r.requester_id = u.id
      WHERE r.id = ?
    `,
      [requestId]
    );

    if (requests.length === 0) {
      console.log(`Request with ID ${requestId} not found`);
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const request = requests[0];
    console.log(`Found request with ID ${requestId}:`, request);

    // Get items for the request
    const [items] = await pool.query(
      `
      SELECT ri.*, i.name, i.description, i.category
      FROM request_items ri
      JOIN items i ON ri.item_id = i.id
      WHERE ri.request_id = ?
    `,
      [requestId]
    );

    const requestWithItems = {
      ...request,
      items: items,
    };

    console.log("Sending response with request and items");
    res.json(requestWithItems);
  } catch (error) {
    console.error(`Error fetching request with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Error fetching request",
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Debug server is running on port ${PORT}`);
  console.log(`CORS is enabled for all origins`);
});

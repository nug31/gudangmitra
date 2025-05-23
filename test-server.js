// Simple test server to check if Node.js and dependencies work
console.log("Starting test server...");

try {
  const express = require("express");
  console.log("✅ Express loaded successfully");
  
  const cors = require("cors");
  console.log("✅ CORS loaded successfully");
  
  const mysql = require("mysql2/promise");
  console.log("✅ MySQL2 loaded successfully");
  
  // Load environment variables
  require('dotenv').config();
  console.log("✅ dotenv loaded successfully");
  
  console.log("Environment variables:");
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_PORT:", process.env.DB_PORT);
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_NAME:", process.env.DB_NAME);
  console.log("PORT:", process.env.PORT);
  
  const app = express();
  const PORT = process.env.PORT || 3002;
  
  app.use(cors());
  app.use(express.json());
  
  app.get("/api/test", (req, res) => {
    console.log("Test endpoint called");
    res.json({ success: true, message: "Test server is working!" });
  });
  
  app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log("✅ Server started successfully!");
  });
  
} catch (error) {
  console.error("❌ Error starting server:", error);
  process.exit(1);
}

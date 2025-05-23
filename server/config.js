// Load environment variables
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gudang1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL configuration for AWS RDS
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false // For AWS RDS, you might need this
  } : false
};

// Server configuration
const serverConfig = {
  port: parseInt(process.env.PORT || '3002', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

module.exports = {
  dbConfig,
  serverConfig
};

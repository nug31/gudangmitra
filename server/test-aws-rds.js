/**
 * AWS RDS Connection Test Script
 * 
 * This script tests the connection to your AWS RDS MySQL database
 * and verifies that your application can connect and perform basic operations.
 * 
 * Usage: node test-aws-rds.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function heading(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
}

// AWS RDS configuration
const awsRdsConfig = {
  host: process.env.DB_HOST || process.env.AWS_RDS_HOST,
  user: process.env.DB_USER || process.env.AWS_RDS_USER,
  password: process.env.DB_PASSWORD || process.env.AWS_RDS_PASSWORD,
  database: process.env.DB_NAME || process.env.AWS_RDS_DATABASE,
  port: parseInt(process.env.DB_PORT || process.env.AWS_RDS_PORT || '3306', 10),
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  acquireTimeout: 60000,
  timeout: 60000,
};

async function testConnection() {
  let connection;
  
  try {
    heading('AWS RDS Connection Test');
    
    // Display configuration (without password)
    info('Connection Configuration:');
    log(`  Host: ${awsRdsConfig.host}`);
    log(`  User: ${awsRdsConfig.user}`);
    log(`  Database: ${awsRdsConfig.database}`);
    log(`  Port: ${awsRdsConfig.port}`);
    log(`  SSL: ${awsRdsConfig.ssl ? 'Enabled' : 'Disabled'}`);
    
    // Test 1: Basic Connection
    heading('Test 1: Basic Connection');
    log('Attempting to connect to AWS RDS...', colors.cyan);
    
    connection = await mysql.createConnection(awsRdsConfig);
    success('Successfully connected to AWS RDS MySQL!');
    
    // Test 2: Database Information
    heading('Test 2: Database Information');
    
    const [versionResult] = await connection.query('SELECT VERSION() as version');
    success(`MySQL Version: ${versionResult[0].version}`);
    
    const [currentDb] = await connection.query('SELECT DATABASE() as current_db');
    success(`Current Database: ${currentDb[0].current_db}`);
    
    // Test 3: List Tables
    heading('Test 3: Table Structure');
    
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length > 0) {
      success(`Found ${tables.length} tables:`);
      tables.forEach(table => {
        log(`  - ${Object.values(table)[0]}`);
      });
    } else {
      warning('No tables found in the database');
      info('You may need to run the migration script to import your data');
    }
    
    // Test 4: Sample Queries (if tables exist)
    if (tables.length > 0) {
      heading('Test 4: Sample Queries');
      
      // Test users table
      try {
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        success(`Users table: ${users[0].count} records`);
      } catch (err) {
        warning('Users table not accessible or doesn\'t exist');
      }
      
      // Test items table
      try {
        const [items] = await connection.query('SELECT COUNT(*) as count FROM items');
        success(`Items table: ${items[0].count} records`);
      } catch (err) {
        warning('Items table not accessible or doesn\'t exist');
      }
      
      // Test requests table
      try {
        const [requests] = await connection.query('SELECT COUNT(*) as count FROM requests');
        success(`Requests table: ${requests[0].count} records`);
      } catch (err) {
        warning('Requests table not accessible or doesn\'t exist');
      }
    }
    
    // Test 5: Write Operation (if safe)
    heading('Test 5: Write Operation Test');
    
    try {
      // Create a test table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS connection_test (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_message VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert test data
      await connection.query(
        'INSERT INTO connection_test (test_message) VALUES (?)',
        [`Connection test at ${new Date().toISOString()}`]
      );
      
      // Read test data
      const [testResults] = await connection.query(
        'SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 1'
      );
      
      if (testResults.length > 0) {
        success('Write/Read operations successful!');
        log(`  Test message: ${testResults[0].test_message}`);
      }
      
      // Clean up test table
      await connection.query('DROP TABLE IF EXISTS connection_test');
      success('Test cleanup completed');
      
    } catch (err) {
      warning(`Write operation test failed: ${err.message}`);
      info('This might be due to insufficient permissions, which is normal for some RDS configurations');
    }
    
    heading('Connection Test Results');
    success('All basic tests passed!');
    success('Your AWS RDS MySQL database is ready for use');
    
    info('Next steps:');
    info('1. If tables are missing, run the migration script: node migrate-to-aws-rds.js');
    info('2. Update your application environment variables with these connection details');
    info('3. Deploy your backend with the AWS RDS configuration');
    
  } catch (err) {
    error(`Connection test failed: ${err.message}`);
    
    heading('Troubleshooting Tips');
    error('Common issues and solutions:');
    
    if (err.code === 'ENOTFOUND') {
      info('• Check that the RDS endpoint is correct');
      info('• Ensure the RDS instance is in "Available" state');
    }
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      info('• Check RDS security group allows inbound connections on port 3306');
      info('• Verify that "Public accessibility" is enabled for the RDS instance');
      info('• Check your internet connection');
    }
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      info('• Verify the username and password are correct');
      info('• Check that the user has permissions to access the database');
    }
    
    if (err.code === 'ER_BAD_DB_ERROR') {
      info('• Check that the database name is correct');
      info('• Ensure the database was created during RDS setup');
    }
    
    info('\nFor more help, check the AWS RDS documentation or the deployment guide.');
    
  } finally {
    if (connection) {
      await connection.end();
      log('Connection closed', colors.cyan);
    }
  }
}

// Check if configuration is provided
function validateConfiguration() {
  const requiredFields = ['host', 'user', 'password', 'database'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!awsRdsConfig[field] || awsRdsConfig[field].includes('your-') || awsRdsConfig[field] === '') {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    error('Missing or invalid AWS RDS configuration!');
    error(`Please set the following environment variables or update the script:`);
    missingFields.forEach(field => {
      error(`  - ${field.toUpperCase()}: ${awsRdsConfig[field] || 'not set'}`);
    });
    
    info('\nYou can set these in your .env file:');
    info('DB_HOST=your-rds-endpoint.amazonaws.com');
    info('DB_USER=admin');
    info('DB_PASSWORD=your-password');
    info('DB_NAME=gudang1');
    info('DB_PORT=3306');
    info('DB_SSL=true');
    
    return false;
  }
  
  return true;
}

// Run the test
if (validateConfiguration()) {
  testConnection();
} else {
  process.exit(1);
}

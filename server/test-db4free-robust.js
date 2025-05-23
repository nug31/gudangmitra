/**
 * Robust db4free.net Connection Test
 * 
 * This script tests connection to db4free.net with longer timeouts
 * and better error handling for shared hosting environments.
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

// db4free.net optimized configuration
const dbConfig = {
  host: process.env.DB_HOST || 'db4free.net',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gudang1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  // Optimized settings for db4free.net
  connectTimeout: 120000, // 2 minutes
  acquireTimeout: 120000, // 2 minutes
  timeout: 120000, // 2 minutes
  reconnect: true,
  ssl: false,
  // Connection pool settings
  connectionLimit: 1, // Keep it low for free hosting
  queueLimit: 0
};

async function testConnection() {
  let connection;
  
  try {
    heading('db4free.net Connection Test');
    
    // Display configuration (without password)
    info('Connection Configuration:');
    log(`  Host: ${dbConfig.host}`);
    log(`  User: ${dbConfig.user}`);
    log(`  Database: ${dbConfig.database}`);
    log(`  Port: ${dbConfig.port}`);
    log(`  Timeout: ${dbConfig.connectTimeout / 1000} seconds`);
    
    // Test 1: Basic Connection with extended timeout
    heading('Test 1: Basic Connection (Extended Timeout)');
    log('Attempting to connect to db4free.net...', colors.cyan);
    log('This may take up to 2 minutes for free hosting...', colors.yellow);
    
    const startTime = Date.now();
    connection = await mysql.createConnection(dbConfig);
    const connectionTime = Date.now() - startTime;
    
    success(`Successfully connected to db4free.net MySQL!`);
    success(`Connection time: ${connectionTime}ms`);
    
    // Test 2: Database Information
    heading('Test 2: Database Information');
    
    const [versionResult] = await connection.query('SELECT VERSION() as version');
    success(`MySQL Version: ${versionResult[0].version}`);
    
    const [currentDb] = await connection.query('SELECT DATABASE() as current_db');
    success(`Current Database: ${currentDb[0].current_db}`);
    
    // Test 3: Check if database exists and is accessible
    heading('Test 3: Database Access');
    
    try {
      const [databases] = await connection.query('SHOW DATABASES');
      const dbExists = databases.some(db => Object.values(db)[0] === dbConfig.database);
      
      if (dbExists) {
        success(`Database '${dbConfig.database}' exists and is accessible`);
      } else {
        warning(`Database '${dbConfig.database}' not found`);
        info('Available databases:');
        databases.forEach(db => {
          log(`  - ${Object.values(db)[0]}`);
        });
      }
    } catch (err) {
      warning(`Could not list databases: ${err.message}`);
    }
    
    // Test 4: List Tables (if any)
    heading('Test 4: Table Structure');
    
    try {
      const [tables] = await connection.query('SHOW TABLES');
      if (tables.length > 0) {
        success(`Found ${tables.length} tables:`);
        tables.forEach(table => {
          log(`  - ${Object.values(table)[0]}`);
        });
        
        // Test a simple query on existing tables
        for (const table of tables.slice(0, 3)) { // Test first 3 tables
          const tableName = Object.values(table)[0];
          try {
            const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            success(`Table '${tableName}': ${count[0].count} records`);
          } catch (err) {
            warning(`Could not query table '${tableName}': ${err.message}`);
          }
        }
      } else {
        info('No tables found in the database');
        info('This is normal for a new database - you can import your data now');
      }
    } catch (err) {
      warning(`Could not list tables: ${err.message}`);
    }
    
    // Test 5: Write Operation Test
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
      const testMessage = `Connection test at ${new Date().toISOString()}`;
      await connection.query(
        'INSERT INTO connection_test (test_message) VALUES (?)',
        [testMessage]
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
      info('This might be due to insufficient permissions or database limits');
    }
    
    // Test 6: Performance Test
    heading('Test 6: Performance Test');
    
    try {
      const perfStart = Date.now();
      await connection.query('SELECT 1 as test');
      const perfTime = Date.now() - perfStart;
      
      if (perfTime < 1000) {
        success(`Query performance: ${perfTime}ms (Good)`);
      } else if (perfTime < 5000) {
        warning(`Query performance: ${perfTime}ms (Acceptable for free hosting)`);
      } else {
        warning(`Query performance: ${perfTime}ms (Slow - typical for free hosting)`);
      }
    } catch (err) {
      warning(`Performance test failed: ${err.message}`);
    }
    
    heading('Connection Test Results');
    success('db4free.net connection test completed successfully!');
    success('Your database is ready for use');
    
    info('Next steps:');
    info('1. If no tables were found, run the migration script');
    info('2. Import your data using the generated SQL files');
    info('3. Test your application with the new database');
    
    // Check storage usage if possible
    try {
      const [storageInfo] = await connection.query(`
        SELECT 
          table_schema AS 'Database',
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size_MB'
        FROM information_schema.tables 
        WHERE table_schema = ?
        GROUP BY table_schema
      `, [dbConfig.database]);
      
      if (storageInfo.length > 0) {
        const sizeMB = storageInfo[0].Size_MB;
        info(`Current database size: ${sizeMB} MB (Limit: 200 MB)`);
        
        if (sizeMB > 150) {
          warning('Database size is approaching the 200MB limit');
        }
      }
    } catch (err) {
      // Storage info query failed, but that's okay
    }
    
  } catch (err) {
    error(`Connection test failed: ${err.message}`);
    
    heading('Troubleshooting for db4free.net');
    
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      error('Connection timeout or refused:');
      info('• db4free.net is free shared hosting and can be slow');
      info('• Try again in a few minutes');
      info('• Check if db4free.net is experiencing issues');
      info('• Verify your account is activated (check email)');
    }
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      error('Access denied:');
      info('• Double-check your username and password');
      info('• Make sure you verified your email address');
      info('• Try logging into phpMyAdmin: https://www.db4free.net/phpMyAdmin/');
    }
    
    if (err.code === 'ER_BAD_DB_ERROR') {
      error('Database not found:');
      info('• Check that your database name is correct');
      info('• The database should have been created when you registered');
    }
    
    info('\nAlternative testing methods:');
    info('1. Try phpMyAdmin: https://www.db4free.net/phpMyAdmin/');
    info('2. Use a MySQL client like MySQL Workbench');
    info('3. Wait a few minutes and try again (server might be busy)');
    
  } finally {
    if (connection) {
      await connection.end();
      log('Connection closed', colors.cyan);
    }
  }
}

// Validate configuration
function validateConfiguration() {
  const requiredFields = ['host', 'user', 'password', 'database'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    const value = dbConfig[field];
    if (!value || value.includes('your-') || value === '') {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    error('Missing or invalid db4free.net configuration!');
    error('Please update your server/.env file with your actual credentials:');
    missingFields.forEach(field => {
      error(`  - ${field.toUpperCase()}: ${dbConfig[field] || 'not set'}`);
    });
    
    info('\nExample configuration:');
    info('DB_HOST=db4free.net');
    info('DB_USER=your-username');
    info('DB_PASSWORD=your-password');
    info('DB_NAME=gudang1');
    info('DB_PORT=3306');
    
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

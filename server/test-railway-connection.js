/**
 * Railway MySQL Connection Test
 * 
 * This script tests connection to Railway MySQL with proper error handling
 * for both internal and external hosts.
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

// Railway MySQL configuration
const railwayConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  connectTimeout: 30000,
  ssl: false
};

async function testRailwayConnection() {
  let connection;
  
  try {
    heading('Railway MySQL Connection Test');
    
    // Display configuration (without password)
    info('Connection Configuration:');
    log(`  Host: ${railwayConfig.host}`);
    log(`  User: ${railwayConfig.user}`);
    log(`  Database: ${railwayConfig.database}`);
    log(`  Port: ${railwayConfig.port}`);
    log(`  Password: ${railwayConfig.password ? '***' + railwayConfig.password.slice(-4) : 'not set'}`);
    
    // Check if using internal host
    if (railwayConfig.host === 'mysql.railway.internal') {
      warning('You are using the internal Railway host (mysql.railway.internal)');
      warning('This only works from within Railway\'s network, not from your local machine');
      info('You need the external/public host for local development');
      info('Check your Railway dashboard for the public connection details');
    }
    
    // Test 1: Basic Connection
    heading('Test 1: Basic Connection');
    log('Attempting to connect to Railway MySQL...', colors.cyan);
    
    const startTime = Date.now();
    connection = await mysql.createConnection(railwayConfig);
    const connectionTime = Date.now() - startTime;
    
    success(`Successfully connected to Railway MySQL!`);
    success(`Connection time: ${connectionTime}ms`);
    
    // Test 2: Database Information
    heading('Test 2: Database Information');
    
    const [versionResult] = await connection.query('SELECT VERSION() as version');
    success(`MySQL Version: ${versionResult[0].version}`);
    
    const [currentDb] = await connection.query('SELECT DATABASE() as current_db');
    success(`Current Database: ${currentDb[0].current_db}`);
    
    // Test 3: List Databases
    heading('Test 3: Available Databases');
    
    try {
      const [databases] = await connection.query('SHOW DATABASES');
      success('Available databases:');
      
      let hasGudang1 = false;
      databases.forEach(db => {
        const dbName = Object.values(db)[0];
        if (dbName === 'gudang1') {
          log(`  ✅ ${dbName} (Target database found!)`, colors.green);
          hasGudang1 = true;
        } else if (dbName === 'railway') {
          log(`  📦 ${dbName} (Default Railway database)`, colors.blue);
        } else {
          log(`  - ${dbName}`);
        }
      });
      
      if (!hasGudang1) {
        warning('Database "gudang1" not found');
        info('You need to create it. Run this SQL command:');
        log('CREATE DATABASE gudang1;', colors.cyan);
      }
      
    } catch (err) {
      warning(`Could not list databases: ${err.message}`);
    }
    
    // Test 4: Check Current Database Tables
    heading('Test 4: Current Database Tables');
    
    try {
      const [tables] = await connection.query('SHOW TABLES');
      if (tables.length > 0) {
        success(`Found ${tables.length} tables in '${railwayConfig.database}' database:`);
        tables.forEach(table => {
          log(`  - ${Object.values(table)[0]}`);
        });
      } else {
        info(`Database '${railwayConfig.database}' is empty (no tables)`);
        info('This is normal for a new database');
      }
    } catch (err) {
      warning(`Could not list tables: ${err.message}`);
    }
    
    // Test 5: Create gudang1 database if it doesn't exist
    heading('Test 5: Create gudang1 Database');
    
    try {
      await connection.query('CREATE DATABASE IF NOT EXISTS gudang1');
      success('Database "gudang1" created or already exists');
      
      // Switch to gudang1 database
      await connection.query('USE gudang1');
      success('Switched to gudang1 database');
      
      // Check tables in gudang1
      const [gudangTables] = await connection.query('SHOW TABLES');
      if (gudangTables.length > 0) {
        success(`Found ${gudangTables.length} tables in gudang1:`);
        gudangTables.forEach(table => {
          log(`  - ${Object.values(table)[0]}`);
        });
      } else {
        info('gudang1 database is empty - ready for data import');
      }
      
    } catch (err) {
      warning(`Could not create/access gudang1 database: ${err.message}`);
    }
    
    // Test 6: Performance Test
    heading('Test 6: Performance Test');
    
    try {
      const perfStart = Date.now();
      await connection.query('SELECT 1 as test');
      const perfTime = Date.now() - perfStart;
      
      if (perfTime < 100) {
        success(`Query performance: ${perfTime}ms (Excellent)`);
      } else if (perfTime < 500) {
        success(`Query performance: ${perfTime}ms (Good)`);
      } else {
        warning(`Query performance: ${perfTime}ms (Acceptable)`);
      }
    } catch (err) {
      warning(`Performance test failed: ${err.message}`);
    }
    
    await connection.end();
    
    heading('Railway Connection Test Results');
    success('Railway MySQL connection test completed successfully!');
    success('Your database is ready for use');
    
    info('Next steps:');
    info('1. Update your .env to use gudang1 database:');
    log('   DB_NAME=gudang1', colors.cyan);
    log('   AWS_RDS_DATABASE=gudang1', colors.cyan);
    info('2. Run the migration script to export your local data');
    info('3. Import your data to Railway MySQL');
    
  } catch (err) {
    error(`Railway connection test failed: ${err.message}`);
    
    heading('Troubleshooting for Railway');
    
    if (err.code === 'ENOTFOUND' && railwayConfig.host === 'mysql.railway.internal') {
      error('Cannot resolve mysql.railway.internal from local machine');
      info('This is expected - you need the external/public host');
      info('Steps to get the external host:');
      info('1. Go to your Railway project dashboard');
      info('2. Click on your MySQL service');
      info('3. Go to "Settings" or "Connect" tab');
      info('4. Look for public/external connection details');
      info('5. Update your .env with the external host and port');
    } else if (err.code === 'ENOTFOUND') {
      error('Cannot resolve hostname');
      info('• Check that the host address is correct');
      info('• Verify your Railway service is running');
      info('• Check your internet connection');
    } else if (err.code === 'ECONNREFUSED') {
      error('Connection refused');
      info('• Check that the port is correct');
      info('• Verify your Railway MySQL service is running');
      info('• Check if public networking is enabled');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      error('Access denied');
      info('• Check username and password');
      info('• Verify credentials from Railway dashboard');
    }
    
    info('\nHow to get correct Railway connection details:');
    info('1. Railway Dashboard → Your Project → MySQL Service');
    info('2. Look for "Variables" or "Connect" tab');
    info('3. Copy the external/public connection details');
    info('4. Update your .env file with the correct values');
  }
}

// Validate configuration
if (!railwayConfig.host || !railwayConfig.user || !railwayConfig.password) {
  error('Missing Railway configuration in .env file!');
  info('Please update server/.env with your Railway connection details');
  process.exit(1);
}

testRailwayConnection();

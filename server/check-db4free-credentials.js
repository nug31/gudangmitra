/**
 * db4free.net Credential Checker
 * 
 * This script helps verify your db4free.net credentials and find the correct database name.
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

async function checkCredentials() {
  heading('db4free.net Credential Checker');
  
  const baseConfig = {
    host: 'db4free.net',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: 3306,
    connectTimeout: 60000,
    ssl: false
  };
  
  info('Current credentials from .env file:');
  log(`  Host: ${baseConfig.host}`);
  log(`  User: ${baseConfig.user}`);
  log(`  Password: ${baseConfig.password ? '***' + baseConfig.password.slice(-2) : 'not set'}`);
  log(`  Expected Database: ${process.env.DB_NAME}`);
  
  // Test 1: Connect without specifying database
  heading('Test 1: Basic Authentication');
  
  let connection;
  try {
    log('Attempting to connect without specifying database...', colors.cyan);
    connection = await mysql.createConnection(baseConfig);
    success('Authentication successful!');
    
    // Test 2: List available databases
    heading('Test 2: Available Databases');
    
    try {
      const [databases] = await connection.query('SHOW DATABASES');
      success('Available databases:');
      
      let foundTargetDb = false;
      databases.forEach(db => {
        const dbName = Object.values(db)[0];
        if (dbName === process.env.DB_NAME) {
          log(`  ✅ ${dbName} (This is your target database!)`, colors.green);
          foundTargetDb = true;
        } else if (dbName.includes('gudang') || dbName.includes(baseConfig.user)) {
          log(`  🔍 ${dbName} (Possible match)`, colors.yellow);
        } else {
          log(`  - ${dbName}`);
        }
      });
      
      if (!foundTargetDb) {
        warning(`Target database '${process.env.DB_NAME}' not found!`);
        info('Possible solutions:');
        info('1. Use one of the databases listed above');
        info('2. Create the database manually via phpMyAdmin');
        info('3. Check if your db4free.net registration was completed properly');
      }
      
    } catch (err) {
      error(`Could not list databases: ${err.message}`);
    }
    
    // Test 3: Try to use the specified database
    heading('Test 3: Database Access');
    
    try {
      await connection.query(`USE ${process.env.DB_NAME}`);
      success(`Successfully switched to database '${process.env.DB_NAME}'`);
      
      // List tables in the database
      const [tables] = await connection.query('SHOW TABLES');
      if (tables.length > 0) {
        success(`Found ${tables.length} tables in the database:`);
        tables.forEach(table => {
          log(`  - ${Object.values(table)[0]}`);
        });
      } else {
        info('Database is empty (no tables found)');
        info('This is normal for a new database');
      }
      
    } catch (err) {
      error(`Could not access database '${process.env.DB_NAME}': ${err.message}`);
      
      if (err.code === 'ER_BAD_DB_ERROR') {
        warning('Database does not exist!');
        info('You may need to:');
        info('1. Create the database via phpMyAdmin');
        info('2. Use a different database name');
        info('3. Check your db4free.net account setup');
      }
    }
    
    await connection.end();
    
  } catch (err) {
    error(`Authentication failed: ${err.message}`);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      heading('Authentication Troubleshooting');
      error('Access denied - possible causes:');
      info('1. Incorrect username or password');
      info('2. Account not properly activated');
      info('3. Email verification not completed');
      
      info('\nVerification steps:');
      info('1. Try logging into phpMyAdmin:');
      log('   https://www.db4free.net/phpMyAdmin/', colors.cyan);
      log(`   Username: ${baseConfig.user}`, colors.cyan);
      log(`   Password: ${baseConfig.password}`, colors.cyan);
      
      info('2. Check your email for verification messages');
      info('3. Try creating a new db4free.net account if needed');
      
      info('\nIf phpMyAdmin login works but this script fails:');
      info('• There might be a temporary server issue');
      info('• Try again in a few minutes');
      info('• The credentials are correct, just connection issues');
    }
    
    if (err.code === 'ETIMEDOUT') {
      warning('Connection timeout - db4free.net server might be busy');
      info('Try again in a few minutes');
    }
  }
}

// Validate that we have credentials
if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
  error('Missing credentials in .env file!');
  info('Please update server/.env with your db4free.net credentials:');
  info('DB_USER=your-username');
  info('DB_PASSWORD=your-password');
  process.exit(1);
}

checkCredentials();

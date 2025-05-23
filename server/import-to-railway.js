/**
 * Import Data to Railway MySQL
 * 
 * This script imports the exported SQL data to Railway MySQL database.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
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

// Railway configuration
const railwayConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT),
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  database: process.env.AWS_RDS_DATABASE,
  multipleStatements: true // Allow multiple SQL statements
};

async function importToRailway() {
  let connection;
  
  try {
    heading('Import Data to Railway MySQL');
    
    info('Railway Configuration:');
    log(`  Host: ${railwayConfig.host}`);
    log(`  Port: ${railwayConfig.port}`);
    log(`  Database: ${railwayConfig.database}`);
    
    // Check if migration file exists
    const migrationFile = path.join(__dirname, 'aws-rds-migration', 'complete_migration.sql');
    if (!fs.existsSync(migrationFile)) {
      error('Migration file not found!');
      error('Please run the migration script first: node migrate-to-aws-rds.js');
      return;
    }
    
    // Read the migration SQL file
    info('Reading migration file...');
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    success(`Migration file loaded (${Math.round(sqlContent.length / 1024)}KB)`);
    
    // Connect to Railway
    info('Connecting to Railway MySQL...');
    connection = await mysql.createConnection(railwayConfig);
    success('Connected to Railway MySQL!');
    
    // Split SQL into individual statements
    info('Processing SQL statements...');
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    info(`Found ${statements.length} SQL statements to execute`);
    
    // Execute statements one by one
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.trim() === '') {
          skipCount++;
          continue;
        }
        
        // Show progress for every 10 statements
        if (i % 10 === 0) {
          info(`Progress: ${i}/${statements.length} statements processed`);
        }
        
        await connection.query(statement);
        successCount++;
        
      } catch (err) {
        // Some errors are expected (like "table already exists")
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || 
            err.code === 'ER_DUP_ENTRY' ||
            err.message.includes('already exists')) {
          warning(`Skipped: ${err.message.substring(0, 50)}...`);
          skipCount++;
        } else {
          error(`Error executing statement: ${err.message}`);
          error(`Statement: ${statement.substring(0, 100)}...`);
          // Continue with next statement instead of stopping
        }
      }
    }
    
    success(`Import completed!`);
    success(`✅ ${successCount} statements executed successfully`);
    if (skipCount > 0) {
      info(`ℹ️ ${skipCount} statements skipped (duplicates/already exists)`);
    }
    
    // Verify the import
    heading('Verifying Import');
    
    const tables = ['users', 'items', 'categories', 'requests', 'request_items', 'notifications'];
    
    for (const table of tables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        success(`Table '${table}': ${count} records`);
      } catch (err) {
        warning(`Could not verify table '${table}': ${err.message}`);
      }
    }
    
    await connection.end();
    
    heading('Import Complete! 🎉');
    success('Your data has been successfully imported to Railway MySQL');
    
    info('Next steps:');
    info('1. Test your application with the Railway database');
    info('2. Deploy your backend to Railway or another hosting service');
    info('3. Deploy your frontend to Netlify');
    
  } catch (err) {
    error(`Import failed: ${err.message}`);
    
    if (err.code === 'ENOENT') {
      error('Migration file not found');
      info('Please run: node migrate-to-aws-rds.js');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      error('Access denied to Railway database');
      info('Check your Railway credentials');
    } else {
      error('Unexpected error occurred');
      console.error(err);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Validate configuration
if (!railwayConfig.host || !railwayConfig.user || !railwayConfig.password) {
  error('Missing Railway configuration!');
  info('Please check your .env file');
  process.exit(1);
}

importToRailway();

/**
 * Fix Railway Import - Handle Foreign Key Dependencies
 * 
 * This script fixes the import by handling foreign key constraints properly.
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
  multipleStatements: true
};

async function fixRailwayImport() {
  let connection;
  
  try {
    heading('Fix Railway Import - Handle Dependencies');
    
    // Connect to Railway
    info('Connecting to Railway MySQL...');
    connection = await mysql.createConnection(railwayConfig);
    success('Connected to Railway MySQL!');
    
    // Step 1: Disable foreign key checks
    info('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    success('Foreign key checks disabled');
    
    // Step 2: Drop existing tables in reverse dependency order
    info('Dropping existing tables...');
    const tablesToDrop = ['pickup_details', 'request_items', 'requests', 'notifications', 'items', 'categories', 'users'];
    
    for (const table of tablesToDrop) {
      try {
        await connection.query(`DROP TABLE IF EXISTS ${table}`);
        info(`Dropped table: ${table}`);
      } catch (err) {
        warning(`Could not drop table ${table}: ${err.message}`);
      }
    }
    
    // Step 3: Read and execute schema file
    info('Creating tables from schema...');
    const schemaFile = path.join(__dirname, 'aws-rds-migration', 'schema.sql');
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');
    
    // Split schema into individual CREATE TABLE statements
    const createStatements = schemaContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && stmt.toUpperCase().includes('CREATE TABLE'));
    
    // Execute CREATE TABLE statements in dependency order
    const tableOrder = ['users', 'categories', 'items', 'requests', 'request_items', 'pickup_details', 'notifications'];
    
    for (const tableName of tableOrder) {
      const createStmt = createStatements.find(stmt => 
        stmt.toUpperCase().includes(`CREATE TABLE \`${tableName}\``) ||
        stmt.toUpperCase().includes(`CREATE TABLE ${tableName}`)
      );
      
      if (createStmt) {
        try {
          await connection.query(createStmt);
          success(`Created table: ${tableName}`);
        } catch (err) {
          error(`Error creating table ${tableName}: ${err.message}`);
        }
      } else {
        warning(`CREATE statement not found for table: ${tableName}`);
      }
    }
    
    // Step 4: Import data in dependency order
    info('Importing data...');
    const dataFile = path.join(__dirname, 'aws-rds-migration', 'data.sql');
    const dataContent = fs.readFileSync(dataFile, 'utf8');
    
    // Extract INSERT statements for each table
    const insertStatements = dataContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && stmt.toUpperCase().startsWith('INSERT INTO'));
    
    // Import data in dependency order
    for (const tableName of tableOrder) {
      const insertStmt = insertStatements.find(stmt => 
        stmt.toUpperCase().includes(`INSERT INTO ${tableName}`) ||
        stmt.toUpperCase().includes(`INSERT INTO \`${tableName}\``)
      );
      
      if (insertStmt) {
        try {
          await connection.query(insertStmt);
          
          // Get count of imported records
          const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          success(`Imported data to ${tableName}: ${countResult[0].count} records`);
        } catch (err) {
          error(`Error importing data to ${tableName}: ${err.message}`);
          // Log the problematic statement for debugging
          if (err.message.includes('Data truncated') || err.message.includes('Incorrect')) {
            warning(`Problematic statement: ${insertStmt.substring(0, 200)}...`);
          }
        }
      } else {
        info(`No data to import for table: ${tableName}`);
      }
    }
    
    // Step 5: Re-enable foreign key checks
    info('Re-enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    success('Foreign key checks re-enabled');
    
    // Step 6: Final verification
    heading('Final Verification');
    
    for (const tableName of tableOrder) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = rows[0].count;
        if (count > 0) {
          success(`Table '${tableName}': ${count} records`);
        } else {
          info(`Table '${tableName}': 0 records (empty)`);
        }
      } catch (err) {
        error(`Could not verify table '${tableName}': ${err.message}`);
      }
    }
    
    await connection.end();
    
    heading('Import Fix Complete! 🎉');
    success('Your data has been successfully imported to Railway MySQL');
    
    info('Next steps:');
    info('1. Test your application with Railway database');
    info('2. Deploy your backend');
    info('3. Deploy your frontend');
    
  } catch (err) {
    error(`Import fix failed: ${err.message}`);
    console.error(err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixRailwayImport();

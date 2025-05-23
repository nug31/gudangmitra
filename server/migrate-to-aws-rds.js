/**
 * AWS RDS Migration Script
 * 
 * This script helps migrate your local MySQL database to AWS RDS.
 * It exports data from your local database and provides instructions
 * for importing to AWS RDS.
 * 
 * Usage: node migrate-to-aws-rds.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// Load environment variables
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions
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

// Database configurations
const localDbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gudang1',
  port: 3306,
};

const awsRdsConfig = {
  host: process.env.AWS_RDS_HOST || 'your-rds-endpoint.amazonaws.com',
  user: process.env.AWS_RDS_USER || 'admin',
  password: process.env.AWS_RDS_PASSWORD || 'your-password',
  database: process.env.AWS_RDS_DATABASE || 'gudang1',
  port: parseInt(process.env.AWS_RDS_PORT || '3306', 10),
};

// Output directory
const outputDir = path.join(__dirname, 'aws-rds-migration');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Export local database
async function exportLocalDatabase() {
  let connection;
  
  try {
    heading('Step 1: Exporting Local Database');
    
    log('Connecting to local MySQL database...', colors.cyan);
    connection = await mysql.createConnection(localDbConfig);
    success('Connected to local database!');
    
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    success(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);
    
    // Export schema
    log('Exporting database schema...', colors.cyan);
    let schemaSQL = `-- Database schema export for AWS RDS migration\n`;
    schemaSQL += `-- Generated on ${new Date().toISOString()}\n\n`;
    schemaSQL += `-- Create database if it doesn't exist\n`;
    schemaSQL += `CREATE DATABASE IF NOT EXISTS ${localDbConfig.database};\n`;
    schemaSQL += `USE ${localDbConfig.database};\n\n`;
    
    for (const tableName of tableNames) {
      const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
      schemaSQL += `-- Table: ${tableName}\n`;
      schemaSQL += `DROP TABLE IF EXISTS ${tableName};\n`;
      schemaSQL += `${createTable[0]['Create Table']};\n\n`;
    }
    
    await writeFileAsync(path.join(outputDir, 'schema.sql'), schemaSQL);
    success('Schema exported successfully!');
    
    // Export data
    log('Exporting table data...', colors.cyan);
    let dataSQL = `-- Data export for AWS RDS migration\n`;
    dataSQL += `-- Generated on ${new Date().toISOString()}\n\n`;
    dataSQL += `USE ${localDbConfig.database};\n\n`;
    
    for (const tableName of tableNames) {
      log(`Exporting data from table: ${tableName}...`, colors.cyan);
      
      // Get table data
      const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
      
      if (rows.length === 0) {
        log(`Table ${tableName} is empty, skipping...`, colors.yellow);
        continue;
      }
      
      // Generate INSERT statements
      dataSQL += `-- Data for table ${tableName}\n`;
      dataSQL += `DELETE FROM ${tableName};\n`;
      dataSQL += `INSERT INTO ${tableName} VALUES\n`;
      
      const values = rows.map(row => {
        const rowValues = Object.values(row).map(value => {
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
          return value;
        });
        return `(${rowValues.join(', ')})`;
      });
      
      dataSQL += values.join(',\n') + ';\n\n';
      success(`Exported ${rows.length} rows from ${tableName}`);
    }
    
    await writeFileAsync(path.join(outputDir, 'data.sql'), dataSQL);
    success('Data exported successfully!');
    
    // Create combined file
    const combinedSQL = schemaSQL + '\n' + dataSQL;
    await writeFileAsync(path.join(outputDir, 'complete_migration.sql'), combinedSQL);
    success('Combined migration file created!');
    
  } catch (err) {
    error(`Error exporting local database: ${err.message}`);
    throw err;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Test AWS RDS connection
async function testAwsRdsConnection() {
  let connection;
  
  try {
    heading('Step 2: Testing AWS RDS Connection');
    
    if (awsRdsConfig.host === 'your-rds-endpoint.amazonaws.com') {
      warning('AWS RDS configuration not set up!');
      info('Please update your environment variables or the awsRdsConfig object in this script');
      info('Required variables:');
      info('  - AWS_RDS_HOST: Your RDS endpoint');
      info('  - AWS_RDS_USER: Your RDS username');
      info('  - AWS_RDS_PASSWORD: Your RDS password');
      info('  - AWS_RDS_DATABASE: Your database name (gudang1)');
      info('  - AWS_RDS_PORT: Your RDS port (3306)');
      return false;
    }
    
    log('Testing connection to AWS RDS...', colors.cyan);
    connection = await mysql.createConnection(awsRdsConfig);
    success('Successfully connected to AWS RDS!');
    
    // Test if database exists
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => Object.values(db)[0] === awsRdsConfig.database);
    
    if (dbExists) {
      success(`Database '${awsRdsConfig.database}' exists on AWS RDS`);
    } else {
      warning(`Database '${awsRdsConfig.database}' does not exist on AWS RDS`);
      info('The migration script will create it');
    }
    
    return true;
    
  } catch (err) {
    error(`Error connecting to AWS RDS: ${err.message}`);
    warning('Please check your AWS RDS configuration and security group settings');
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Generate migration instructions
function generateMigrationInstructions() {
  heading('Step 3: Migration Instructions');
  
  const instructionsPath = path.join(outputDir, 'migration-instructions.md');
  const instructions = `# AWS RDS Migration Instructions

## Files Generated

1. **schema.sql** - Database schema (tables, indexes, etc.)
2. **data.sql** - All table data
3. **complete_migration.sql** - Combined schema and data

## Migration Steps

### Option 1: Using MySQL Command Line

1. **Import the complete migration file:**
   \`\`\`bash
   mysql -h ${awsRdsConfig.host} -P ${awsRdsConfig.port} -u ${awsRdsConfig.user} -p < complete_migration.sql
   \`\`\`

2. **Or import schema and data separately:**
   \`\`\`bash
   # Import schema first
   mysql -h ${awsRdsConfig.host} -P ${awsRdsConfig.port} -u ${awsRdsConfig.user} -p < schema.sql
   
   # Then import data
   mysql -h ${awsRdsConfig.host} -P ${awsRdsConfig.port} -u ${awsRdsConfig.user} -p < data.sql
   \`\`\`

### Option 2: Using MySQL Workbench

1. Connect to your AWS RDS instance
2. Open and execute the \`complete_migration.sql\` file

### Option 3: Using phpMyAdmin or similar tools

1. Connect to your AWS RDS instance
2. Import the \`complete_migration.sql\` file

## After Migration

1. **Update your application configuration:**
   \`\`\`env
   DB_HOST=${awsRdsConfig.host}
   DB_USER=${awsRdsConfig.user}
   DB_PASSWORD=${awsRdsConfig.password}
   DB_NAME=${awsRdsConfig.database}
   DB_PORT=${awsRdsConfig.port}
   \`\`\`

2. **Test your application connection**

3. **Update your deployment environment variables**

## Verification

After migration, verify that:
- All tables are created
- All data is imported correctly
- Your application can connect and function properly

## Troubleshooting

- Ensure your AWS RDS security group allows connections from your IP
- Check that the RDS instance is in "Available" state
- Verify your connection credentials
- Check for any SQL syntax errors in the migration files
`;

  fs.writeFileSync(instructionsPath, instructions);
  success('Migration instructions generated!');
  
  info('Migration files created in: ' + outputDir);
  info('Files:');
  info('  - schema.sql: Database structure');
  info('  - data.sql: Table data');
  info('  - complete_migration.sql: Complete migration');
  info('  - migration-instructions.md: Detailed instructions');
}

// Main function
async function main() {
  heading('AWS RDS Migration Tool');
  
  try {
    // Step 1: Export local database
    await exportLocalDatabase();
    
    // Step 2: Test AWS RDS connection (optional)
    const rdsConnected = await testAwsRdsConnection();
    
    // Step 3: Generate instructions
    generateMigrationInstructions();
    
    heading('Migration Preparation Complete!');
    
    if (rdsConnected) {
      success('Your AWS RDS connection is working!');
      info('You can now run the migration commands from the instructions file');
    } else {
      warning('AWS RDS connection could not be established');
      info('Please set up your AWS RDS configuration and try again');
      info('You can still use the exported SQL files for manual migration');
    }
    
  } catch (err) {
    error('Migration preparation failed:');
    console.error(err);
    process.exit(1);
  }
}

// Run the migration
main();

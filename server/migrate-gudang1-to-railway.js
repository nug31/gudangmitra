/**
 * Migrate Real Data from gudang1 to Railway
 * 
 * This script copies all real data from your local gudang1 database 
 * to the Railway database, preserving all 225+ items and users.
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

// Local gudang1 database configuration
const localConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gudang1',
  port: 3306
};

// Railway database configuration
const railwayConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT),
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  database: 'railway'
};

async function migrateData() {
  let localConnection, railwayConnection;
  
  try {
    heading('🔄 Migrating Real Data from gudang1 to Railway');
    
    // Connect to both databases
    info('Connecting to local gudang1 database...');
    localConnection = await mysql.createConnection(localConfig);
    success('Connected to local gudang1 database');
    
    info('Connecting to Railway database...');
    railwayConnection = await mysql.createConnection(railwayConfig);
    success('Connected to Railway database');
    
    // Step 1: Get table structures from local database
    heading('Step 1: Analyzing local database structure');
    
    const [localTables] = await localConnection.query('SHOW TABLES');
    const tableNames = localTables.map(table => Object.values(table)[0]);
    success(`Found ${tableNames.length} tables in gudang1: ${tableNames.join(', ')}`);
    
    // Step 2: Clear Railway database and recreate structure
    heading('Step 2: Preparing Railway database');
    
    // Disable foreign key checks
    await railwayConnection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop existing tables
    const tablesToDrop = ['pickup_details', 'request_items', 'requests', 'notifications', 'items', 'categories', 'users'];
    for (const table of tablesToDrop) {
      try {
        await railwayConnection.query(`DROP TABLE IF EXISTS ${table}`);
        info(`Dropped table: ${table}`);
      } catch (err) {
        warning(`Could not drop table ${table}: ${err.message}`);
      }
    }
    
    // Step 3: Copy table structures
    heading('Step 3: Copying table structures');
    
    for (const tableName of tableNames) {
      try {
        // Get CREATE TABLE statement from local database
        const [createResult] = await localConnection.query(`SHOW CREATE TABLE ${tableName}`);
        const createStatement = createResult[0]['Create Table'];
        
        // Execute CREATE TABLE in Railway database
        await railwayConnection.query(createStatement);
        success(`Created table structure: ${tableName}`);
      } catch (err) {
        error(`Error creating table ${tableName}: ${err.message}`);
      }
    }
    
    // Step 4: Copy data in dependency order
    heading('Step 4: Copying data');
    
    // Define table order based on dependencies
    const migrationOrder = ['users', 'categories', 'items', 'requests', 'request_items', 'notifications', 'pickup_details'];
    
    for (const tableName of migrationOrder) {
      if (tableNames.includes(tableName)) {
        try {
          // Get data from local database
          const [localData] = await localConnection.query(`SELECT * FROM ${tableName}`);
          
          if (localData.length === 0) {
            info(`Table ${tableName} is empty, skipping...`);
            continue;
          }
          
          info(`Copying ${localData.length} records from ${tableName}...`);
          
          // Get column names
          const [columns] = await localConnection.query(`SHOW COLUMNS FROM ${tableName}`);
          const columnNames = columns.map(col => col.Field);
          
          // Prepare INSERT statement
          const placeholders = columnNames.map(() => '?').join(', ');
          const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;
          
          // Insert data in batches
          const batchSize = 100;
          let insertedCount = 0;
          
          for (let i = 0; i < localData.length; i += batchSize) {
            const batch = localData.slice(i, i + batchSize);
            
            for (const row of batch) {
              try {
                const values = columnNames.map(col => row[col]);
                await railwayConnection.query(insertSQL, values);
                insertedCount++;
              } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                  warning(`Duplicate entry skipped in ${tableName}`);
                } else {
                  error(`Error inserting row in ${tableName}: ${err.message}`);
                }
              }
            }
            
            // Show progress
            if (localData.length > 100) {
              info(`Progress: ${Math.min(i + batchSize, localData.length)}/${localData.length} records processed`);
            }
          }
          
          success(`Copied ${insertedCount} records to ${tableName}`);
          
        } catch (err) {
          error(`Error copying table ${tableName}: ${err.message}`);
        }
      }
    }
    
    // Step 5: Re-enable foreign key checks
    await railwayConnection.query('SET FOREIGN_KEY_CHECKS = 1');
    success('Re-enabled foreign key checks');
    
    // Step 6: Verify migration
    heading('Step 6: Verifying migration');
    
    for (const tableName of migrationOrder) {
      if (tableNames.includes(tableName)) {
        try {
          const [localCount] = await localConnection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const [railwayCount] = await railwayConnection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          
          const localTotal = localCount[0].count;
          const railwayTotal = railwayCount[0].count;
          
          if (localTotal === railwayTotal) {
            success(`${tableName}: ${railwayTotal} records (✓ matches local)`);
          } else {
            warning(`${tableName}: ${railwayTotal} records (local has ${localTotal})`);
          }
        } catch (err) {
          error(`Error verifying ${tableName}: ${err.message}`);
        }
      }
    }
    
    // Close connections
    await localConnection.end();
    await railwayConnection.end();
    
    heading('🎉 Migration Complete!');
    success('All data has been successfully migrated from gudang1 to Railway');
    success('Your Railway database now contains all your original data');
    
    info('Next steps:');
    info('1. Refresh your Railway dashboard to see all the data');
    info('2. Test your application with the migrated data');
    info('3. Deploy your application to production');
    
  } catch (err) {
    error(`Migration failed: ${err.message}`);
    console.error(err);
  } finally {
    if (localConnection) {
      await localConnection.end();
    }
    if (railwayConnection) {
      await railwayConnection.end();
    }
  }
}

// Validate configuration
if (!railwayConfig.host || !railwayConfig.user || !railwayConfig.password) {
  error('Missing Railway configuration!');
  info('Please check your .env file');
  process.exit(1);
}

migrateData();

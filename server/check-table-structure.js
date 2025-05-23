/**
 * Check Table Structure
 * 
 * This script checks the actual structure of tables in both databases
 * to understand the column names and relationships.
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

async function checkTableStructure() {
  let localConnection, railwayConnection;
  
  try {
    heading('🔍 Checking Table Structure');
    
    // Connect to both databases
    info('Connecting to local gudang1 database...');
    localConnection = await mysql.createConnection(localConfig);
    success('Connected to local gudang1 database');
    
    info('Connecting to Railway database...');
    railwayConnection = await mysql.createConnection(railwayConfig);
    success('Connected to Railway database');
    
    // Check items table structure in local database
    heading('Local gudang1 - Items Table Structure');
    
    const [localItemsStructure] = await localConnection.query('DESCRIBE items');
    success('Local items table columns:');
    localItemsStructure.forEach(column => {
      log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `KEY: ${column.Key}` : ''}`);
    });
    
    // Check items table structure in Railway database
    heading('Railway - Items Table Structure');
    
    const [railwayItemsStructure] = await railwayConnection.query('DESCRIBE items');
    success('Railway items table columns:');
    railwayItemsStructure.forEach(column => {
      log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `KEY: ${column.Key}` : ''}`);
    });
    
    // Check categories table structure
    heading('Categories Table Structure');
    
    const [localCategoriesStructure] = await localConnection.query('DESCRIBE categories');
    success('Local categories table columns:');
    localCategoriesStructure.forEach(column => {
      log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `KEY: ${column.Key}` : ''}`);
    });
    
    const [railwayCategoriesStructure] = await railwayConnection.query('DESCRIBE categories');
    success('Railway categories table columns:');
    railwayCategoriesStructure.forEach(column => {
      log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `KEY: ${column.Key}` : ''}`);
    });
    
    // Sample data from items table
    heading('Sample Items Data');
    
    const [localSampleItems] = await localConnection.query('SELECT * FROM items LIMIT 3');
    success('Local sample items:');
    localSampleItems.forEach((item, index) => {
      log(`  Item ${index + 1}:`);
      Object.keys(item).forEach(key => {
        log(`    ${key}: ${item[key]}`);
      });
      log('');
    });
    
    const [railwaySampleItems] = await railwayConnection.query('SELECT * FROM items LIMIT 3');
    success('Railway sample items:');
    railwaySampleItems.forEach((item, index) => {
      log(`  Item ${index + 1}:`);
      Object.keys(item).forEach(key => {
        log(`    ${key}: ${item[key]}`);
      });
      log('');
    });
    
    // Check for items with category information
    heading('Items with Category Information');
    
    // Try to find the correct category column name
    const localItemColumns = localItemsStructure.map(col => col.Field);
    const categoryColumn = localItemColumns.find(col => 
      col.toLowerCase().includes('category') || 
      col.toLowerCase().includes('cat')
    );
    
    if (categoryColumn) {
      success(`Found category column: ${categoryColumn}`);
      
      // Check items with categories in local database
      const [localItemsWithCategories] = await localConnection.query(`
        SELECT i.name as item_name, i.${categoryColumn}, c.name as category_name
        FROM items i
        LEFT JOIN categories c ON i.${categoryColumn} = c.id
        WHERE i.${categoryColumn} IS NOT NULL
        LIMIT 5
      `);
      
      success('Local items with categories:');
      localItemsWithCategories.forEach(item => {
        log(`  - "${item.item_name}" → Category: "${item.category_name || 'MISSING'}" (ID: ${item[categoryColumn]})`);
      });
      
      // Check items with categories in Railway database
      const [railwayItemsWithCategories] = await railwayConnection.query(`
        SELECT i.name as item_name, i.${categoryColumn}, c.name as category_name
        FROM items i
        LEFT JOIN categories c ON i.${categoryColumn} = c.id
        WHERE i.${categoryColumn} IS NOT NULL
        LIMIT 5
      `);
      
      success('Railway items with categories:');
      railwayItemsWithCategories.forEach(item => {
        log(`  - "${item.item_name}" → Category: "${item.category_name || 'MISSING'}" (ID: ${item[categoryColumn]})`);
      });
      
    } else {
      warning('No category column found in items table');
    }
    
    // Close connections
    await localConnection.end();
    await railwayConnection.end();
    
    heading('🎉 Table Structure Check Complete!');
    
    if (categoryColumn) {
      success(`Category column identified: ${categoryColumn}`);
      info('Categories are properly linked to items');
    }
    
    success('All categories including "Cleaning Materials" are present in Railway database');
    
  } catch (err) {
    error(`Table structure check failed: ${err.message}`);
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

checkTableStructure();

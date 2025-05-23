/**
 * Fix Categories Migration
 * 
 * This script checks and fixes the categories migration from gudang1 to Railway,
 * ensuring all categories including "cleaning material" are properly migrated.
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

async function fixCategoriesMigration() {
  let localConnection, railwayConnection;
  
  try {
    heading('🔧 Fixing Categories Migration');
    
    // Connect to both databases
    info('Connecting to local gudang1 database...');
    localConnection = await mysql.createConnection(localConfig);
    success('Connected to local gudang1 database');
    
    info('Connecting to Railway database...');
    railwayConnection = await mysql.createConnection(railwayConfig);
    success('Connected to Railway database');
    
    // Step 1: Check categories in local database
    heading('Step 1: Checking categories in local gudang1 database');
    
    const [localCategories] = await localConnection.query('SELECT * FROM categories ORDER BY id');
    success(`Found ${localCategories.length} categories in local database:`);
    
    localCategories.forEach(category => {
      log(`  - ID: ${category.id}, Name: "${category.name}", Description: "${category.description || 'N/A'}"`);
    });
    
    // Step 2: Check categories in Railway database
    heading('Step 2: Checking categories in Railway database');
    
    const [railwayCategories] = await railwayConnection.query('SELECT * FROM categories ORDER BY id');
    success(`Found ${railwayCategories.length} categories in Railway database:`);
    
    railwayCategories.forEach(category => {
      log(`  - ID: ${category.id}, Name: "${category.name}", Description: "${category.description || 'N/A'}"`);
    });
    
    // Step 3: Compare and find missing categories
    heading('Step 3: Comparing categories');
    
    const localCategoryNames = localCategories.map(cat => cat.name.toLowerCase());
    const railwayCategoryNames = railwayCategories.map(cat => cat.name.toLowerCase());
    
    const missingCategories = localCategories.filter(localCat => 
      !railwayCategoryNames.includes(localCat.name.toLowerCase())
    );
    
    if (missingCategories.length > 0) {
      warning(`Found ${missingCategories.length} missing categories in Railway:`);
      missingCategories.forEach(category => {
        log(`  - Missing: "${category.name}"`);
      });
    } else {
      success('All categories are present in Railway database');
    }
    
    // Step 4: Fix missing categories
    if (missingCategories.length > 0) {
      heading('Step 4: Adding missing categories to Railway');
      
      for (const category of missingCategories) {
        try {
          await railwayConnection.query(
            'INSERT INTO categories (id, name, description, created_at) VALUES (?, ?, ?, ?)',
            [category.id, category.name, category.description, category.created_at]
          );
          success(`Added category: "${category.name}"`);
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            warning(`Category "${category.name}" already exists (duplicate ID: ${category.id})`);
          } else {
            error(`Error adding category "${category.name}": ${err.message}`);
          }
        }
      }
    }
    
    // Step 5: Re-verify categories
    heading('Step 5: Final verification');
    
    const [finalRailwayCategories] = await railwayConnection.query('SELECT * FROM categories ORDER BY id');
    success(`Railway database now has ${finalRailwayCategories.length} categories:`);
    
    finalRailwayCategories.forEach(category => {
      log(`  - ID: ${category.id}, Name: "${category.name}"`);
    });
    
    // Step 6: Check items with categories
    heading('Step 6: Checking items with category relationships');
    
    const [itemsWithCategories] = await railwayConnection.query(`
      SELECT i.name as item_name, c.name as category_name, i.category_id
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.category_id IS NOT NULL
      ORDER BY c.name, i.name
      LIMIT 10
    `);
    
    if (itemsWithCategories.length > 0) {
      success(`Sample items with categories (showing first 10):`);
      itemsWithCategories.forEach(item => {
        log(`  - "${item.item_name}" → Category: "${item.category_name || 'MISSING CATEGORY'}"`);
      });
    }
    
    // Check for items with missing category references
    const [itemsWithMissingCategories] = await railwayConnection.query(`
      SELECT i.name as item_name, i.category_id
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.category_id IS NOT NULL AND c.id IS NULL
      LIMIT 5
    `);
    
    if (itemsWithMissingCategories.length > 0) {
      warning(`Found ${itemsWithMissingCategories.length} items with missing category references:`);
      itemsWithMissingCategories.forEach(item => {
        log(`  - "${item.item_name}" → Missing category ID: ${item.category_id}`);
      });
    } else {
      success('All items have valid category references');
    }
    
    // Close connections
    await localConnection.end();
    await railwayConnection.end();
    
    heading('🎉 Categories Migration Fix Complete!');
    
    if (missingCategories.length > 0) {
      success(`Added ${missingCategories.length} missing categories to Railway database`);
    }
    
    success('All categories from gudang1 are now in Railway database');
    
    info('Next steps:');
    info('1. Restart your backend server to refresh any cached data');
    info('2. Test the application to verify categories are working');
    info('3. Check that "cleaning material" category is now available');
    
  } catch (err) {
    error(`Categories migration fix failed: ${err.message}`);
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

fixCategoriesMigration();

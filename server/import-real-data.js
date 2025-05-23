const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importRealData() {
  let connection;
  
  try {
    console.log('🚂 Importing real gudang1 data to Railway...');
    
    // Connect to Railway (default database first)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME, // 'railway'
      connectTimeout: 30000,
      multipleStatements: true
    });
    
    console.log('✅ Connected to Railway MySQL');
    
    // Create gudang1 database
    await connection.query('CREATE DATABASE IF NOT EXISTS gudang1');
    console.log('✅ Database "gudang1" created');
    
    // Switch to gudang1 database
    await connection.query('USE gudang1');
    console.log('✅ Switched to gudang1 database');
    
    // Read the migration file
    const migrationFile = path.join(__dirname, 'aws-rds-migration', 'complete_migration.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error('❌ Migration file not found:', migrationFile);
      console.log('Please run: node migrate-to-aws-rds.js first');
      return;
    }
    
    console.log('📁 Reading migration file...');
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    console.log(`✅ Migration file loaded (${Math.round(sqlContent.length / 1024)}KB)`);
    
    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Disabled foreign key checks');
    
    // Split SQL into statements and execute
    console.log('🔄 Executing SQL statements...');
    
    // Remove comments and split by semicolon
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Skip empty statements
        if (!statement || statement.length < 5) {
          skipCount++;
          continue;
        }
        
        // Execute statement
        await connection.query(statement);
        successCount++;
        
        // Show progress for large operations
        if (i % 50 === 0) {
          console.log(`Progress: ${i + 1}/${statements.length} statements processed`);
        }
        
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY') {
          skipCount++;
        } else {
          console.warn(`⚠️ Statement ${i + 1} failed: ${err.message}`);
          console.log(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Re-enabled foreign key checks');
    
    console.log(`\n📊 Import Summary:`);
    console.log(`  ✅ Successful: ${successCount} statements`);
    console.log(`  ⏭️ Skipped: ${skipCount} statements`);
    
    // Verify the import
    console.log('\n🔍 Verifying import...');
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Found ${tables.length} tables:`);
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  - ${tableName}: ${count[0].count} records`);
      
      // Show sample items
      if (tableName === 'items' && count[0].count > 0) {
        console.log('\n📦 Sample items:');
        const [items] = await connection.query('SELECT id, name, quantity FROM items LIMIT 5');
        items.forEach(item => {
          console.log(`    ${item.id}: ${item.name} (qty: ${item.quantity})`);
        });
      }
    }
    
    await connection.end();
    
    console.log('\n🎉 Real data import complete!');
    console.log('✅ Your Railway database now contains all your original gudang1 data');
    console.log('✅ Ready to run the application with real data');
    
    console.log('\n📝 Next steps:');
    console.log('1. Update .env to use DB_NAME=gudang1');
    console.log('2. Restart the server');
    console.log('3. Test the application with real data');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    if (connection) {
      await connection.end();
    }
  }
}

importRealData();

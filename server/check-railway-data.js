const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRailwayData() {
  let connection;
  
  try {
    console.log('🔍 Checking Railway database content...');
    
    // Connect to Railway
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME, // Currently 'railway'
      connectTimeout: 30000
    });
    
    console.log('✅ Connected to Railway MySQL');
    
    // Check current database
    const [currentDb] = await connection.query('SELECT DATABASE() as current_db');
    console.log('Current database:', currentDb[0].current_db);
    
    // List all databases
    console.log('\n📊 Available databases:');
    const [databases] = await connection.query('SHOW DATABASES');
    databases.forEach(db => {
      const dbName = Object.values(db)[0];
      console.log(`  - ${dbName}`);
    });
    
    // Check tables in current database
    console.log(`\n📋 Tables in '${process.env.DB_NAME}' database:`);
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('  No tables found');
    } else {
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  - ${tableName}: ${count[0].count} records`);
      }
    }
    
    // Check if gudang1 database exists
    console.log('\n🔍 Checking for gudang1 database...');
    try {
      await connection.query('USE gudang1');
      console.log('✅ gudang1 database exists! Checking its content...');
      
      const [gudangTables] = await connection.query('SHOW TABLES');
      if (gudangTables.length === 0) {
        console.log('  gudang1 database is empty');
      } else {
        console.log('\n📋 Tables in gudang1 database:');
        for (const table of gudangTables) {
          const tableName = Object.values(table)[0];
          const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  - ${tableName}: ${count[0].count} records`);
          
          // Show sample data from items table
          if (tableName === 'items' && count[0].count > 0) {
            console.log('\n📦 Sample items from gudang1:');
            const [items] = await connection.query('SELECT id, name, quantity FROM items LIMIT 5');
            items.forEach(item => {
              console.log(`    ${item.id}: ${item.name} (qty: ${item.quantity})`);
            });
          }
        }
      }
    } catch (err) {
      console.log('❌ gudang1 database does not exist');
      console.log('Need to create it and migrate data');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      await connection.end();
    }
  }
}

checkRailwayData();

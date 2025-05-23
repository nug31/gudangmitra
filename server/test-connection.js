const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Testing Railway connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 30000
    });
    
    console.log('✅ Connected to Railway MySQL!');
    
    // Test query
    const [result] = await connection.query('SELECT 1 as test');
    console.log('✅ Query test passed');
    
    // Check if we're in the right database
    const [dbResult] = await connection.query('SELECT DATABASE() as current_db');
    console.log('Current database:', dbResult[0].current_db);
    
    // List tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Found ${tables.length} tables:`, tables.map(t => Object.values(t)[0]));
    
    await connection.end();
    console.log('✅ Connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('🔧 Database "gudang1" does not exist. Creating it...');
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          // Don't specify database to connect to server
          connectTimeout: 30000
        });
        
        await connection.query('CREATE DATABASE IF NOT EXISTS gudang1');
        console.log('✅ Database "gudang1" created successfully!');
        
        await connection.end();
        console.log('🎯 Now you can run the migration to import your data.');
        
      } catch (createError) {
        console.error('❌ Failed to create database:', createError.message);
      }
    }
  }
}

testConnection();

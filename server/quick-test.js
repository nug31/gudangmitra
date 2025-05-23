/**
 * Quick Railway Connection Test
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function quickTest() {
  console.log('🚂 Quick Railway Connection Test');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  
  try {
    console.log('\n⏳ Connecting...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    });
    
    console.log('✅ Connected successfully!');
    
    const [result] = await connection.query('SELECT 1 as test');
    console.log('✅ Query test passed');
    
    // Create gudang1 database
    await connection.query('CREATE DATABASE IF NOT EXISTS gudang1');
    console.log('✅ Database "gudang1" created/verified');
    
    await connection.end();
    console.log('✅ Connection closed');
    
    console.log('\n🎉 Railway connection is working!');
    console.log('Next: Update DB_NAME to "gudang1" and run migration');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Code:', error.code);
  }
}

quickTest();

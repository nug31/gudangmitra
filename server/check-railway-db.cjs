const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRailwayDatabase() {
  let connection;
  
  try {
    console.log('🚂 Checking Railway database...\n');
    
    const dbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 30000
    };
    
    console.log('Database configuration:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}\n`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Railway database!\n');
    
    // Check tables
    console.log('📋 Tables in railway database:');
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('   (No tables found)');
    } else {
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    }
    
    // Check if users table exists
    const usersTableExists = tables.some(table => Object.values(table)[0] === 'users');
    if (usersTableExists) {
      console.log('\n👥 Users table found! Checking structure...');
      
      // Check table structure
      const [columns] = await connection.query('DESCRIBE users');
      console.log('\n📋 Users table columns:');
      columns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.Field} (${col.Type})`);
      });
      
      // Get all users
      console.log('\n👤 All users in railway database:');
      const [users] = await connection.query('SELECT * FROM users');
      
      if (users.length === 0) {
        console.log('   (No users found)');
      } else {
        console.log(`   Found ${users.length} users:\n`);
        users.forEach((user, index) => {
          console.log(`   User ${index + 1}:`);
          Object.keys(user).forEach(key => {
            if (key === 'password') {
              // Show only first and last few characters of password
              const pwd = user[key];
              if (pwd && pwd.length > 10) {
                console.log(`      ${key}: "${pwd.substring(0, 6)}...${pwd.substring(pwd.length - 4)}"`);
              } else {
                console.log(`      ${key}: "${pwd}"`);
              }
            } else {
              console.log(`      ${key}: "${user[key]}"`);
            }
          });
          console.log('');
        });
        
        // Test login credentials
        console.log('🧪 Testing login credentials:');
        const testCredentials = [
          'password123',
          'password',
          'admin123'
        ];
        
        for (const user of users) {
          const email = user.email || user.username;
          if (email) {
            console.log(`\n   Testing ${email}:`);
            
            for (const testPassword of testCredentials) {
              let shouldWork = false;
              
              if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
                // Hashed password - backend accepts demo passwords
                shouldWork = true;
                console.log(`      "${testPassword}" → ✅ Should work (hashed + demo logic)`);
              } else {
                // Plain text password
                shouldWork = user.password === testPassword;
                if (shouldWork) {
                  console.log(`      "${testPassword}" → ✅ Exact match`);
                } else {
                  console.log(`      "${testPassword}" → ❌ No match`);
                }
              }
            }
          }
        }
      }
    } else {
      console.log('\n❌ No users table found in railway database!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 The "railway" database does not exist.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused - check Railway database settings.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRailwayDatabase().catch(console.error);

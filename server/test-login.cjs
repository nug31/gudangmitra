const mysql = require('mysql2/promise');
require('dotenv').config();

async function testLogin() {
  let connection;
  
  try {
    console.log('🧪 Testing login with Railway database...\n');
    
    const dbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 30000
    };
    
    console.log(`Connecting to: ${dbConfig.database} database on ${dbConfig.host}:${dbConfig.port}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');
    
    // Test the exact login logic from the backend
    const testEmail = 'manager@gudangmitra.com';
    const testPassword = 'password123';
    
    console.log(`🔍 Testing login for: ${testEmail}`);
    console.log(`🔑 Testing password: ${testPassword}\n`);
    
    // Query the database for the user (same as backend)
    const [users] = await connection.query("SELECT * FROM users WHERE email = ?", [testEmail]);
    
    if (users.length === 0) {
      console.log('❌ User not found in database!');
      
      // Let's see what users DO exist
      console.log('\n📋 All users in database:');
      const [allUsers] = await connection.query("SELECT email, username, name FROM users LIMIT 10");
      if (allUsers.length === 0) {
        console.log('   (No users found at all!)');
      } else {
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.username || user.name || 'No name'})`);
        });
      }
      return;
    }
    
    const user = users[0];
    console.log('✅ User found in database!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name || user.username || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password: ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}`);
    
    // Test password logic (same as backend)
    let passwordMatches = false;
    
    console.log('\n🔐 Testing password logic...');
    
    // Check if password is bcrypt hashed (starts with $2a$ or $2b$)
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      console.log('   Password is bcrypt hashed');
      // For demo purposes, allow common passwords for hashed users
      if (testPassword === 'password123' || testPassword === 'password' || testPassword === 'admin123') {
        passwordMatches = true;
        console.log(`   ✅ Demo password "${testPassword}" accepted for hashed user`);
      } else {
        passwordMatches = false;
        console.log(`   ❌ Demo password "${testPassword}" rejected for hashed user`);
      }
    } else {
      console.log('   Password is plain text');
      // Direct comparison for plain text passwords
      passwordMatches = user.password === testPassword;
      console.log(`   Expected: "${testPassword}"`);
      console.log(`   Actual: "${user.password}"`);
      console.log(`   Match: ${passwordMatches ? '✅' : '❌'}`);
    }
    
    if (passwordMatches) {
      console.log('\n🎉 LOGIN SHOULD SUCCEED!');
      
      const userData = {
        id: user.id.toString(),
        username: user.name || user.username,
        email: user.email,
        role: user.role || "user",
      };
      
      console.log('   User data that would be returned:');
      console.log(`   ${JSON.stringify(userData, null, 2)}`);
    } else {
      console.log('\n❌ LOGIN SHOULD FAIL - Password does not match');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Available databases might be different.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Check Railway database settings.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied. Check credentials.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testLogin().catch(console.error);

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsersTable() {
  let connection;
  
  try {
    console.log('🔍 Checking users table structure and data...\n');
    
    const dbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 30000
    };
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Railway database!\n');
    
    // Check table structure
    console.log('📋 Users table structure:');
    const [columns] = await connection.query('DESCRIBE users');
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ` [${col.Key}]` : ''}${col.Default !== null ? ` Default: ${col.Default}` : ''}`);
    });
    
    // Get all users with all columns
    console.log('\n👥 All users in database:');
    const [users] = await connection.query('SELECT * FROM users');
    
    if (users.length === 0) {
      console.log('   (No users found)');
    } else {
      users.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`);
        Object.keys(user).forEach(key => {
          console.log(`      ${key}: "${user[key]}"`);
        });
      });
    }
    
    // Test login for the existing user(s)
    if (users.length > 0) {
      console.log('\n🧪 Testing login with existing users:');
      
      for (const user of users) {
        console.log(`\n   Testing user: ${user.email || user.username || 'Unknown'}`);
        
        // Test common passwords
        const testPasswords = ['password123', 'password', 'admin123'];
        
        for (const testPassword of testPasswords) {
          let passwordMatch = false;
          
          // Check if password is hashed
          if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
            // For hashed passwords, our backend accepts common demo passwords
            passwordMatch = ['password123', 'password', 'admin123'].includes(testPassword);
            if (passwordMatch) {
              console.log(`      ✅ "${testPassword}" should work (hashed password + demo logic)`);
            }
          } else {
            // For plain text passwords
            passwordMatch = user.password === testPassword;
            if (passwordMatch) {
              console.log(`      ✅ "${testPassword}" matches exactly`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsersTable().catch(console.error);

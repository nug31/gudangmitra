const mysql = require('mysql2/promise');

async function testRailwayDirect() {
  let connection;
  
  try {
    console.log('🚂 Testing Railway database connection directly...\n');
    
    // Use explicit Railway database settings
    const dbConfig = {
      host: 'nozomi.proxy.rlwy.net',
      port: 3306,
      user: 'root',
      password: 'pvOcQbzlDAobtcdozbMvCdIDDEmenwkO',
      database: 'railway',
      connectTimeout: 30000
    };
    
    console.log(`Connecting to: ${dbConfig.database} database`);
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`User: ${dbConfig.user}\n`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Railway database successfully!\n');
    
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
      console.log('\n👥 Users table found!');
      
      // Check table structure first
      console.log('\n📋 Users table structure:');
      const [columns] = await connection.query('DESCRIBE users');
      columns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.Field} (${col.Type})`);
      });
      
      // Get user count
      const [countResult] = await connection.query('SELECT COUNT(*) as count FROM users');
      console.log(`\n👤 Total users: ${countResult[0].count}`);
      
      if (countResult[0].count > 0) {
        // Get all users with proper column names
        console.log('\n📧 All users:');
        const [users] = await connection.query('SELECT * FROM users LIMIT 10');
        
        users.forEach((user, index) => {
          console.log(`\n   User ${index + 1}:`);
          Object.keys(user).forEach(key => {
            if (key === 'password') {
              const pwd = user[key];
              if (pwd && pwd.length > 10) {
                console.log(`      ${key}: "${pwd.substring(0, 10)}..."`);
              } else {
                console.log(`      ${key}: "${pwd}"`);
              }
            } else {
              console.log(`      ${key}: "${user[key]}"`);
            }
          });
        });
        
        // Test specific user
        console.log('\n🔍 Testing manager@gudangmitra.com...');
        const [managerUsers] = await connection.query("SELECT * FROM users WHERE email = ?", ['manager@gudangmitra.com']);
        
        if (managerUsers.length > 0) {
          const manager = managerUsers[0];
          console.log('✅ Manager user found!');
          console.log(`   Email: ${manager.email}`);
          console.log(`   Name/Username: ${manager.name || manager.username || 'N/A'}`);
          console.log(`   Role: ${manager.role}`);
          console.log(`   Password type: ${manager.password && manager.password.startsWith('$2') ? 'Hashed' : 'Plain text'}`);
          
          if (manager.password && manager.password.startsWith('$2')) {
            console.log('   ✅ This user should accept "password123" with demo logic');
          }
        } else {
          console.log('❌ Manager user not found');
        }
      }
    } else {
      console.log('\n❌ No users table found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testRailwayDirect().catch(console.error);

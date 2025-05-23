const mysql = require('mysql2/promise');

async function testRailwayCorrect() {
  let connection;
  
  try {
    console.log('🚂 Testing Railway database with correct port...\n');
    
    // Use correct Railway database settings
    const dbConfig = {
      host: 'nozomi.proxy.rlwy.net',
      port: 21817,
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
        // Get sample users
        console.log('\n📧 Sample users (first 5):');
        const [users] = await connection.query('SELECT id, email, username, name, role FROM users LIMIT 5');
        
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.username || user.name || 'No name'}) - ${user.role || 'user'}`);
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
          console.log(`   Password: ${manager.password ? manager.password.substring(0, 15) + '...' : 'N/A'}`);
          
          if (manager.password && (manager.password.startsWith('$2a$') || manager.password.startsWith('$2b$'))) {
            console.log('   ✅ Hashed password - should accept "password123" with demo logic');
          } else {
            console.log('   ℹ️ Plain text password');
          }
        } else {
          console.log('❌ Manager user not found');
          
          // Show users with similar emails
          console.log('\n🔍 Looking for similar emails...');
          const [similarUsers] = await connection.query("SELECT email FROM users WHERE email LIKE '%manager%' OR email LIKE '%gudang%'");
          if (similarUsers.length > 0) {
            console.log('   Found similar emails:');
            similarUsers.forEach(user => console.log(`   - ${user.email}`));
          } else {
            console.log('   No similar emails found');
          }
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

testRailwayCorrect().catch(console.error);

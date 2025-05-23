const mysql = require('mysql2/promise');

async function checkRailwayUsers() {
  let connection;
  
  try {
    console.log('🚂 Checking Railway database users...\n');
    
    const dbConfig = {
      host: 'nozomi.proxy.rlwy.net',
      port: 21817,
      user: 'root',
      password: 'pvOcQbzlDAobtcdozbMvCdIDDEmenwkO',
      database: 'railway',
      connectTimeout: 30000
    };
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Railway database!\n');
    
    // Get all users with correct column names
    console.log('📧 All users in Railway database:');
    const [users] = await connection.query('SELECT id, name, email, role FROM users ORDER BY email');
    
    console.log(`Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
    
    // Test specific user
    console.log('🔍 Testing manager@gudangmitra.com...');
    const [managerUsers] = await connection.query("SELECT * FROM users WHERE email = ?", ['manager@gudangmitra.com']);
    
    if (managerUsers.length > 0) {
      const manager = managerUsers[0];
      console.log('✅ Manager user found!');
      console.log(`   Email: ${manager.email}`);
      console.log(`   Name: ${manager.name}`);
      console.log(`   Role: ${manager.role}`);
      console.log(`   Department: ${manager.department || 'N/A'}`);
      console.log(`   Password: ${manager.password ? manager.password.substring(0, 15) + '...' : 'N/A'}`);
      
      // Test password logic
      const testPassword = 'password123';
      let shouldWork = false;
      
      if (manager.password && (manager.password.startsWith('$2a$') || manager.password.startsWith('$2b$'))) {
        shouldWork = true;
        console.log(`   ✅ Hashed password detected - "${testPassword}" should work with demo logic`);
      } else {
        shouldWork = manager.password === testPassword;
        console.log(`   Password type: Plain text`);
        console.log(`   Expected: "${testPassword}"`);
        console.log(`   Actual: "${manager.password}"`);
        console.log(`   Match: ${shouldWork ? '✅' : '❌'}`);
      }
      
      console.log(`\n🎯 LOGIN SHOULD ${shouldWork ? 'SUCCEED' : 'FAIL'} for manager@gudangmitra.com with password123`);
      
    } else {
      console.log('❌ Manager user not found');
      
      // Look for similar emails
      console.log('\n🔍 Looking for emails containing "manager" or "gudang"...');
      const [similarUsers] = await connection.query("SELECT email, name FROM users WHERE email LIKE '%manager%' OR email LIKE '%gudang%'");
      if (similarUsers.length > 0) {
        console.log('Found similar emails:');
        similarUsers.forEach(user => console.log(`   - ${user.email} (${user.name})`));
      } else {
        console.log('No similar emails found');
      }
    }
    
    // Test a few other common emails
    console.log('\n🧪 Testing other common login emails...');
    const testEmails = [
      'admin@gudangmitra.com',
      'admin@example.com',
      'user@example.com',
      'bob@example.com'
    ];
    
    for (const email of testEmails) {
      const [testUsers] = await connection.query("SELECT email, name, role, password FROM users WHERE email = ?", [email]);
      if (testUsers.length > 0) {
        const user = testUsers[0];
        const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
        console.log(`   ✅ ${email} exists (${user.name}) - ${isHashed ? 'Hashed password' : 'Plain text'}`);
      } else {
        console.log(`   ❌ ${email} not found`);
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

checkRailwayUsers().catch(console.error);

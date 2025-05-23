const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabases() {
  let connection;
  
  try {
    console.log('🔍 Checking available databases on Railway...\n');
    
    // Connect without specifying a database
    const dbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectTimeout: 30000
    };
    
    console.log('Database connection config:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Password: ***${dbConfig.password ? dbConfig.password.slice(-4) : 'not set'}\n`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Railway MySQL server!\n');
    
    // List all databases
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('📋 Available databases:');
    databases.forEach((db, index) => {
      const dbName = Object.values(db)[0];
      console.log(`   ${index + 1}. ${dbName}`);
    });
    
    console.log('\n🎯 Current .env DB_NAME setting:', process.env.DB_NAME);
    
    // Check if the configured database exists
    const dbExists = databases.some(db => Object.values(db)[0] === process.env.DB_NAME);
    if (dbExists) {
      console.log(`✅ Database "${process.env.DB_NAME}" exists on Railway!`);
      
      // Now connect to the specific database and check tables
      await connection.end();
      
      const specificDbConfig = {
        ...dbConfig,
        database: process.env.DB_NAME
      };
      
      connection = await mysql.createConnection(specificDbConfig);
      console.log(`✅ Connected to database "${process.env.DB_NAME}"!\n`);
      
      // Check tables
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`📋 Tables in "${process.env.DB_NAME}" database:`);
      if (tables.length === 0) {
        console.log('   (No tables found)');
      } else {
        tables.forEach((table, index) => {
          const tableName = Object.values(table)[0];
          console.log(`   ${index + 1}. ${tableName}`);
        });
      }
      
      // If users table exists, check user count
      const usersTableExists = tables.some(table => Object.values(table)[0] === 'users');
      if (usersTableExists) {
        console.log('\n👥 Checking users table...');
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`   Users in database: ${userCount[0].count}`);
        
        if (userCount[0].count > 0) {
          console.log('\n📧 Sample users (first 5):');
          const [sampleUsers] = await connection.query('SELECT email, name, role FROM users LIMIT 5');
          sampleUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - ${user.role || 'user'}`);
          });
        }
      } else {
        console.log('\n❌ Users table does not exist in this database!');
      }
      
    } else {
      console.log(`❌ Database "${process.env.DB_NAME}" does NOT exist on Railway!`);
      console.log('\n💡 Suggestions:');
      console.log('1. Check if you need to use a different database name');
      console.log('2. Create the database on Railway');
      console.log('3. Import your data to the correct database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 The database name in your .env file does not exist on Railway.');
      console.log('   Try updating DB_NAME to match an existing database.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabases().catch(console.error);

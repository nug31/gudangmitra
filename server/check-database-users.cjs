const mysql = require('mysql2/promise');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function heading(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
}

async function checkDatabase() {
  let connection;
  
  try {
    heading('🔍 Checking Railway Database Connection and Users');
    
    // Database configuration from .env
    const dbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 30000
    };
    
    info('Database configuration:');
    log(`   Host: ${dbConfig.host}`);
    log(`   Port: ${dbConfig.port}`);
    log(`   User: ${dbConfig.user}`);
    log(`   Database: ${dbConfig.database}`);
    log(`   Password: ${dbConfig.password ? '***' + dbConfig.password.slice(-4) : 'not set'}`);
    
    // Connect to database
    info('Connecting to Railway database...');
    connection = await mysql.createConnection(dbConfig);
    success('Connected to Railway database successfully!');
    
    // Check if gudang1 database exists
    info('Checking available databases...');
    const [databases] = await connection.query('SHOW DATABASES');
    log('\nAvailable databases:');
    databases.forEach(db => {
      const dbName = Object.values(db)[0];
      log(`   - ${dbName}`);
    });
    
    // Check if users table exists
    info('\nChecking if users table exists...');
    try {
      const [tables] = await connection.query('SHOW TABLES LIKE "users"');
      if (tables.length > 0) {
        success('Users table exists!');
        
        // Get all users
        info('Fetching all users from database...');
        const [users] = await connection.query(`
          SELECT id, name, email, password, role, created_at
          FROM users 
          ORDER BY email
        `);
        
        success(`Found ${users.length} users in the database:`);
        
        users.forEach((user, index) => {
          log(`\n${index + 1}. User Details:`);
          log(`   ID: ${user.id}`);
          log(`   Name: ${user.name || 'N/A'}`);
          log(`   Email: ${user.email}`);
          log(`   Role: ${user.role || 'user'}`);
          log(`   Password: "${user.password}"`);
          log(`   Created: ${user.created_at}`);
          
          // Check password type
          if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
            warning(`   → This is a bcrypt hashed password`);
          } else {
            info(`   → This is a plain text password`);
          }
        });
        
        // Test specific login credentials
        heading('🧪 Testing Login Credentials');
        
        const testCredentials = [
          { email: 'admin@example.com', password: 'password123' },
          { email: 'user@example.com', password: 'password123' },
          { email: 'bob@example.com', password: 'password' },
          { email: 'manager@gudangmitra.com', password: 'password123' },
          { email: 'admin@gudangmitra.com', password: 'password123' }
        ];
        
        for (const cred of testCredentials) {
          const user = users.find(u => u.email === cred.email);
          if (user) {
            const passwordMatch = user.password === cred.password;
            if (passwordMatch) {
              success(`✅ ${cred.email} - Password matches: "${cred.password}"`);
            } else {
              warning(`⚠️ ${cred.email} - Password mismatch:`);
              log(`   Expected: "${cred.password}"`);
              log(`   Actual: "${user.password}"`);
              
              // For hashed passwords, note that they should work with demo logic
              if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
                info(`   → Backend should accept "${cred.password}" for hashed passwords`);
              }
            }
          } else {
            error(`❌ ${cred.email} - User not found in database`);
          }
        }
        
      } else {
        error('Users table does not exist!');
        info('You may need to run database migration or setup scripts.');
      }
    } catch (tableError) {
      error(`Error checking users table: ${tableError.message}`);
    }
    
  } catch (err) {
    error(`Database connection failed: ${err.message}`);
    
    if (err.code === 'ER_BAD_DB_ERROR') {
      warning('Database "gudang1" does not exist on Railway!');
      info('You may need to create the database or check the DB_NAME in .env');
    } else if (err.code === 'ECONNREFUSED') {
      warning('Connection refused - check if Railway database is accessible');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      warning('Access denied - check your Railway database credentials');
    }
  } finally {
    if (connection) {
      await connection.end();
      info('Database connection closed');
    }
  }
}

// Run the check
checkDatabase().catch(console.error);

/**
 * Check User Passwords
 * 
 * This script checks what passwords are stored for users in the Railway database
 * to understand the login issue.
 */

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
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function heading(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
}

// Railway database configuration
const railwayConfig = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT),
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  database: 'railway'
};

async function checkUserPasswords() {
  let connection;
  
  try {
    heading('🔍 Checking User Passwords in Railway Database');
    
    // Connect to Railway database
    info('Connecting to Railway database...');
    connection = await mysql.createConnection(railwayConfig);
    success('Connected to Railway database');
    
    // Get all users with their passwords
    const [users] = await connection.query(`
      SELECT id, name, email, password, role, created_at
      FROM users 
      ORDER BY email
    `);
    
    success(`Found ${users.length} users in Railway database:`);
    
    users.forEach(user => {
      log(`\n📧 Email: ${user.email}`);
      log(`   Name: ${user.name || 'N/A'}`);
      log(`   Role: ${user.role || 'user'}`);
      log(`   Password: "${user.password || 'N/A'}"`);
      log(`   ID: ${user.id}`);
    });
    
    // Check specific users that might be used for login
    heading('🔑 Testing Common Login Scenarios');
    
    const testUsers = [
      { email: 'bob@example.com', password: 'password123' },
      { email: 'manager@gudangmitra.com', password: 'password123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'user@example.com', password: 'user123' },
      { email: 'admin@gudangmitra.com', password: 'password123' }
    ];
    
    for (const testUser of testUsers) {
      const user = users.find(u => u.email === testUser.email);
      if (user) {
        const passwordMatch = user.password === testUser.password;
        if (passwordMatch) {
          success(`✅ ${testUser.email} - Password matches: "${testUser.password}"`);
        } else {
          warning(`⚠️ ${testUser.email} - Password mismatch:`);
          log(`   Expected: "${testUser.password}"`);
          log(`   Actual: "${user.password}"`);
        }
      } else {
        error(`❌ ${testUser.email} - User not found`);
      }
    }
    
    // Check for users with empty or null passwords
    heading('🚨 Users with Missing Passwords');
    
    const usersWithoutPasswords = users.filter(u => !u.password || u.password.trim() === '');
    
    if (usersWithoutPasswords.length > 0) {
      warning(`Found ${usersWithoutPasswords.length} users without passwords:`);
      usersWithoutPasswords.forEach(user => {
        log(`  - ${user.email} (${user.name || 'No name'})`);
      });
    } else {
      success('All users have passwords set');
    }
    
    // Close connection
    await connection.end();
    
    heading('🎯 Recommendations');
    
    info('To fix login issues:');
    info('1. Use the correct email/password combinations shown above');
    info('2. Or update user passwords in the database to match expected values');
    info('3. Or modify the login logic to handle the actual stored passwords');
    
    success('User password check complete!');
    
  } catch (err) {
    error(`User password check failed: ${err.message}`);
    console.error(err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Validate configuration
if (!railwayConfig.host || !railwayConfig.user || !railwayConfig.password) {
  error('Missing Railway configuration!');
  info('Please check your .env file');
  process.exit(1);
}

checkUserPasswords();

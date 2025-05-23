/**
 * Backend Deployment Script
 * 
 * This script prepares the backend for deployment by:
 * 1. Validating environment variables
 * 2. Testing database connection
 * 3. Generating deployment files
 * 
 * Usage: node deploy-backend.js [frontend-url]
 * Example: node deploy-backend.js https://my-app.netlify.app
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions
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

function executeCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (err) {
    error(`Command failed: ${command}`);
    return false;
  }
}

// Load environment variables
try {
  require('dotenv').config();
} catch (err) {
  warning('dotenv module not found. Installing...');
  executeCommand('npm install dotenv');
  require('dotenv').config();
}

// Main function
async function main() {
  heading('Backend Deployment Script');
  
  // Get frontend URL from command line argument or use default
  const frontendUrl = process.argv[2] || 'https://your-app.netlify.app';
  
  if (process.argv[2]) {
    success(`Using provided frontend URL: ${frontendUrl}`);
  } else {
    warning('No frontend URL provided. Using default: https://your-app.netlify.app');
    warning('To specify a frontend URL, run: node deploy-backend.js https://your-app.netlify.app');
  }
  
  // Step 1: Validate environment variables
  heading('Step 1: Validating environment variables');
  
  const envPath = path.join(__dirname, '.env');
  let envExists = fs.existsSync(envPath);
  
  if (envExists) {
    success('Found .env file');
  } else {
    warning('.env file not found, creating it');
    
    const envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gudang1
DB_PORT=3306

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=${frontendUrl}`;
    
    fs.writeFileSync(envPath, envContent);
    success('Created .env file with default values');
    warning('Please update the database credentials in .env before deployment');
    
    // Reload environment variables
    require('dotenv').config();
  }
  
  // Step 2: Test database connection
  heading('Step 2: Testing database connection');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gudang1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  };
  
  info(`Attempting to connect to database at ${dbConfig.host}:${dbConfig.port}`);
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    success('Successfully connected to database!');
    
    // Test query
    const [tables] = await connection.query('SHOW TABLES');
    success(`Found ${tables.length} tables in the database`);
    
    // Close connection
    await connection.end();
  } catch (err) {
    error(`Failed to connect to database: ${err.message}`);
    warning('Please check your database credentials in .env');
    warning('You can still proceed with deployment, but the application may not work correctly');
  }
  
  // Step 3: Update CORS settings
  heading('Step 3: Updating CORS settings');
  
  // Update .env file with frontend URL
  const envContent = fs.readFileSync(envPath, 'utf8');
  const updatedEnvContent = envContent.replace(
    /CORS_ORIGIN=.*/,
    `CORS_ORIGIN=${frontendUrl}`
  );
  
  fs.writeFileSync(envPath, updatedEnvContent);
  success(`Updated CORS_ORIGIN in .env to: ${frontendUrl}`);
  
  // Step 4: Prepare for deployment
  heading('Step 4: Preparing for deployment');
  
  // Check if Procfile exists
  const procfilePath = path.join(__dirname, 'Procfile');
  if (fs.existsSync(procfilePath)) {
    success('Procfile found');
  } else {
    info('Creating Procfile for deployment');
    fs.writeFileSync(procfilePath, 'web: node fixed-server.js');
    success('Created Procfile');
  }
  
  // Create production .env file
  const prodEnvPath = path.join(__dirname, '.env.production');
  const prodEnvContent = updatedEnvContent.replace(
    /NODE_ENV=.*/,
    'NODE_ENV=production'
  );
  
  fs.writeFileSync(prodEnvPath, prodEnvContent);
  success('Created .env.production file');
  
  // Step 5: Final instructions
  heading('Step 5: Deployment Instructions');
  
  info('Your backend is now ready for deployment!');
  info('You can deploy it using one of the following services:');
  
  log('\n1. Render:');
  log('   - Create a new Web Service');
  log('   - Connect your GitHub repository');
  log('   - Set the root directory to "server"');
  log('   - Set the build command to "npm install"');
  log('   - Set the start command to "node fixed-server.js"');
  log('   - Add the environment variables from .env.production');
  
  log('\n2. Railway:');
  log('   - Create a new project');
  log('   - Connect your GitHub repository');
  log('   - Set the root directory to "server"');
  log('   - Add the environment variables from .env.production');
  
  log('\n3. Heroku:');
  log('   - Create a new app');
  log('   - Connect your GitHub repository');
  log('   - Set the root directory to "server"');
  log('   - Add the environment variables from .env.production');
  
  log('\nImportant: Make sure your frontend is configured to use your backend URL');
  
  heading('Deployment Preparation Complete!');
}

// Run the script
main().catch(err => {
  error('An error occurred:');
  console.error(err);
  process.exit(1);
});

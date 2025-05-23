/**
 * Deployment preparation script
 *
 * This script helps prepare your application for deployment by:
 * 1. Creating a production build
 * 2. Validating environment variables
 * 3. Generating deployment files
 *
 * Run with: node prepare-deploy.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const backendUrl = process.env.BACKEND_URL || 'https://your-backend-url.com';
const frontendUrl = process.env.FRONTEND_URL || 'https://your-app.netlify.app';

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

// Main function
async function main() {
  heading('Deployment Preparation Script');

  // Step 1: Validate environment files
  heading('Step 1: Validating environment files');

  // Check frontend environment file
  const envProdPath = path.join(process.cwd(), '.env.production');
  if (fs.existsSync(envProdPath)) {
    success('Found .env.production file');

    // Update API URL
    const envContent = `VITE_API_URL=${backendUrl}`;
    fs.writeFileSync(envProdPath, envContent);
    success(`Updated .env.production with API URL: ${backendUrl}`);
  } else {
    warning('.env.production file not found, creating it');
    const envContent = `VITE_API_URL=${backendUrl}`;
    fs.writeFileSync(envProdPath, envContent);
    success(`Created .env.production with API URL: ${backendUrl}`);
  }

  // Check backend environment file
  const serverEnvPath = path.join(process.cwd(), 'server', '.env');
  if (fs.existsSync(serverEnvPath)) {
    success('Found server/.env file');
    info('Please make sure to update the database credentials in this file before deployment');
  } else {
    warning('server/.env file not found, creating it');
    const serverEnvContent = `# Database Configuration
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=gudang1
DB_PORT=3306

# Server Configuration
PORT=3002
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=${frontendUrl}`;
    fs.writeFileSync(serverEnvPath, serverEnvContent);
    success('Created server/.env file');
    warning('Please update the database credentials in server/.env before deployment');
  }

  // Step 2: Build the frontend
  heading('Step 2: Building the frontend');
  info('This will create a production build of your React application');

  if (executeCommand('npm run build')) {
    success('Frontend build completed successfully');
  } else {
    error('Frontend build failed');
    process.exit(1);
  }

  // Step 3: Prepare backend for deployment
  heading('Step 3: Preparing backend for deployment');

  // Check if package.json exists in server directory
  const serverPackageJsonPath = path.join(process.cwd(), 'server', 'package.json');
  if (fs.existsSync(serverPackageJsonPath)) {
    success('Found server/package.json');
  } else {
    error('server/package.json not found');
    process.exit(1);
  }

  // Step 4: Final instructions
  heading('Step 4: Deployment Instructions');

  info('Your application is now ready for deployment!');
  info('Please follow these steps:');
  log('\n1. Deploy the backend:');
  log('   - Follow the instructions in server/deploy-instructions.md');
  log('   - Make sure to set the correct environment variables');

  log('\n2. Deploy the frontend to Netlify:');
  log('   - Follow the instructions in netlify-deploy-instructions.md');
  log('   - Set VITE_API_URL to your backend URL');

  log('\n3. Update CORS settings:');
  log('   - After deploying the frontend, update the CORS_ORIGIN in your backend');
  log('   - Set it to your Netlify URL or custom domain');

  heading('Deployment Preparation Complete!');
}

// Run the script
main().catch(err => {
  error('An error occurred:');
  console.error(err);
  process.exit(1);
});

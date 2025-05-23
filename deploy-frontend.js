/**
 * Frontend Deployment Script
 * 
 * This script builds the frontend application and prepares it for deployment to Netlify.
 * 
 * Usage: node deploy-frontend.js [backend-url]
 * Example: node deploy-frontend.js https://my-backend-api.onrender.com
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  heading('Frontend Deployment Script');
  
  // Get backend URL from command line argument or use default
  const backendUrl = process.argv[2] || 'https://your-backend-url.com';
  
  if (process.argv[2]) {
    success(`Using provided backend URL: ${backendUrl}`);
  } else {
    warning('No backend URL provided. Using default: https://your-backend-url.com');
    warning('To specify a backend URL, run: node deploy-frontend.js https://your-backend-url.com');
  }
  
  // Step 1: Update environment variables
  heading('Step 1: Updating environment variables');
  
  const envProdPath = path.join(__dirname, '.env.production');
  const envContent = `VITE_API_URL=${backendUrl}`;
  
  fs.writeFileSync(envProdPath, envContent);
  success(`Updated .env.production with API URL: ${backendUrl}`);
  
  // Step 2: Build the application
  heading('Step 2: Building the application');
  
  if (executeCommand('npm run build')) {
    success('Build completed successfully!');
  } else {
    error('Build failed. Please check the errors above.');
    process.exit(1);
  }
  
  // Step 3: Prepare for Netlify deployment
  heading('Step 3: Preparing for Netlify deployment');
  
  // Check if netlify.toml exists
  const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
  if (fs.existsSync(netlifyTomlPath)) {
    success('netlify.toml file found');
  } else {
    warning('netlify.toml file not found, creating it');
    const netlifyTomlContent = `[build]
  command = "npm run build"
  publish = "dist"

# Redirect all routes to index.html for SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;
    
    fs.writeFileSync(netlifyTomlPath, netlifyTomlContent);
    success('Created netlify.toml file');
  }
  
  // Step 4: Final instructions
  heading('Step 4: Deployment Instructions');
  
  info('Your frontend application is now ready for deployment to Netlify!');
  info('You can deploy it using one of the following methods:');
  
  log('\n1. Netlify CLI (if installed):');
  log('   $ netlify deploy --prod');
  
  log('\n2. Netlify Drop:');
  log('   - Go to https://app.netlify.com/drop');
  log('   - Drag and drop the "dist" folder');
  
  log('\n3. Netlify Git Integration:');
  log('   - Push your changes to GitHub');
  log('   - Connect your repository in the Netlify dashboard');
  log('   - Configure the build settings as specified in netlify.toml');
  
  log('\nImportant: Make sure your backend is deployed and accessible at:');
  log(`${backendUrl}`, colors.green);
  
  heading('Deployment Preparation Complete!');
}

// Run the script
main().catch(err => {
  error('An error occurred:');
  console.error(err);
  process.exit(1);
});

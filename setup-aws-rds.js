/**
 * AWS RDS Quick Setup Script
 * 
 * This script helps you set up your environment for AWS RDS deployment.
 * It creates the necessary configuration files and provides guidance.
 * 
 * Usage: node setup-aws-rds.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  heading('AWS RDS Quick Setup for Gudang Mitra');
  
  info('This script will help you set up AWS RDS for your application.');
  info('You can skip any step by pressing Enter to use default values.');
  
  // Collect AWS RDS information
  heading('Step 1: AWS RDS Configuration');
  
  const rdsHost = await question('Enter your AWS RDS endpoint (e.g., gudang1.xxxxxxxxx.us-east-1.rds.amazonaws.com): ');
  const rdsUser = await question('Enter your RDS username [admin]: ') || 'admin';
  const rdsPassword = await question('Enter your RDS password: ');
  const rdsDatabase = await question('Enter your database name [gudang1]: ') || 'gudang1';
  const rdsPort = await question('Enter your RDS port [3306]: ') || '3306';
  
  // Collect deployment information
  heading('Step 2: Deployment Configuration');
  
  const backendUrl = await question('Enter your planned backend URL (e.g., https://gudang1-api.onrender.com): ');
  const frontendUrl = await question('Enter your planned frontend URL (e.g., https://gudang1-app.netlify.app): ');
  
  rl.close();
  
  // Create configuration files
  heading('Step 3: Creating Configuration Files');
  
  // Create server .env file
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  const serverEnvContent = `# AWS RDS Configuration
DB_HOST=${rdsHost}
DB_USER=${rdsUser}
DB_PASSWORD=${rdsPassword}
DB_NAME=${rdsDatabase}
DB_PORT=${rdsPort}
DB_SSL=true

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=${frontendUrl || 'http://localhost:5173'}

# AWS RDS Migration Configuration
AWS_RDS_HOST=${rdsHost}
AWS_RDS_USER=${rdsUser}
AWS_RDS_PASSWORD=${rdsPassword}
AWS_RDS_DATABASE=${rdsDatabase}
AWS_RDS_PORT=${rdsPort}`;

  fs.writeFileSync(serverEnvPath, serverEnvContent);
  success('Created server/.env file');
  
  // Create production environment file
  const prodEnvPath = path.join(__dirname, 'server', '.env.production');
  const prodEnvContent = serverEnvContent.replace('NODE_ENV=development', 'NODE_ENV=production');
  fs.writeFileSync(prodEnvPath, prodEnvContent);
  success('Created server/.env.production file');
  
  // Create frontend .env.production file
  const frontendEnvPath = path.join(__dirname, '.env.production');
  const frontendEnvContent = `VITE_API_URL=${backendUrl || 'http://localhost:3002'}`;
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  success('Created .env.production file');
  
  // Create deployment checklist
  const checklistPath = path.join(__dirname, 'aws-rds-checklist.md');
  const checklistContent = `# AWS RDS Deployment Checklist

## Configuration Details
- **RDS Endpoint**: ${rdsHost}
- **Database**: ${rdsDatabase}
- **Username**: ${rdsUser}
- **Backend URL**: ${backendUrl}
- **Frontend URL**: ${frontendUrl}

## Pre-Deployment Steps
- [ ] AWS RDS instance is created and running
- [ ] Security group allows inbound connections on port 3306
- [ ] Database credentials are correct
- [ ] Local database has been exported

## Database Migration
- [ ] Run: \`cd server && node migrate-to-aws-rds.js\`
- [ ] Import data to AWS RDS using the generated SQL files
- [ ] Test connection: \`cd server && node test-aws-rds.js\`

## Backend Deployment (Render/Railway/Heroku)
- [ ] Create new web service
- [ ] Set root directory to "server"
- [ ] Configure environment variables from server/.env.production
- [ ] Deploy and test API endpoints

## Frontend Deployment (Netlify)
- [ ] Connect GitHub repository
- [ ] Set build command: \`npm run build\`
- [ ] Set publish directory: \`dist\`
- [ ] Configure environment variable: \`VITE_API_URL=${backendUrl}\`
- [ ] Deploy and test application

## Post-Deployment
- [ ] Update CORS settings with actual frontend URL
- [ ] Test login functionality
- [ ] Test request creation and approval
- [ ] Verify database operations work correctly

## Testing URLs
- Backend API: ${backendUrl}/api/test-connection
- Frontend App: ${frontendUrl}
`;

  fs.writeFileSync(checklistPath, checklistContent);
  success('Created aws-rds-checklist.md');
  
  // Final instructions
  heading('Setup Complete!');
  
  success('Configuration files have been created successfully!');
  
  info('Next steps:');
  info('1. Test your AWS RDS connection:');
  log('   cd server && node test-aws-rds.js', colors.cyan);
  
  info('2. Migrate your database:');
  log('   cd server && node migrate-to-aws-rds.js', colors.cyan);
  
  info('3. Follow the deployment guide:');
  log('   Check aws-rds-deployment-guide.md for detailed instructions', colors.cyan);
  
  info('4. Use the checklist to track your progress:');
  log('   Check aws-rds-checklist.md', colors.cyan);
  
  warning('Important Security Notes:');
  warning('• Keep your RDS password secure');
  warning('• Don\'t commit .env files to version control');
  warning('• Use environment variables in your deployment platforms');
  warning('• Consider restricting RDS security group access in production');
  
  heading('Happy Deploying! 🚀');
}

// Run the setup
main().catch(err => {
  error('Setup failed:');
  console.error(err);
  process.exit(1);
});

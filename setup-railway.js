/**
 * Railway MySQL Setup Script
 * 
 * This script helps you configure your application to use Railway MySQL database.
 * 
 * Usage: node setup-railway.js
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

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  heading('Railway MySQL Setup for Gudang Mitra');
  
  info('This script will help you configure Railway MySQL for your application.');
  info('Make sure you have created a Railway account and MySQL service first.');
  
  // Instructions
  heading('Before You Start');
  info('1. Go to https://railway.app/ and create an account');
  info('2. Create a new project and provision MySQL');
  info('3. Get your connection details from the Railway dashboard');
  info('4. Have your connection details ready');
  
  const proceed = await question('\nDo you have your Railway MySQL connection details ready? (y/n): ');
  
  if (proceed.toLowerCase() !== 'y') {
    info('Please set up Railway MySQL first, then run this script again.');
    info('Check the railway-mysql-setup.md guide for detailed instructions.');
    rl.close();
    return;
  }
  
  // Collect Railway MySQL information
  heading('Railway MySQL Configuration');
  
  const dbHost = await question('Enter your Railway MySQL host (e.g., containers-us-west-xxx.railway.app): ');
  const dbPort = await question('Enter your Railway MySQL port (e.g., 6543): ');
  const dbUser = await question('Enter your Railway MySQL username [root]: ') || 'root';
  const dbPassword = await question('Enter your Railway MySQL password: ');
  const dbName = await question('Enter your database name [gudang1]: ') || 'gudang1';
  
  // Collect deployment information
  heading('Deployment Configuration');
  
  const backendUrl = await question('Enter your planned backend URL (or press Enter to skip): ') || 'http://localhost:3002';
  const frontendUrl = await question('Enter your planned frontend URL (or press Enter to skip): ') || 'http://localhost:5173';
  
  rl.close();
  
  // Create configuration files
  heading('Creating Configuration Files');
  
  // Create server .env file
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  const serverEnvContent = `# Railway MySQL Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}
DB_SSL=false

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=${frontendUrl}

# Migration Configuration (using same Railway details)
AWS_RDS_HOST=${dbHost}
AWS_RDS_PORT=${dbPort}
AWS_RDS_USER=${dbUser}
AWS_RDS_PASSWORD=${dbPassword}
AWS_RDS_DATABASE=${dbName}`;

  fs.writeFileSync(serverEnvPath, serverEnvContent);
  success('Created server/.env file');
  
  // Create production environment file
  const prodEnvPath = path.join(__dirname, 'server', '.env.production');
  const prodEnvContent = serverEnvContent.replace('NODE_ENV=development', 'NODE_ENV=production');
  fs.writeFileSync(prodEnvPath, prodEnvContent);
  success('Created server/.env.production file');
  
  // Create frontend .env.production file
  const frontendEnvPath = path.join(__dirname, '.env.production');
  const frontendEnvContent = `VITE_API_URL=${backendUrl}`;
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  success('Created .env.production file');
  
  // Create Railway-specific checklist
  const checklistPath = path.join(__dirname, 'railway-deployment-checklist.md');
  const checklistContent = `# Railway Deployment Checklist

## Configuration Details
- **Railway MySQL Host**: ${dbHost}
- **Database**: ${dbName}
- **Username**: ${dbUser}
- **Backend URL**: ${backendUrl}
- **Frontend URL**: ${frontendUrl}

## Database Setup
- [ ] Railway account created
- [ ] MySQL service provisioned
- [ ] Connection details obtained
- [ ] Configuration files updated

## Database Migration
- [ ] Test connection: \`cd server && node test-aws-rds.js\`
- [ ] Export local data: \`cd server && node migrate-to-aws-rds.js\`
- [ ] Import data to Railway MySQL
- [ ] Verify data migration

## Backend Deployment Options

### Option 1: Railway (Same Platform)
- [ ] Create new Railway service for backend
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy backend

### Option 2: Netlify Functions
- [ ] Convert Express routes to Netlify Functions
- [ ] Deploy with frontend on Netlify
- [ ] Test API endpoints

### Option 3: Other Hosting (Render, Heroku, etc.)
- [ ] Choose hosting platform
- [ ] Set environment variables
- [ ] Deploy backend
- [ ] Update CORS settings

## Frontend Deployment (Netlify)
- [ ] Connect GitHub repository to Netlify
- [ ] Set build command: \`npm run build\`
- [ ] Set publish directory: \`dist\`
- [ ] Configure environment variable: \`VITE_API_URL=${backendUrl}\`
- [ ] Deploy and test

## Testing
- [ ] Test database connection
- [ ] Test API endpoints
- [ ] Test frontend functionality
- [ ] Verify request/approval workflow

## Cost Monitoring
- [ ] Monitor Railway usage
- [ ] Check remaining free credits
- [ ] Plan for scaling if needed
`;

  fs.writeFileSync(checklistPath, checklistContent);
  success('Created railway-deployment-checklist.md');
  
  // Create connection test instructions
  const testInstructionsPath = path.join(__dirname, 'test-railway-connection.md');
  const testInstructions = `# Test Railway MySQL Connection

## Quick Test Commands

1. **Test Connection**:
   \`\`\`bash
   cd server
   node test-aws-rds.js
   \`\`\`

2. **If connection works, migrate data**:
   \`\`\`bash
   cd server
   node migrate-to-aws-rds.js
   \`\`\`

3. **Import data to Railway**:
   \`\`\`bash
   mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p ${dbName} < aws-rds-migration/complete_migration.sql
   \`\`\`

## Manual Connection Test

You can also test manually using MySQL client:

\`\`\`bash
mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p
\`\`\`

Then:
\`\`\`sql
USE ${dbName};
SHOW TABLES;
\`\`\`

## Troubleshooting

- **Connection refused**: Check host and port
- **Access denied**: Verify username and password
- **Database not found**: Create the database first:
  \`\`\`sql
  CREATE DATABASE ${dbName};
  \`\`\`
`;

  fs.writeFileSync(testInstructionsPath, testInstructions);
  success('Created test-railway-connection.md');
  
  // Final instructions
  heading('Setup Complete!');
  
  success('Railway MySQL configuration completed successfully!');
  
  info('Next steps:');
  info('1. Test your Railway connection:');
  log('   cd server && node test-aws-rds.js', colors.cyan);
  
  info('2. If connection works, migrate your data:');
  log('   cd server && node migrate-to-aws-rds.js', colors.cyan);
  
  info('3. Follow the deployment checklist:');
  log('   Check railway-deployment-checklist.md', colors.cyan);
  
  info('4. Choose your backend deployment option:');
  log('   - Railway (same platform as database)', colors.cyan);
  log('   - Netlify Functions (serverless)', colors.cyan);
  log('   - Other hosting (Render, Heroku, etc.)', colors.cyan);
  
  warning('Important Notes:');
  warning('• Railway provides $5/month free credits');
  warning('• Monitor your usage in the Railway dashboard');
  warning('• Keep your database credentials secure');
  
  heading('Happy Deploying with Railway! 🚂');
}

// Run the setup
main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});

/**
 * Manual Railway Configuration
 * 
 * Use this if you want to manually configure Railway MySQL
 * after getting your connection details from Railway dashboard.
 */

import fs from 'fs';
import path from 'path';
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
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function heading(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
}

// Example Railway configuration
const exampleConfig = {
  host: 'containers-us-west-123.railway.app',
  port: '6543',
  user: 'root',
  password: 'generated-password-here',
  database: 'railway'
};

function createConfiguration() {
  heading('Railway MySQL Manual Configuration');
  
  info('This script creates Railway configuration files with example values.');
  info('You need to replace the example values with your actual Railway connection details.');
  
  // Create server .env file
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  const serverEnvContent = `# Railway MySQL Configuration
# IMPORTANT: Replace these with your actual Railway connection details
DB_HOST=${exampleConfig.host}
DB_PORT=${exampleConfig.port}
DB_USER=${exampleConfig.user}
DB_PASSWORD=${exampleConfig.password}
DB_NAME=${exampleConfig.database}
DB_SSL=false

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Migration Configuration (using same Railway details)
AWS_RDS_HOST=${exampleConfig.host}
AWS_RDS_PORT=${exampleConfig.port}
AWS_RDS_USER=${exampleConfig.user}
AWS_RDS_PASSWORD=${exampleConfig.password}
AWS_RDS_DATABASE=${exampleConfig.database}`;

  fs.writeFileSync(serverEnvPath, serverEnvContent);
  success('Created server/.env file with Railway template');
  
  // Create production environment file
  const prodEnvPath = path.join(__dirname, 'server', '.env.production');
  const prodEnvContent = serverEnvContent.replace('NODE_ENV=development', 'NODE_ENV=production');
  fs.writeFileSync(prodEnvPath, prodEnvContent);
  success('Created server/.env.production file');
  
  // Create frontend .env.production file
  const frontendEnvPath = path.join(__dirname, '.env.production');
  const frontendEnvContent = `VITE_API_URL=http://localhost:3002`;
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  success('Created .env.production file');
  
  // Create instructions
  const instructionsPath = path.join(__dirname, 'UPDATE-RAILWAY-CONFIG.md');
  const instructions = `# Update Railway Configuration

## Your Railway Connection Details

After creating your Railway MySQL service, you'll get connection details like:

\`\`\`
MYSQL_HOST=containers-us-west-123.railway.app
MYSQL_PORT=6543
MYSQL_USER=root
MYSQL_PASSWORD=abc123def456ghi789
MYSQL_DATABASE=railway
\`\`\`

## Update server/.env File

Replace the example values in \`server/.env\` with your actual Railway details:

\`\`\`env
DB_HOST=containers-us-west-123.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=abc123def456ghi789
DB_NAME=railway
\`\`\`

## Create Your Database

After updating the configuration, you need to create your \`gudang1\` database:

1. **Connect to Railway MySQL**:
   \`\`\`bash
   mysql -h containers-us-west-123.railway.app -P 6543 -u root -p
   \`\`\`

2. **Create your database**:
   \`\`\`sql
   CREATE DATABASE gudang1;
   USE gudang1;
   \`\`\`

3. **Update your .env to use gudang1**:
   \`\`\`env
   DB_NAME=gudang1
   AWS_RDS_DATABASE=gudang1
   \`\`\`

## Test Connection

After updating the configuration:

\`\`\`bash
cd server
node test-aws-rds.js
\`\`\`

## Migrate Data

If connection test passes:

\`\`\`bash
cd server
node migrate-to-aws-rds.js
\`\`\`

Then import:

\`\`\`bash
mysql -h your-railway-host -P your-port -u root -p gudang1 < aws-rds-migration/complete_migration.sql
\`\`\`
`;

  fs.writeFileSync(instructionsPath, instructions);
  success('Created UPDATE-RAILWAY-CONFIG.md with detailed instructions');
  
  heading('Configuration Files Created!');
  
  info('Next steps:');
  info('1. Go to https://railway.app/ and create your MySQL service');
  info('2. Get your connection details from Railway dashboard');
  info('3. Update server/.env with your actual Railway connection details');
  info('4. Follow the instructions in UPDATE-RAILWAY-CONFIG.md');
  info('5. Test connection: cd server && node test-aws-rds.js');
  
  heading('Railway Setup Complete! 🚂');
}

createConfiguration();

/**
 * db4free.net MySQL Setup Script
 * 
 * This script helps you configure your application to use db4free.net MySQL database.
 * 
 * Usage: node setup-db4free.js
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
  heading('db4free.net MySQL Setup for Gudang Mitra');
  
  info('This script will help you configure db4free.net MySQL for your application.');
  info('db4free.net provides 200MB of free MySQL storage - perfect for development!');
  
  // Instructions
  heading('Setup Instructions');
  info('1. Go to https://www.db4free.net/');
  info('2. Click "Create account"');
  info('3. Fill out the registration form:');
  info('   - Database name: gudang1 (recommended)');
  info('   - Username: your choice (remember this!)');
  info('   - Password: strong password');
  info('   - Email: your email');
  info('4. Check your email and click verification link');
  info('5. Come back here with your credentials');
  
  const proceed = await question('\nHave you created your db4free.net account? (y/n): ');
  
  if (proceed.toLowerCase() !== 'y') {
    info('Please create your db4free.net account first, then run this script again.');
    info('Visit: https://www.db4free.net/');
    rl.close();
    return;
  }
  
  // Collect db4free.net information
  heading('db4free.net Configuration');
  
  info('Enter the credentials you used when creating your db4free.net account:');
  
  const dbName = await question('Enter your database name [gudang1]: ') || 'gudang1';
  const dbUser = await question('Enter your username: ');
  const dbPassword = await question('Enter your password: ');
  
  if (!dbUser || !dbPassword) {
    warning('Username and password are required!');
    rl.close();
    return;
  }
  
  // Collect deployment information
  heading('Deployment Configuration');
  
  const backendUrl = await question('Enter your planned backend URL (or press Enter for localhost): ') || 'http://localhost:3002';
  const frontendUrl = await question('Enter your planned frontend URL (or press Enter for localhost): ') || 'http://localhost:5173';
  
  rl.close();
  
  // Create configuration files
  heading('Creating Configuration Files');
  
  // Create server .env file
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  const serverEnvContent = `# db4free.net MySQL Configuration
DB_HOST=db4free.net
DB_PORT=3306
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}
DB_SSL=false

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=${frontendUrl}

# Migration Configuration (using same db4free.net details)
AWS_RDS_HOST=db4free.net
AWS_RDS_PORT=3306
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
  
  // Create db4free-specific checklist
  const checklistPath = path.join(__dirname, 'db4free-deployment-checklist.md');
  const checklistContent = `# db4free.net Deployment Checklist

## Configuration Details
- **Host**: db4free.net
- **Database**: ${dbName}
- **Username**: ${dbUser}
- **Backend URL**: ${backendUrl}
- **Frontend URL**: ${frontendUrl}

## Database Setup
- [ ] db4free.net account created and verified
- [ ] Database credentials obtained
- [ ] Configuration files updated

## Database Migration
- [ ] Test connection: \`cd server && node test-aws-rds.js\`
- [ ] Export local data: \`cd server && node migrate-to-aws-rds.js\`
- [ ] Import data to db4free.net MySQL
- [ ] Verify data migration (check 200MB limit)

## Important Notes
- ⚠️ **Storage Limit**: 200MB maximum
- ⚠️ **Performance**: Shared hosting, expect slower responses
- ⚠️ **Reliability**: Not for production use
- ✅ **Cost**: Completely free forever

## Backend Deployment Options

### Option 1: Netlify Functions (Recommended for db4free.net)
- [ ] Convert Express routes to Netlify Functions
- [ ] Deploy with frontend on Netlify
- [ ] Test API endpoints
- [ ] Monitor response times

### Option 2: Free Hosting Services
- [ ] Render (free tier)
- [ ] Railway ($5 credits)
- [ ] Heroku (limited free tier)
- [ ] Set environment variables
- [ ] Deploy backend

## Frontend Deployment (Netlify)
- [ ] Connect GitHub repository to Netlify
- [ ] Set build command: \`npm run build\`
- [ ] Set publish directory: \`dist\`
- [ ] Configure environment variable: \`VITE_API_URL=${backendUrl}\`
- [ ] Deploy and test

## Testing Checklist
- [ ] Test database connection speed
- [ ] Test API response times
- [ ] Test with multiple concurrent users
- [ ] Monitor database storage usage
- [ ] Test all CRUD operations

## Performance Optimization for db4free.net
- [ ] Minimize database queries
- [ ] Use connection pooling carefully
- [ ] Implement caching where possible
- [ ] Optimize SQL queries
- [ ] Consider pagination for large datasets

## Monitoring
- [ ] Check database storage usage regularly
- [ ] Monitor query performance
- [ ] Set up error logging
- [ ] Plan migration to paid service if needed
`;

  fs.writeFileSync(checklistPath, checklistContent);
  success('Created db4free-deployment-checklist.md');
  
  // Create connection test instructions
  const testInstructionsPath = path.join(__dirname, 'test-db4free-connection.md');
  const testInstructions = `# Test db4free.net MySQL Connection

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

3. **Import data to db4free.net**:
   \`\`\`bash
   mysql -h db4free.net -P 3306 -u ${dbUser} -p ${dbName} < aws-rds-migration/complete_migration.sql
   \`\`\`

## Manual Connection Test

Test manually using MySQL client:

\`\`\`bash
mysql -h db4free.net -P 3306 -u ${dbUser} -p
\`\`\`

Then:
\`\`\`sql
USE ${dbName};
SHOW TABLES;
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${dbName}';
\`\`\`

## Check Database Size

Monitor your storage usage:
\`\`\`sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = '${dbName}'
GROUP BY table_schema;
\`\`\`

## phpMyAdmin Access

You can also manage your database via web interface:
- URL: https://www.db4free.net/phpMyAdmin/
- Username: ${dbUser}
- Password: [your password]

## Troubleshooting

### Common Issues:
- **Connection timeout**: db4free.net can be slow, increase timeout
- **Access denied**: Double-check username and password
- **Database not found**: Make sure you're using the correct database name
- **Slow queries**: This is normal for free shared hosting

### Performance Tips:
- Keep queries simple
- Use indexes on frequently queried columns
- Limit result sets with LIMIT clause
- Avoid complex JOINs when possible
`;

  fs.writeFileSync(testInstructionsPath, testInstructions);
  success('Created test-db4free-connection.md');
  
  // Final instructions
  heading('Setup Complete!');
  
  success('db4free.net MySQL configuration completed successfully!');
  
  info('Next steps:');
  info('1. Test your db4free.net connection:');
  log('   cd server && node test-aws-rds.js', colors.cyan);
  
  info('2. If connection works, migrate your data:');
  log('   cd server && node migrate-to-aws-rds.js', colors.cyan);
  
  info('3. Import your data to db4free.net:');
  log(`   mysql -h db4free.net -P 3306 -u ${dbUser} -p ${dbName} < aws-rds-migration/complete_migration.sql`, colors.cyan);
  
  info('4. Access phpMyAdmin (optional):');
  log('   https://www.db4free.net/phpMyAdmin/', colors.cyan);
  
  info('5. Follow the deployment checklist:');
  log('   Check db4free-deployment-checklist.md', colors.cyan);
  
  warning('Important Reminders:');
  warning('• Storage limit: 200MB maximum');
  warning('• Performance: Expect slower responses (shared hosting)');
  warning('• Reliability: Good for development, not production');
  warning('• Monitor your database size regularly');
  
  heading('Happy Developing with db4free.net! 🆓');
}

// Run the setup
main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});

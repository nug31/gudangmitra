# Railway MySQL Database Setup Guide

Railway provides $5/month in free credits, which is perfect for hosting a small MySQL database for your application.

## Step 1: Create Railway Account

1. **Sign up for Railway**
   - Go to https://railway.app/
   - Click "Start a New Project"
   - Sign up with GitHub (recommended) or email

2. **Verify your account**
   - You'll get $5/month in free credits
   - No credit card required initially

## Step 2: Create MySQL Database

1. **Create New Project**
   - Click "New Project"
   - Select "Provision MySQL"

2. **Configure Database**
   - Railway will automatically create a MySQL instance
   - Wait for deployment to complete (2-3 minutes)

3. **Get Connection Details**
   - Click on your MySQL service
   - Go to "Connect" tab
   - Copy the connection details:
     - **Host**: `containers-us-west-xxx.railway.app`
     - **Port**: `xxxx`
     - **Username**: `root`
     - **Password**: `generated-password`
     - **Database**: `railway`

## Step 3: Create Your Database

1. **Connect to MySQL**
   - Use the Railway web console or MySQL client
   - Create your database:
   ```sql
   CREATE DATABASE gudang1;
   USE gudang1;
   ```

## Step 4: Update Your Configuration

Update your `server/.env` file with Railway details:

```env
# Railway MySQL Configuration
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=your-generated-password
DB_NAME=gudang1
DB_PORT=xxxx
DB_SSL=false

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Migration Configuration
AWS_RDS_HOST=containers-us-west-xxx.railway.app
AWS_RDS_USER=root
AWS_RDS_PASSWORD=your-generated-password
AWS_RDS_DATABASE=gudang1
AWS_RDS_PORT=xxxx
```

## Step 5: Test Connection

```bash
cd server
node test-aws-rds.js
```

## Step 6: Migrate Your Data

```bash
cd server
node migrate-to-aws-rds.js
```

Then import the generated SQL:
```bash
mysql -h containers-us-west-xxx.railway.app -P xxxx -u root -p gudang1 < aws-rds-migration/complete_migration.sql
```

## Cost Information

- **Free Credits**: $5/month
- **MySQL Usage**: ~$2-3/month for small database
- **Remaining Credits**: Can be used for backend hosting

## Pros and Cons

### Pros ✅
- Easy setup and management
- Reliable infrastructure
- Good performance
- Can also host your backend
- Automatic backups
- SSL support

### Cons ❌
- Credit-based (not unlimited free)
- Need to monitor usage
- May need to add payment method eventually

## Alternative: Aiven (1 Month Free)

If you prefer a longer trial period:

1. **Sign up at Aiven.io**
2. **Get $300 free credits** (1 month)
3. **Create MySQL service**
4. **Use for development and testing**

## Alternative: db4free.net (Completely Free)

For a completely free option with limitations:

1. **Go to db4free.net**
2. **Create account**
3. **Get 200MB MySQL database**
4. **Use for development only**

Connection details will be:
- Host: `db4free.net`
- Port: `3306`
- Database: `your-chosen-name`
- Username: `your-username`
- Password: `your-password`

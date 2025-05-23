# Complete AWS RDS Deployment Guide

This guide provides step-by-step instructions for deploying your application using AWS RDS for the database, with the backend on Render/Railway and frontend on Netlify.

## Architecture Overview

```
Frontend (Netlify) → Backend (Render/Railway) → Database (AWS RDS MySQL)
```

## Phase 1: Set Up AWS RDS MySQL Database

### Step 1: Create AWS RDS Instance

1. **Log in to AWS Console**
   - Go to https://aws.amazon.com/
   - Sign in to your AWS account

2. **Navigate to RDS**
   - Search for "RDS" in the AWS services
   - Click on "RDS" to open the RDS console

3. **Create Database**
   - Click "Create database"
   - Choose "Standard create"
   - Select "MySQL" as engine
   - Choose MySQL version 8.0.x

4. **Configure Database**
   - **Template**: Choose "Free tier" (for testing) or "Production" (for live use)
   - **DB instance identifier**: `gudang1-production`
   - **Master username**: `admin`
   - **Master password**: Create a strong password (save it securely!)

5. **Instance Configuration**
   - **DB instance class**: `db.t3.micro` (free tier) or `db.t3.small` (production)
   - **Storage**: 20 GB General Purpose SSD
   - **Enable storage autoscaling**: Yes

6. **Connectivity**
   - **VPC**: Default VPC
   - **Public access**: Yes (to allow connections from your backend)
   - **VPC security group**: Create new
   - **Database port**: 3306

7. **Database Options**
   - **Initial database name**: `gudang1`
   - **Enable automated backups**: Yes
   - **Backup retention**: 7 days

8. **Create Database**
   - Review settings and click "Create database"
   - Wait 10-20 minutes for creation to complete

### Step 2: Configure Security Group

1. **Find Security Group**
   - Go to EC2 Console → Security Groups
   - Find the security group created for your RDS instance

2. **Edit Inbound Rules**
   - Click "Edit inbound rules"
   - Add rule: Type "MySQL/Aurora", Port 3306, Source "0.0.0.0/0"
   - Save rules

### Step 3: Get Connection Details

After RDS creation is complete:
- **Endpoint**: Copy the endpoint URL (e.g., `gudang1-production.xxxxxxxxx.us-east-1.rds.amazonaws.com`)
- **Port**: 3306
- **Username**: admin
- **Password**: Your master password
- **Database**: gudang1

## Phase 2: Migrate Your Database

### Step 1: Export Local Database

Run the migration script:
```bash
cd server
node migrate-to-aws-rds.js
```

### Step 2: Import to AWS RDS

Use MySQL command line:
```bash
mysql -h your-rds-endpoint.amazonaws.com -P 3306 -u admin -p gudang1 < aws-rds-migration/complete_migration.sql
```

Or use MySQL Workbench:
1. Connect to your AWS RDS instance
2. Import the `complete_migration.sql` file

## Phase 3: Deploy Backend to Render

### Step 1: Prepare Backend

1. **Update Environment Variables**
   - Copy `server/.env.aws-rds` to `server/.env`
   - Update with your actual AWS RDS details:
   ```env
   DB_HOST=your-rds-endpoint.amazonaws.com
   DB_USER=admin
   DB_PASSWORD=your-rds-password
   DB_NAME=gudang1
   DB_PORT=3306
   DB_SSL=true
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.netlify.app
   ```

### Step 2: Deploy to Render

1. **Create Render Account**
   - Sign up at https://render.com/

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `gudang1-api`
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Set Environment Variables**
   Add these in Render dashboard:
   ```
   DB_HOST=your-rds-endpoint.amazonaws.com
   DB_USER=admin
   DB_PASSWORD=your-rds-password
   DB_NAME=gudang1
   DB_PORT=3306
   DB_SSL=true
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.netlify.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://gudang1-api.onrender.com`)

## Phase 4: Deploy Frontend to Netlify

### Step 1: Prepare Frontend

1. **Update Environment Variables**
   - Update `.env.production`:
   ```env
   VITE_API_URL=https://gudang1-api.onrender.com
   ```

### Step 2: Deploy to Netlify

1. **Create Netlify Account**
   - Sign up at https://netlify.com/

2. **Deploy from Git**
   - Click "New site from Git"
   - Connect GitHub repository
   - Configure:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add: `VITE_API_URL` = `https://gudang1-api.onrender.com`

4. **Deploy**
   - Click "Deploy site"
   - Note your frontend URL (e.g., `https://your-app.netlify.app`)

## Phase 5: Final Configuration

### Step 1: Update CORS Settings

Update your backend environment variables in Render:
```
CORS_ORIGIN=https://your-app.netlify.app
```

### Step 2: Test the Application

1. **Test Database Connection**
   - Visit: `https://gudang1-api.onrender.com/api/test-connection`
   - Should return success message

2. **Test Frontend**
   - Visit your Netlify URL
   - Try logging in with your credentials
   - Test creating and approving requests

## Cost Estimation

### AWS RDS (Free Tier)
- **db.t3.micro**: Free for 12 months
- **Storage**: 20 GB free
- **After free tier**: ~$15-25/month

### Render
- **Free tier**: Available with limitations
- **Starter plan**: $7/month

### Netlify
- **Free tier**: 100 GB bandwidth/month
- **Pro plan**: $19/month (if needed)

## Security Best Practices

1. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict security group access
   - Enable automated backups

2. **Application Security**
   - Use environment variables for secrets
   - Enable HTTPS on all services
   - Implement proper authentication
   - Monitor access logs

## Monitoring and Maintenance

1. **AWS CloudWatch**
   - Monitor RDS performance
   - Set up alerts for high CPU/memory usage

2. **Render Monitoring**
   - Check application logs
   - Monitor response times

3. **Regular Backups**
   - AWS RDS automated backups
   - Test backup restoration process

## Troubleshooting

### Database Connection Issues
- Check security group rules
- Verify endpoint and credentials
- Test connection from local machine first

### Application Errors
- Check Render logs
- Verify environment variables
- Test API endpoints individually

### CORS Issues
- Ensure CORS_ORIGIN matches your frontend URL
- Check for typos in URLs

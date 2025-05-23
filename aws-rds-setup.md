# AWS RDS MySQL Setup Guide

This guide will walk you through setting up an AWS RDS MySQL database for your application.

## Prerequisites

- AWS Account (create one at https://aws.amazon.com/)
- AWS CLI installed (optional but recommended)
- Your local MySQL database with existing data

## Step 1: Create AWS RDS MySQL Instance

### 1.1 Access AWS RDS Console

1. Log in to your AWS Console
2. Navigate to RDS service (search for "RDS" in the services)
3. Click "Create database"

### 1.2 Choose Database Creation Method

- Select "Standard create" for more configuration options
- Choose "MySQL" as the engine type
- Select the latest MySQL version (8.0.x recommended)

### 1.3 Configure Database Settings

**Templates:**
- For production: Choose "Production"
- For development/testing: Choose "Free tier" (if eligible)

**Settings:**
- DB instance identifier: `gudang1-db` (or your preferred name)
- Master username: `admin` (or your preferred username)
- Master password: Create a strong password and save it securely

### 1.4 DB Instance Configuration

**DB Instance Class:**
- For free tier: `db.t3.micro`
- For production: `db.t3.small` or higher based on your needs

**Storage:**
- Storage type: General Purpose SSD (gp2)
- Allocated storage: 20 GB (minimum, can be increased later)
- Enable storage autoscaling if needed

### 1.5 Connectivity Settings

**Virtual Private Cloud (VPC):**
- Use default VPC or create a new one
- Subnet group: Default

**Public Access:**
- Choose "Yes" to allow connections from outside AWS
- Note: For production, consider using VPC and private subnets

**VPC Security Group:**
- Create new security group or use existing
- Name: `gudang1-db-sg`

**Database Port:**
- Keep default: 3306

### 1.6 Database Authentication

- Choose "Password authentication"

### 1.7 Additional Configuration

**Initial Database Name:**
- Enter: `gudang1`

**Backup:**
- Enable automated backups
- Backup retention period: 7 days (or as needed)

**Monitoring:**
- Enable Enhanced monitoring if desired

**Maintenance:**
- Enable auto minor version upgrade
- Set maintenance window to a low-traffic time

### 1.8 Create the Database

1. Review all settings
2. Click "Create database"
3. Wait for the database to be created (this may take 10-20 minutes)

## Step 2: Configure Security Group

### 2.1 Edit Security Group Rules

1. Go to EC2 Console > Security Groups
2. Find your RDS security group (e.g., `gudang1-db-sg`)
3. Click on the security group
4. Go to "Inbound rules" tab
5. Click "Edit inbound rules"

### 2.2 Add Inbound Rules

Add the following rules:

**Rule 1: MySQL/Aurora**
- Type: MySQL/Aurora
- Protocol: TCP
- Port Range: 3306
- Source: Your IP address (for testing from local machine)

**Rule 2: MySQL/Aurora (for your backend server)**
- Type: MySQL/Aurora
- Protocol: TCP
- Port Range: 3306
- Source: 0.0.0.0/0 (for cloud-hosted backend)
- Note: For production, restrict this to your backend server's IP range

## Step 3: Get Connection Details

After your RDS instance is created:

1. Go to RDS Console
2. Click on your database instance
3. Note down the following details:
   - **Endpoint**: (e.g., `gudang1-db.xxxxxxxxx.us-east-1.rds.amazonaws.com`)
   - **Port**: 3306
   - **Database name**: gudang1
   - **Username**: admin (or what you set)
   - **Password**: (what you set during creation)

## Step 4: Test Connection

### 4.1 Test from Local Machine

Use MySQL client to test connection:

```bash
mysql -h gudang1-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -P 3306 -u admin -p gudang1
```

### 4.2 Test from Node.js

Create a test script to verify connection:

```javascript
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'gudang1-db.xxxxxxxxx.us-east-1.rds.amazonaws.com',
      user: 'admin',
      password: 'your-password',
      database: 'gudang1',
      port: 3306
    });
    
    console.log('Connected to AWS RDS MySQL!');
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
```

## Step 5: Import Your Existing Database

### 5.1 Export Local Database

```bash
mysqldump -u root -p gudang1 > gudang1_backup.sql
```

### 5.2 Import to AWS RDS

```bash
mysql -h gudang1-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -P 3306 -u admin -p gudang1 < gudang1_backup.sql
```

## Step 6: Update Application Configuration

Update your environment variables with the AWS RDS connection details:

```env
DB_HOST=gudang1-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-rds-password
DB_NAME=gudang1
DB_PORT=3306
```

## Security Best Practices

1. **Use Strong Passwords**: Use complex passwords for your RDS instance
2. **Restrict Access**: Limit security group rules to specific IP ranges
3. **Enable SSL**: Configure SSL connections for data in transit
4. **Regular Backups**: Ensure automated backups are enabled
5. **Monitor Access**: Use AWS CloudTrail to monitor database access
6. **Use IAM**: Consider using IAM database authentication for enhanced security

## Cost Optimization

1. **Right-size Instances**: Start with smaller instances and scale as needed
2. **Use Reserved Instances**: For production workloads, consider reserved instances
3. **Monitor Usage**: Use AWS CloudWatch to monitor database performance
4. **Delete Unused Resources**: Remove test databases when not needed

## Troubleshooting

### Connection Issues
- Check security group rules
- Verify endpoint and port
- Ensure database is in "Available" state
- Check VPC and subnet configuration

### Performance Issues
- Monitor CloudWatch metrics
- Consider upgrading instance class
- Optimize database queries
- Enable Performance Insights

### Backup and Recovery
- Test backup restoration process
- Set appropriate backup retention period
- Consider point-in-time recovery options

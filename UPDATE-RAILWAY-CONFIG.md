# Update Railway Configuration

## Your Railway Connection Details

After creating your Railway MySQL service, you'll get connection details like:

```
MYSQL_HOST=containers-us-west-123.railway.app
MYSQL_PORT=6543
MYSQL_USER=root
MYSQL_PASSWORD=abc123def456ghi789
MYSQL_DATABASE=railway
```

## Update server/.env File

Replace the example values in `server/.env` with your actual Railway details:

```env
DB_HOST=containers-us-west-123.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=abc123def456ghi789
DB_NAME=railway
```

## Create Your Database

After updating the configuration, you need to create your `gudang1` database:

1. **Connect to Railway MySQL**:
   ```bash
   mysql -h containers-us-west-123.railway.app -P 6543 -u root -p
   ```

2. **Create your database**:
   ```sql
   CREATE DATABASE gudang1;
   USE gudang1;
   ```

3. **Update your .env to use gudang1**:
   ```env
   DB_NAME=gudang1
   AWS_RDS_DATABASE=gudang1
   ```

## Test Connection

After updating the configuration:

```bash
cd server
node test-aws-rds.js
```

## Migrate Data

If connection test passes:

```bash
cd server
node migrate-to-aws-rds.js
```

Then import:

```bash
mysql -h your-railway-host -P your-port -u root -p gudang1 < aws-rds-migration/complete_migration.sql
```

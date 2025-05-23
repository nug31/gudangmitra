# db4free.net Setup - Step by Step

## Step 1: Create db4free.net Account

1. **Go to**: https://www.db4free.net/
2. **Click**: "Create account"
3. **Fill the form**:
   - Database name: `gudang1`
   - Username: Choose your username (e.g., `gudang1user`)
   - Password: Choose a strong password
   - Email: Your email address
4. **Submit** the form
5. **Check your email** and click the verification link

## Step 2: Update Configuration

After creating your account, update the file `server/.env`:

1. **Open**: `server/.env` file
2. **Replace**:
   - `your-db4free-username` → Your actual username
   - `your-db4free-password` → Your actual password

**Example**:
```env
DB_HOST=db4free.net
DB_USER=gudang1user
DB_PASSWORD=mypassword123
DB_NAME=gudang1
```

## Step 3: Test Connection

Run this command to test your connection:
```bash
cd server
node test-aws-rds.js
```

**Expected output**: ✅ Successfully connected to database!

## Step 4: Migrate Your Data

If connection test passes, migrate your data:
```bash
cd server
node migrate-to-aws-rds.js
```

This will create SQL files in `server/aws-rds-migration/` folder.

## Step 5: Import Data

Import your data to db4free.net:
```bash
mysql -h db4free.net -P 3306 -u your-username -p gudang1 < server/aws-rds-migration/complete_migration.sql
```

Replace `your-username` with your actual db4free.net username.

## Step 6: Verify Import

Check if your data was imported successfully:
```bash
mysql -h db4free.net -P 3306 -u your-username -p
```

Then run:
```sql
USE gudang1;
SHOW TABLES;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM users;
```

## Alternative: phpMyAdmin

You can also manage your database through the web interface:
- **URL**: https://www.db4free.net/phpMyAdmin/
- **Username**: Your db4free.net username
- **Password**: Your db4free.net password

## Important Notes

- ⚠️ **Storage Limit**: 200MB maximum
- ⚠️ **Performance**: Slower than paid services (shared hosting)
- ⚠️ **Reliability**: Good for development, not production
- ✅ **Cost**: Completely free forever
- ✅ **No Credit Card**: Required

## Troubleshooting

### Connection Issues:
- Double-check username and password
- Make sure you verified your email
- Try connecting via phpMyAdmin first

### Slow Performance:
- This is normal for free shared hosting
- Keep queries simple
- Use LIMIT in your queries

### Storage Issues:
- Monitor your database size
- Your current database has 200+ items, should fit in 200MB
- Use this query to check size:
```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'gudang1'
GROUP BY table_schema;
```

## Next Steps After Setup

1. **Test your application** with the new database
2. **Deploy your backend** (Netlify Functions recommended for db4free.net)
3. **Deploy your frontend** to Netlify
4. **Monitor performance** and database usage

## Need Help?

- Check `db4free-setup.md` for detailed information
- Visit db4free.net documentation
- Test connection with `node test-aws-rds.js`

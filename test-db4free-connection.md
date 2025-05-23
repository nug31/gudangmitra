# Test db4free.net MySQL Connection

## Quick Test Commands

1. **Test Connection**:
   ```bash
   cd server
   node test-aws-rds.js
   ```

2. **If connection works, migrate data**:
   ```bash
   cd server
   node migrate-to-aws-rds.js
   ```

3. **Import data to db4free.net**:
   ```bash
   mysql -h db4free.net -P 3306 -u gudang1user -p gudang1 < aws-rds-migration/complete_migration.sql
   ```

## Manual Connection Test

Test manually using MySQL client:

```bash
mysql -h db4free.net -P 3306 -u gudang1user -p
```

Then:
```sql
USE gudang1;
SHOW TABLES;
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'gudang1';
```

## Check Database Size

Monitor your storage usage:
```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'gudang1'
GROUP BY table_schema;
```

## phpMyAdmin Access

You can also manage your database via web interface:
- URL: https://www.db4free.net/phpMyAdmin/
- Username: gudang1user
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

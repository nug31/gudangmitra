# AWS RDS Migration Instructions

## Files Generated

1. **schema.sql** - Database schema (tables, indexes, etc.)
2. **data.sql** - All table data
3. **complete_migration.sql** - Combined schema and data

## Migration Steps

### Option 1: Using MySQL Command Line

1. **Import the complete migration file:**
   ```bash
   mysql -h nozomi.proxy.rlwy.net -P 21817 -u root -p < complete_migration.sql
   ```

2. **Or import schema and data separately:**
   ```bash
   # Import schema first
   mysql -h nozomi.proxy.rlwy.net -P 21817 -u root -p < schema.sql
   
   # Then import data
   mysql -h nozomi.proxy.rlwy.net -P 21817 -u root -p < data.sql
   ```

### Option 2: Using MySQL Workbench

1. Connect to your AWS RDS instance
2. Open and execute the `complete_migration.sql` file

### Option 3: Using phpMyAdmin or similar tools

1. Connect to your AWS RDS instance
2. Import the `complete_migration.sql` file

## After Migration

1. **Update your application configuration:**
   ```env
   DB_HOST=nozomi.proxy.rlwy.net
   DB_USER=root
   DB_PASSWORD=pvOcQbzlDAobtcdozbMvCdIDDEmenwkO
   DB_NAME=gudang1
   DB_PORT=21817
   ```

2. **Test your application connection**

3. **Update your deployment environment variables**

## Verification

After migration, verify that:
- All tables are created
- All data is imported correctly
- Your application can connect and function properly

## Troubleshooting

- Ensure your AWS RDS security group allows connections from your IP
- Check that the RDS instance is in "Available" state
- Verify your connection credentials
- Check for any SQL syntax errors in the migration files

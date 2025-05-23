/**
 * Database Export Script
 *
 * This script exports the database schema and data to SQL files
 * that can be used to recreate the database on another server.
 *
 * Usage: node export-database.js
 *
 * Note: This script uses CommonJS modules since it's in the server directory.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// Load environment variables
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gudang1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
};

// Output directory
const outputDir = path.join(__dirname, 'db-export');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper function to log with colors
function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

// Main export function
async function exportDatabase() {
  let connection;

  try {
    log('Connecting to database...', '\x1b[36m');
    connection = await mysql.createConnection(dbConfig);
    log('Connected successfully!', '\x1b[32m');

    // Get all tables
    log('Fetching table list...', '\x1b[36m');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    log(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`, '\x1b[32m');

    // Export schema
    log('Exporting database schema...', '\x1b[36m');
    let schemaSQL = '';

    for (const tableName of tableNames) {
      const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
      schemaSQL += `${createTable[0]['Create Table']};\n\n`;
    }

    await writeFileAsync(path.join(outputDir, 'schema.sql'), schemaSQL);
    log('Schema exported successfully!', '\x1b[32m');

    // Export data
    log('Exporting table data...', '\x1b[36m');

    for (const tableName of tableNames) {
      log(`Exporting data from table: ${tableName}...`, '\x1b[36m');

      // Get table data
      const [rows] = await connection.query(`SELECT * FROM ${tableName}`);

      if (rows.length === 0) {
        log(`Table ${tableName} is empty, skipping...`, '\x1b[33m');
        continue;
      }

      // Generate INSERT statements
      let dataSQL = `-- Data for table ${tableName}\n`;
      dataSQL += `INSERT INTO ${tableName} VALUES\n`;

      const values = rows.map(row => {
        const rowValues = Object.values(row).map(value => {
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
          return value;
        });
        return `(${rowValues.join(', ')})`;
      });

      dataSQL += values.join(',\n') + ';\n\n';

      await writeFileAsync(path.join(outputDir, `${tableName}_data.sql`), dataSQL);
      log(`Exported ${rows.length} rows from ${tableName}`, '\x1b[32m');
    }

    // Create combined file
    log('Creating combined export file...', '\x1b[36m');
    let combinedSQL = `-- Database export for ${dbConfig.database}\n`;
    combinedSQL += `-- Generated on ${new Date().toISOString()}\n\n`;
    combinedSQL += `-- Create database if it doesn't exist\n`;
    combinedSQL += `CREATE DATABASE IF NOT EXISTS ${dbConfig.database};\n`;
    combinedSQL += `USE ${dbConfig.database};\n\n`;
    combinedSQL += schemaSQL;

    for (const tableName of tableNames) {
      const dataFilePath = path.join(outputDir, `${tableName}_data.sql`);
      if (fs.existsSync(dataFilePath)) {
        combinedSQL += fs.readFileSync(dataFilePath, 'utf8');
      }
    }

    await writeFileAsync(path.join(outputDir, 'full_export.sql'), combinedSQL);
    log('Combined export file created successfully!', '\x1b[32m');

    log('\nDatabase export completed successfully!', '\x1b[32m');
    log(`Export files are located in: ${outputDir}`, '\x1b[36m');
    log('Files created:', '\x1b[36m');
    log(`  - schema.sql: Database schema`, '\x1b[36m');
    log(`  - [table]_data.sql: Data for each table`, '\x1b[36m');
    log(`  - full_export.sql: Combined schema and data`, '\x1b[36m');

  } catch (error) {
    log(`Error exporting database: ${error.message}`, '\x1b[31m');
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      log('Database connection closed', '\x1b[36m');
    }
  }
}

// Run the export
exportDatabase();

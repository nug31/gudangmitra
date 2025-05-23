const mysql = require('mysql2/promise');

async function updateItemsSchema() {
  let connection;
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gudang1'
    });

    console.log('Connected to database');

    // Alter the category column from ENUM to VARCHAR
    await connection.query(`
      ALTER TABLE items 
      MODIFY COLUMN category VARCHAR(50) NOT NULL DEFAULT 'other'
    `);
    
    console.log('Successfully updated items table schema - category column is now VARCHAR(50)');

    // Verify the change
    const [rows] = await connection.query('DESCRIBE items');
    const categoryColumn = rows.find(row => row.Field === 'category');
    console.log('Updated category column:', categoryColumn);

  } catch (err) {
    console.error('Error updating items schema:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update
updateItemsSchema();

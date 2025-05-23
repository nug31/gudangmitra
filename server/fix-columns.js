const mysql = require('mysql2/promise');

async function fixColumns() {
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

    // Fix the category column
    await connection.query(`
      ALTER TABLE items 
      MODIFY COLUMN category VARCHAR(50) NOT NULL DEFAULT 'other'
    `);
    console.log('Successfully updated category column to VARCHAR(50)');

    // Fix the status column
    await connection.query(`
      ALTER TABLE items 
      MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'in-stock'
    `);
    console.log('Successfully updated status column to VARCHAR(20)');

    // Verify the changes
    const [columns] = await connection.query('DESCRIBE items');
    const categoryColumn = columns.find(col => col.Field === 'category');
    const statusColumn = columns.find(col => col.Field === 'status');
    
    console.log('Updated category column:', categoryColumn);
    console.log('Updated status column:', statusColumn);

  } catch (err) {
    console.error('Error updating columns:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update
fixColumns();

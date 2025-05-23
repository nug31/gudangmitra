const mysql = require('mysql2/promise');

async function updateStatusColumn() {
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

    // Check if status column exists and its current type
    const [columns] = await connection.query('DESCRIBE items');
    const statusColumn = columns.find(col => col.Field === 'status');
    
    console.log('Current status column:', statusColumn);

    if (statusColumn && statusColumn.Type.startsWith('enum')) {
      // Alter the status column from ENUM to VARCHAR
      await connection.query(`
        ALTER TABLE items 
        MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'in-stock'
      `);
      
      console.log('Successfully updated items table schema - status column is now VARCHAR(20)');

      // Verify the change
      const [updatedColumns] = await connection.query('DESCRIBE items');
      const updatedStatusColumn = updatedColumns.find(col => col.Field === 'status');
      console.log('Updated status column:', updatedStatusColumn);
    } else if (!statusColumn) {
      console.log('Status column does not exist');
    } else {
      console.log('Status column is already not an ENUM, no changes needed');
    }

  } catch (err) {
    console.error('Error updating status column:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update
updateStatusColumn();

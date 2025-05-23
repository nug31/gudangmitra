const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gudang1',
  multipleStatements: true
};

async function createRequestItemsTable() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected to the database');
    
    // Create request_items table
    console.log('Creating request_items table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS request_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id VARCHAR(36) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES requests(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      )
    `);
    
    console.log('request_items table created successfully');
    
  } catch (error) {
    console.error('Error creating request_items table:', error);
  } finally {
    // Close connection if it was established
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
createRequestItemsTable();

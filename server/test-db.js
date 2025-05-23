const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gudang1'
};

async function testDatabase() {
  let connection;
  try {
    // Create connection
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully!');
    
    // Test query to get all items
    console.log('Fetching items...');
    const [items] = await connection.query('SELECT * FROM items');
    console.log(`Found ${items.length} items:`);
    
    // Print each item
    items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, item);
    });
    
    // Get table structure
    console.log('\nGetting table structure...');
    const [columns] = await connection.query('DESCRIBE items');
    console.log('Table columns:', columns.map(col => col.Field));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close connection if it was established
    if (connection) {
      console.log('Closing connection...');
      await connection.end();
      console.log('Connection closed.');
    }
  }
}

// Run the test
testDatabase();

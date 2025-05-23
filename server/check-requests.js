const mysql = require('mysql2/promise');

async function checkRequests() {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gudang1',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('Connected to database successfully!');
    console.log('Fetching requests...');
    
    const [requests] = await pool.query('SELECT * FROM requests LIMIT 10');
    console.log(`Found ${requests.length} requests:`);
    
    if (requests.length > 0) {
      requests.forEach((req, index) => {
        console.log(`Request ${index + 1}:`, req);
      });
    } else {
      console.log('No requests found in the database.');
      
      // Check if the requests table exists
      console.log('Checking if requests table exists...');
      const [tables] = await pool.query('SHOW TABLES LIKE "requests"');
      if (tables.length === 0) {
        console.log('The requests table does not exist in the database.');
      } else {
        console.log('The requests table exists but is empty.');
      }
    }
    
    console.log('Closing connection...');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('Connection closed.');
    }
  }
}

checkRequests();

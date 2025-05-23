const mysql = require('mysql2/promise');

async function getRequestIds() {
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
    
    // Get all request IDs
    console.log('Getting all request IDs...');
    const [requests] = await pool.query(`
      SELECT r.id, r.project_name, i.name as item_name
      FROM requests r
      LEFT JOIN request_items ri ON r.id = ri.request_id
      LEFT JOIN items i ON ri.item_id = i.id
      ORDER BY r.id
    `);
    
    console.log(`Found ${requests.length} requests:`);
    
    requests.forEach((req) => {
      console.log(`ID: ${req.id}, Project: ${req.project_name}, Item: ${req.item_name || 'N/A'}`);
    });
    
    console.log('\nDirect links to request details:');
    requests.forEach((req) => {
      console.log(`http://localhost:5178/requests/${req.id}`);
    });
    
    console.log('\nClosing connection...');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('Connection closed.');
    }
  }
}

getRequestIds();

const mysql = require('mysql2/promise');

async function checkMouseRequest() {
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
    
    // Check if there are any requests with "Mouse" in the name
    console.log('Checking for requests with "Mouse" in the name...');
    const [requests] = await pool.query(`
      SELECT r.*, ri.*, i.name as item_name
      FROM requests r
      JOIN request_items ri ON r.id = ri.request_id
      JOIN items i ON ri.item_id = i.id
      WHERE i.name LIKE '%Mouse%'
    `);
    
    console.log(`Found ${requests.length} requests with "Mouse" in the name:`);
    
    if (requests.length > 0) {
      requests.forEach((req, index) => {
        console.log(`Request ${index + 1}:`, req);
      });
    } else {
      console.log('No requests found with "Mouse" in the name.');
      
      // Check if there are any items with "Mouse" in the name
      console.log('Checking if there are any items with "Mouse" in the name...');
      const [items] = await pool.query(`
        SELECT * FROM items WHERE name LIKE '%Mouse%'
      `);
      
      if (items.length > 0) {
        console.log(`Found ${items.length} items with "Mouse" in the name:`);
        items.forEach((item, index) => {
          console.log(`Item ${index + 1}:`, item);
        });
        
        // Create a request for the first mouse item
        if (items.length > 0) {
          console.log('Creating a request for the first mouse item...');
          
          // First, get a user ID to use as the requester
          const [users] = await pool.query(`SELECT id FROM users LIMIT 1`);
          const userId = users.length > 0 ? users[0].id : 1;
          
          // Insert the request
          const [result] = await pool.query(`
            INSERT INTO requests (requester_id, status, priority, reason, created_at, updated_at)
            VALUES (?, 'pending', 'medium', 'Need a new mouse', NOW(), NOW())
          `, [userId]);
          
          const requestId = result.insertId;
          console.log(`Created request with ID ${requestId}`);
          
          // Insert the request item
          await pool.query(`
            INSERT INTO request_items (request_id, item_id, quantity)
            VALUES (?, ?, 1)
          `, [requestId, items[0].id]);
          
          console.log(`Added item ${items[0].name} to request ${requestId}`);
          
          // Get the created request
          const [createdRequest] = await pool.query(`
            SELECT r.*, ri.*, i.name as item_name
            FROM requests r
            JOIN request_items ri ON r.id = ri.request_id
            JOIN items i ON ri.item_id = i.id
            WHERE r.id = ?
          `, [requestId]);
          
          console.log('Created request:', createdRequest[0]);
        }
      } else {
        console.log('No items found with "Mouse" in the name.');
        
        // Create a mouse item
        console.log('Creating a mouse item...');
        const [result] = await pool.query(`
          INSERT INTO items (name, description, category, quantity, status, created_at, updated_at)
          VALUES ('Mouse', 'Computer mouse', 'Electronics', 10, 'available', NOW(), NOW())
        `);
        
        const itemId = result.insertId;
        console.log(`Created item with ID ${itemId}`);
        
        // Get a user ID to use as the requester
        const [users] = await pool.query(`SELECT id FROM users LIMIT 1`);
        const userId = users.length > 0 ? users[0].id : 1;
        
        // Create a request for the mouse
        const [requestResult] = await pool.query(`
          INSERT INTO requests (requester_id, status, priority, reason, created_at, updated_at)
          VALUES (?, 'pending', 'medium', 'Need a new mouse', NOW(), NOW())
        `, [userId]);
        
        const requestId = requestResult.insertId;
        console.log(`Created request with ID ${requestId}`);
        
        // Insert the request item
        await pool.query(`
          INSERT INTO request_items (request_id, item_id, quantity)
          VALUES (?, ?, 1)
        `, [requestId, itemId]);
        
        console.log(`Added item Mouse to request ${requestId}`);
        
        // Get the created request
        const [createdRequest] = await pool.query(`
          SELECT r.*, ri.*, i.name as item_name
          FROM requests r
          JOIN request_items ri ON r.id = ri.request_id
          JOIN items i ON ri.item_id = i.id
          WHERE r.id = ?
        `, [requestId]);
        
        console.log('Created request:', createdRequest[0]);
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

checkMouseRequest();

const mysql = require('mysql2/promise');

async function checkRequestItems() {
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
    
    // Check if request_items table exists
    console.log('Checking if request_items table exists...');
    const [tables] = await pool.query('SHOW TABLES LIKE "request_items"');
    
    if (tables.length === 0) {
      console.log('The request_items table does not exist in the database.');
      
      // Create the table
      console.log('Creating request_items table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS request_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          request_id VARCHAR(36) NOT NULL,
          item_id INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('request_items table created successfully.');
      
      // Add foreign key constraints
      console.log('Adding foreign key constraints...');
      try {
        await pool.query(`
          ALTER TABLE request_items 
          ADD CONSTRAINT fk_request_id 
          FOREIGN KEY (request_id) REFERENCES requests(id)
        `);
        
        await pool.query(`
          ALTER TABLE request_items 
          ADD CONSTRAINT fk_item_id 
          FOREIGN KEY (item_id) REFERENCES items(id)
        `);
        
        console.log('Foreign key constraints added successfully.');
      } catch (constraintError) {
        console.error('Error adding foreign key constraints:', constraintError);
        console.log('Continuing without foreign key constraints.');
      }
      
      // Insert sample data
      console.log('Inserting sample data into request_items...');
      
      // First get some request IDs
      const [requests] = await pool.query('SELECT id FROM requests LIMIT 5');
      
      if (requests.length > 0) {
        for (const request of requests) {
          // Get a random item ID
          const [items] = await pool.query('SELECT id FROM items WHERE isActive = 1 LIMIT 1 OFFSET 5');
          
          if (items.length > 0) {
            const itemId = items[0].id;
            
            await pool.query(`
              INSERT INTO request_items (request_id, item_id, quantity)
              VALUES (?, ?, ?)
            `, [request.id, itemId, Math.floor(Math.random() * 5) + 1]);
          }
        }
        
        console.log('Sample data inserted successfully.');
      } else {
        console.log('No requests found, skipping sample data insertion.');
      }
    } else {
      console.log('The request_items table exists.');
      
      // Check if there's data in the table
      const [items] = await pool.query('SELECT * FROM request_items LIMIT 10');
      
      console.log(`Found ${items.length} request items:`);
      
      if (items.length > 0) {
        items.forEach((item, index) => {
          console.log(`Item ${index + 1}:`, item);
        });
      } else {
        console.log('No request items found in the table.');
        
        // Insert sample data
        console.log('Inserting sample data into request_items...');
        
        // First get some request IDs
        const [requests] = await pool.query('SELECT id FROM requests LIMIT 5');
        
        if (requests.length > 0) {
          for (const request of requests) {
            // Get a random item ID
            const [items] = await pool.query('SELECT id FROM items WHERE isActive = 1 LIMIT 1 OFFSET 5');
            
            if (items.length > 0) {
              const itemId = items[0].id;
              
              await pool.query(`
                INSERT INTO request_items (request_id, item_id, quantity)
                VALUES (?, ?, ?)
              `, [request.id, itemId, Math.floor(Math.random() * 5) + 1]);
            }
          }
          
          console.log('Sample data inserted successfully.');
        } else {
          console.log('No requests found, skipping sample data insertion.');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (pool) {
      console.log('Closing connection...');
      await pool.end();
      console.log('Connection closed.');
    }
  }
}

checkRequestItems();

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

async function setupLoanSystem() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!');

    // Create loans table
    console.log('\n📋 Creating loans table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS loans (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        status ENUM('active', 'returned', 'overdue') NOT NULL DEFAULT 'active',
        borrowed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date DATE NOT NULL,
        returned_date TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      )
    `);
    console.log('✅ Loans table created successfully!');

    // Add indexes
    console.log('\n🔍 Creating indexes...');
    
    try {
      await connection.execute('CREATE INDEX idx_loans_user_id ON loans(user_id)');
      console.log('✅ User ID index created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  User ID index already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute('CREATE INDEX idx_loans_item_id ON loans(item_id)');
      console.log('✅ Item ID index created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Item ID index already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute('CREATE INDEX idx_loans_status ON loans(status)');
      console.log('✅ Status index created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Status index already exists');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute('CREATE INDEX idx_loans_due_date ON loans(due_date)');
      console.log('✅ Due date index created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Due date index already exists');
      } else {
        throw error;
      }
    }

    // Add borrowed_quantity column to items table
    console.log('\n📦 Adding borrowed_quantity column to items table...');
    try {
      await connection.execute('ALTER TABLE items ADD COLUMN borrowed_quantity INT DEFAULT 0 AFTER quantity');
      console.log('✅ borrowed_quantity column added successfully!');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  borrowed_quantity column already exists');
      } else {
        throw error;
      }
    }

    // Initialize borrowed_quantity for existing items
    console.log('\n🔄 Initializing borrowed_quantity for existing items...');
    const [result] = await connection.execute('UPDATE items SET borrowed_quantity = 0 WHERE borrowed_quantity IS NULL');
    console.log(`✅ Updated ${result.affectedRows} items with borrowed_quantity = 0`);

    // Verify setup
    console.log('\n🔍 Verifying setup...');
    
    // Check loans table structure
    const [loansStructure] = await connection.execute('DESCRIBE loans');
    console.log('✅ Loans table structure verified');
    
    // Check items table for borrowed_quantity column
    const [itemsStructure] = await connection.execute('DESCRIBE items');
    const hasBorrowedQuantity = itemsStructure.some(col => col.Field === 'borrowed_quantity');
    if (hasBorrowedQuantity) {
      console.log('✅ Items table has borrowed_quantity column');
    } else {
      console.log('❌ Items table missing borrowed_quantity column');
    }

    // Check indexes
    const [indexes] = await connection.execute('SHOW INDEX FROM loans');
    console.log(`✅ Found ${indexes.length} indexes on loans table`);

    console.log('\n🎉 Loan system setup completed successfully!');
    console.log('\n📋 What you can do now:');
    console.log('   • Browse electronics items and click "Borrow"');
    console.log('   • Set due dates up to 30 days');
    console.log('   • Track loans in the "Loans" page');
    console.log('   • Return items when done');
    console.log('   • Admins can see all loans and overdue items');

  } catch (error) {
    console.error('❌ Error setting up loan system:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Please check:');
      console.log('   • Database server is running');
      console.log('   • Connection details in .env file are correct');
      console.log('   • Network connectivity to database');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied. Please check:');
      console.log('   • Database username and password are correct');
      console.log('   • User has necessary permissions');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database not found. Please check:');
      console.log('   • Database name is correct');
      console.log('   • Database exists on the server');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup
console.log('🚀 Starting loan system setup...');
console.log('📊 Database:', dbConfig.database);
console.log('🏠 Host:', dbConfig.host);
console.log('👤 User:', dbConfig.user);

setupLoanSystem();

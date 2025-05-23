const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gudang1'
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('Setting up database...');
    
    // Create a connection
    connection = await mysql.createConnection(dbConfig);
    
    // Check if users table exists
    const [tables] = await connection.query('SHOW TABLES LIKE "users"');
    
    if (tables.length === 0) {
      console.log('Creating users table...');
      
      // Create users table
      await connection.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(100) NOT NULL,
          role ENUM('admin', 'user') DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Users table created successfully');
      
      // Insert sample users
      console.log('Inserting sample users...');
      
      await connection.query(`
        INSERT INTO users (name, email, password, role) VALUES
        ('Admin User', 'admin@example.com', 'admin123', 'admin'),
        ('Regular User', 'user@example.com', 'user123', 'user'),
        ('Manager', 'manager@gudangmitra.com', 'password123', 'admin')
      `);
      
      console.log('Sample users inserted successfully');
    } else {
      console.log('Users table already exists');
      
      // Check if we need to add the manager user
      const [managerExists] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        ['manager@gudangmitra.com']
      );
      
      if (managerExists.length === 0) {
        console.log('Adding manager user...');
        
        await connection.query(`
          INSERT INTO users (name, email, password, role) VALUES
          ('Manager', 'manager@gudangmitra.com', 'password123', 'admin')
        `);
        
        console.log('Manager user added successfully');
      } else {
        console.log('Manager user already exists');
      }
    }
    
    // List all users
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    
    console.log('\nUsers in the database:');
    users.forEach(user => {
      console.log(`${user.id}: ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\nDatabase setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase();

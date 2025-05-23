const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function testDashboard() {
  try {
    console.log('Testing dashboard queries...');
    
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 10,
      ssl: process.env.DB_SSL === 'true' ? {} : false
    });

    console.log('Database pool created');

    // Test user statistics
    console.log('\n1. Testing user statistics...');
    const [userStats] = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count
      FROM users
    `);
    console.log('User stats:', userStats[0]);

    // Test item statistics
    console.log('\n2. Testing item statistics...');
    const [itemStats] = await pool.query(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COUNT(CASE WHEN quantity <= minQuantity THEN 1 END) as low_stock_items
      FROM items
    `);
    console.log('Item stats:', itemStats[0]);

    // Test category count
    console.log('\n3. Testing category count...');
    const [categoryStats] = await pool.query(`
      SELECT COUNT(*) as total_categories FROM categories
    `);
    console.log('Category stats:', categoryStats[0]);

    // Test request statistics
    console.log('\n4. Testing request statistics...');
    const [requestStats] = await pool.query(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied_count,
        SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled_count
      FROM requests
    `);
    console.log('Request stats:', requestStats[0]);

    console.log('\n✅ All dashboard queries work correctly!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error testing dashboard:', error);
  }
}

testDashboard();

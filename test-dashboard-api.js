const https = require('https');

console.log('🔍 Testing Dashboard API...');

const url = 'https://gudangmitra-production.up.railway.app/api/dashboard/stats';

https.get(url, (res) => {
  console.log(`📡 Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\n✅ Dashboard API Response:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Total Users: ${parsed.totalUsers} (${typeof parsed.totalUsers})`);
      console.log(`📦 Total Items: ${parsed.totalItems} (${typeof parsed.totalItems})`);
      console.log(`📋 Total Requests: ${parsed.totalRequests} (${typeof parsed.totalRequests})`);
      console.log(`⏳ Pending: ${parsed.requestsByStatus.pending} (${typeof parsed.requestsByStatus.pending})`);
      console.log(`✅ Approved: ${parsed.requestsByStatus.approved} (${typeof parsed.requestsByStatus.approved})`);
      console.log(`📈 Recent (7d): ${parsed.recentRequests} (${typeof parsed.recentRequests})`);
      console.log(`⚠️ Low Stock: ${parsed.lowStockItems} (${typeof parsed.lowStockItems})`);
      console.log(`📊 Total Quantity: ${parsed.totalQuantity} (${typeof parsed.totalQuantity})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Check if all values are numbers
      const allNumbers = [
        parsed.totalUsers,
        parsed.totalItems,
        parsed.totalRequests,
        parsed.requestsByStatus.pending,
        parsed.requestsByStatus.approved,
        parsed.recentRequests,
        parsed.lowStockItems,
        parsed.totalQuantity
      ].every(val => typeof val === 'number');
      
      if (allNumbers) {
        console.log('🎉 SUCCESS: All values are proper numbers!');
      } else {
        console.log('⚠️ WARNING: Some values are not numbers');
      }
      
    } catch (error) {
      console.log('❌ JSON Parse Error:', error.message);
      console.log('Raw response:', data.substring(0, 200) + '...');
    }
  });
  
}).on('error', (err) => {
  console.log('❌ Request Error:', err.message);
});

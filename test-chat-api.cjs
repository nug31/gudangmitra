const https = require('https');

const data = JSON.stringify({
  message: "Bagaimana cara menggunakan aplikasi ini?",
  sessionId: "test123"
});

const options = {
  hostname: 'gudangmitra-production.up.railway.app',
  port: 443,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing chat API...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse:');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.success && parsed.message) {
        console.log('\n✅ Chat API is working!');
        console.log('AI Response:', parsed.message.content);
      } else {
        console.log('\n❌ Chat API returned error:', parsed.message);
      }
    } catch (error) {
      console.log('Raw response:', responseData);
      console.log('Parse error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();

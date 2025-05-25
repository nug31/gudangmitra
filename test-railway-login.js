// Test different login credentials against Railway database

const testCredentials = [
  { email: 'manager@gudangmitra.com', password: 'password123' },
  { email: 'admin@gudangmitra.com', password: 'password123' },
  { email: 'nug@gudangmitra.com', password: 'password123' },
  { email: 'nugro@gudangmitra.com', password: 'password123' },
  { email: 'admin@example.com', password: 'password' },
  { email: 'bob@example.com', password: 'password' },
  { email: 'user@example.com', password: 'password' },
  { email: 'test@test.com', password: 'test' },
];

async function testLogin(email, password) {
  try {
    console.log(`\n🧪 Testing: ${email} / ${password}`);
    
    const response = await fetch('https://gudangmitra-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ SUCCESS! User: ${data.user.name} (${data.user.role})`);
      return data.user;
    } else {
      console.log(`❌ Failed: ${data.message}`);
      if (data.debug) {
        console.log(`   Debug: ${data.debug}`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  return null;
}

async function testAllCredentials() {
  console.log('🚀 Testing Railway Database Login Credentials...\n');
  
  for (const cred of testCredentials) {
    const user = await testLogin(cred.email, cred.password);
    if (user) {
      console.log('\n🎉 FOUND WORKING CREDENTIALS!');
      console.log(`Email: ${cred.email}`);
      console.log(`Password: ${cred.password}`);
      console.log(`User: ${user.name} (${user.role})`);
      break;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testAllCredentials();

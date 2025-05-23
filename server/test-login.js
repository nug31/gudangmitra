// Using built-in fetch API

async function testLogin() {
  try {
    console.log('Testing login endpoint...');

    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'manager@gudangmitra.com',
        password: 'password123',
      }),
    });

    console.log(`Response status: ${response.status}`);

    // Get the response text
    const responseText = await response.text();
    console.log(`Response text: ${responseText}`);

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed JSON response:', data);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }

  } catch (error) {
    console.error('Error during test:', error);
  }
}

testLogin();

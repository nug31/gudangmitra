import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function TestLogin() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTestLogin = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      console.log('Testing login...');
      
      const response = await fetch('/api/auth/login', {
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
        setResult(JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        setError(`Failed to parse JSON: ${e.message}\nResponse text: ${responseText}`);
      }
    } catch (error) {
      console.error('Error during test:', error);
      setError(`Error during test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Login</h1>
      <button 
        onClick={handleTestLogin}
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: loading ? '#ccc' : '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Login'}
      </button>
      
      {error && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '5px' }}>
          <pre>{error}</pre>
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '5px' }}>
          <h2>Result:</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestLogin />
  </React.StrictMode>
);

export default TestLogin;

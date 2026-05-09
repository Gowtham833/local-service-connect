async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '1234567890', password: 'password' })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginData.token) {
      console.log('Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('Login success! Fetching /me...');
    
    const meRes = await fetch('http://localhost:5000/api/customer/me', {
      headers: { Authorization: 'Bearer ' + token }
    });
    
    const meData = await meRes.json();
    console.log('Customer /me success:', JSON.stringify(meData, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();

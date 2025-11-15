// Login test to verify the default credentials work
import axios from 'axios';

async function testLogin() {
  try {
    console.log('Testing login with default credentials...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@simplecrm.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
    if (response.data.token) {
      console.log('✅ Token received, testing protected endpoint...');
      
      // Test accessing a protected endpoint with the token
      const profileResponse = await axios.get('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('✅ Protected endpoint access successful!');
      console.log('User data:', profileResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
  }
}

testLogin();
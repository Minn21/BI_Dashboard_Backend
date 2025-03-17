// test.js
const axios = require('axios');
const app = require('./index'); // Import your Express app

let server;
let authToken = '';

async function login() {
  const response = await axios.post(`http://localhost:${PORT}/login`, {
    username: 'admin',
    password: 'password'
  });
  authToken = response.data.data.token;
}

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    server.close(resolve);
  });
}

async function testLongPolling() {
  try {
    await startServer();
    console.log(`Test server running on port ${PORT}`);
    
    await login();

    // Test 1: Initial request with no existing data
    console.log('Test 1: Initial request (should return immediately)');
    const initialResponse = await axios.get(`${BASE_URL}/booking-arrivals`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { lastCheck: 0 }
    });
    
    console.log('Initial response received');
    console.log('- Status:', initialResponse.status);
    console.log('- Data changed?', initialResponse.data.data.currentHour !== 0);
    console.log('- Data structure valid?', 'data' in initialResponse.data.data);

    // Test 2: Request with current data (should wait for timeout)
    console.log('\nTest 2: Long polling timeout (25 seconds)');
    const currentHour = initialResponse.data.data.currentHour;
    
    const timeoutTest = await Promise.race([
      axios.get(`${BASE_URL}/booking-arrivals`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { lastCheck: currentHour }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout exceeded')), 26000)
    )]);

    console.log('Timeout test response received after 25 seconds');
    console.log('- Status:', timeoutTest.status);
    console.log('- Data changed?', timeoutTest.data.data.currentHour !== currentHour);

    // Test 3: Force data change and verify immediate response
    console.log('\nTest 3: Forced data change');
    
    // Force data regeneration by changing the lastGeneratedHour
    const originalHour = app.get('lastGeneratedHour');
    app.set('lastGeneratedHour', originalHour - 1);
    
    const startTime = Date.now();
    const changedResponse = await axios.get(`${BASE_URL}/booking-arrivals`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { lastCheck: currentHour }
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Response received in ${responseTime}ms`);
    console.log('- Immediate response?', responseTime < 1000);
    console.log('- New data hour:', changedResponse.data.data.currentHour);
    console.log('- Data changed?', changedResponse.data.data.currentHour !== currentHour);

    // Test 4: Verify data consistency across endpoints
    console.log('\nTest 4: Data consistency check');
    const endpoints = [
      '/booking-arrivals',
      '/occupancy-and-adr',
      '/total-income'
    ];
    
    for (const endpoint of endpoints) {
      const res1 = await axios.get(BASE_URL + endpoint, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const res2 = await axios.get(BASE_URL + endpoint, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { lastCheck: res1.data.data.currentHour }
      });
      
      console.log(`${endpoint}:`);
      console.log('- Consistent currentHour?', res1.data.data.currentHour === res2.data.data.currentHour);
      console.log('- Same data?', JSON.stringify(res1.data.data.data) === JSON.stringify(res2.data.data.data));
    }

    await stopServer();
    console.log('Server stopped');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests without starting the main server
testLongPolling();
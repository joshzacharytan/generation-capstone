import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const runApiDiagnostics = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Basic connectivity
  try {
    const response = await axios.get(`${API_BASE_URL}/docs`, { timeout: 5000 });
    results.tests.push({
      name: 'Basic Connectivity',
      status: 'PASS',
      message: `Server responded with status ${response.status}`
    });
  } catch (error) {
    results.tests.push({
      name: 'Basic Connectivity',
      status: 'FAIL',
      message: error.message,
      details: {
        code: error.code,
        response: error.response?.status
      }
    });
  }

  // Test 2: CORS preflight
  try {
    await axios.options(`${API_BASE_URL}/store/test/products`, {
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      },
      timeout: 5000
    });
    results.tests.push({
      name: 'CORS Preflight',
      status: 'PASS',
      message: 'CORS preflight successful'
    });
  } catch (error) {
    results.tests.push({
      name: 'CORS Preflight',
      status: 'FAIL',
      message: error.message,
      details: {
        code: error.code,
        response: error.response?.status
      }
    });
  }

  // Test 3: Store API endpoint
  try {
    const response = await axios.get(`${API_BASE_URL}/store/test/products`, { timeout: 5000 });
    results.tests.push({
      name: 'Store API Endpoint',
      status: 'PASS',
      message: `Store API responded with status ${response.status}`
    });
  } catch (error) {
    results.tests.push({
      name: 'Store API Endpoint',
      status: error.response?.status === 404 ? 'EXPECTED' : 'FAIL',
      message: error.response?.status === 404 ? 'Store not found (expected for test store)' : error.message,
      details: {
        code: error.code,
        response: error.response?.status
      }
    });
  }

  return results;
};

export const logDiagnostics = async () => {
  console.log('🔍 Running API Diagnostics...');
  const results = await runApiDiagnostics();
  
  console.log('📊 Diagnostic Results:', results);
  
  const failedTests = results.tests.filter(test => test.status === 'FAIL');
  if (failedTests.length > 0) {
    console.error('❌ Failed Tests:', failedTests);
  } else {
    console.log('✅ All tests passed or behaved as expected');
  }
  
  return results;
};
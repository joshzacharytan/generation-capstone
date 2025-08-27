// Run this in the browser console on gensg.tanfamily.cc to debug authentication issues

console.log('=== Frontend Authentication Debug ===');

// Check stored token
const token = localStorage.getItem('access_token');
console.log('Stored Token:', token ? token.substring(0, 50) + '...' : 'None');

if (!token) {
    console.error('❌ No token found in localStorage. Please log in first.');
} else {
    // Check if token is expired
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const isExpired = payload.exp && payload.exp < currentTime;
        
        console.log('Token Payload:', payload);
        console.log('Token Expires:', new Date(payload.exp * 1000));
        console.log('Current Time:', new Date());
        console.log('Token Expired:', isExpired);
        
        if (isExpired) {
            console.error('❌ Token is expired. Please log in again.');
        } else {
            console.log('✅ Token appears valid');
            
            // Test API calls
            testApiCalls(token);
        }
    } catch (error) {
        console.error('❌ Error parsing token:', error);
    }
}

async function testApiCalls(token) {
    const apiBaseUrl = 'https://gensg-fastapi.tanfamily.cc';
    
    console.log('\n=== Testing API Endpoints ===');
    
    const endpoints = [
        '/profile/me',
        '/products',
        '/categories',
        '/orders',
        '/hero-banners'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint}...`);
            
            const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                headers: {
                    'X-Auth-Token': token,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint}: Status ${response.status}, Data length: ${Array.isArray(data) ? data.length : 'N/A'}`);
            } else {
                const errorText = await response.text();
                console.error(`❌ ${endpoint}: Status ${response.status}, Error: ${errorText}`);
            }
            
        } catch (error) {
            console.error(`❌ ${endpoint}: Network Error: ${error.message}`);
        }
    }
}

// Also check if there are any service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('\n=== Service Workers ===');
        if (registrations.length === 0) {
            console.log('No service workers registered');
        } else {
            registrations.forEach((registration, index) => {
                console.log(`Service Worker ${index + 1}:`, registration.scope);
            });
        }
    });
}

// Check for any cached responses
console.log('\n=== Cache Information ===');
if ('caches' in window) {
    caches.keys().then(cacheNames => {
        console.log('Cache Names:', cacheNames);
    });
}
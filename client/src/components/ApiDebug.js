import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../services/api';

const ApiDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const info = {
      hostname: window.location.hostname,
      href: window.location.href,
      nodeEnv: process.env.NODE_ENV,
      apiBaseUrl: getApiBaseUrl(),
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
    console.log('API Debug Info:', info);
  }, []);

  const testApiConnection = async () => {
    try {
      const apiUrl = getApiBaseUrl();
      console.log('Testing API connection to:', apiUrl);
      
      const response = await fetch(`${apiUrl}/store/Test1Co/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Test Response:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Test Data:', data);
        alert(`API Connection Success! Got ${data.length} products`);
      } else {
        alert(`API Connection Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`API Connection Error: ${error.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>API Debug Info</h4>
      <div><strong>Hostname:</strong> {debugInfo.hostname}</div>
      <div><strong>URL:</strong> {debugInfo.href}</div>
      <div><strong>NODE_ENV:</strong> {debugInfo.nodeEnv}</div>
      <div><strong>API Base URL:</strong> {debugInfo.apiBaseUrl}</div>
      <div><strong>Time:</strong> {debugInfo.timestamp}</div>
      <button 
        onClick={testApiConnection}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Test API Connection
      </button>
    </div>
  );
};

export default ApiDebug;
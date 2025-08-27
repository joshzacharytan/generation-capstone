import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../services/api';

const NetworkStatus = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkServerStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setServerStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial server check
    checkServerStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/docs`, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      setServerStatus('online');
      onStatusChange?.({ network: true, server: true });
    } catch (error) {
      setServerStatus('offline');
      onStatusChange?.({ network: isOnline, server: false });
    }
  };

  if (isOnline && serverStatus === 'online') {
    return null; // Don't show anything when everything is working
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      padding: '0.75rem 1rem',
      backgroundColor: isOnline ? '#ffc107' : '#dc3545',
      color: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: 9999,
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <span>
        {!isOnline ? '🔴 No Internet Connection' : 
         serverStatus === 'offline' ? '🟡 Server Unavailable' : 
         '🟡 Checking Connection...'}
      </span>
      {serverStatus === 'offline' && (
        <button
          onClick={checkServerStatus}
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default NetworkStatus;
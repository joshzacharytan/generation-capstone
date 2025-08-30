import React from 'react';

const LoadingSpinner = ({ size = 40 }) => {
  return (
    <div style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: '3px solid var(--border-secondary)',
      borderTop: '3px solid var(--color-primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
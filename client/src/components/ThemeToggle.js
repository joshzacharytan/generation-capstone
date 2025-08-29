import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = true, variant = 'button' }) => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      icon: '☀️',
      description: 'Light theme'
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: '🌙',
      description: 'Dark theme'
    },
    {
      value: 'system',
      label: 'Auto',
      icon: '⚙️',
      description: 'Follow system preference'
    }
  ];

  const currentTheme = themeOptions.find(option => option.value === theme);
  const resolvedThemeOption = themeOptions.find(option => option.value === resolvedTheme);

  // Simple toggle button (cycles through themes)
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`theme-toggle-btn ${className}`}
        title={`Current theme: ${currentTheme?.label} ${theme === 'system' ? `(${resolvedTheme})` : ''}`}
        aria-label={`Switch theme. Current: ${currentTheme?.label}`}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          transition: 'var(--theme-transition)',
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'var(--bg-tertiary)';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'var(--bg-elevated)';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        <span role="img" aria-hidden="true" style={{ fontSize: '16px' }}>
          {currentTheme?.icon}
        </span>
        {showLabel && (
          <span>
            {currentTheme?.label}
            {theme === 'system' && (
              <span style={{ 
                opacity: 0.7, 
                fontSize: '12px',
                marginLeft: '4px' 
              }}>
                ({resolvedTheme})
              </span>
            )}
          </span>
        )}
      </button>
    );
  }

  // Dropdown variant with all options visible
  if (variant === 'dropdown') {
    return (
      <div 
        className={`theme-toggle-dropdown ${className}`}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onBlur={(e) => {
            // Close dropdown when clicking outside
            setTimeout(() => {
              if (!e.currentTarget.contains(document.activeElement)) {
                setIsDropdownOpen(false);
              }
            }, 150);
          }}
          className="theme-dropdown-trigger"
          aria-label="Theme selection"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            minWidth: '120px',
            justifyContent: 'space-between',
            transition: 'var(--theme-transition)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span role="img" aria-hidden="true">
              {currentTheme?.icon}
            </span>
            <span>{currentTheme?.label}</span>
          </div>
          <span 
            style={{ 
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            ▼
          </span>
        </button>
        
        {isDropdownOpen && (
          <div
            className="theme-dropdown-menu"
            style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              right: '0',
              marginTop: '4px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'slideDown 0.15s ease-out'
            }}
          >
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsDropdownOpen(false);
                }}
                className="theme-option"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: theme === option.value ? 'var(--bg-tertiary)' : 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  transition: 'var(--theme-transition)'
                }}
                onMouseEnter={(e) => {
                  if (theme !== option.value) {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== option.value) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span role="img" aria-hidden="true">
                  {option.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div>{option.label}</div>
                  {option.value === 'system' && (
                    <div style={{ 
                      fontSize: '11px', 
                      opacity: 0.7,
                      marginTop: '2px'
                    }}>
                      Currently: {resolvedThemeOption?.label}
                    </div>
                  )}
                </div>
                {theme === option.value && (
                  <span style={{ color: 'var(--color-primary)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Icon-only variant for compact spaces
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`theme-toggle-icon ${className}`}
        title={`Switch theme: ${currentTheme?.label}`}
        aria-label={`Switch theme. Current: ${currentTheme?.label}`}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'var(--theme-transition)',
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'var(--bg-tertiary)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'var(--bg-elevated)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <span role="img" aria-hidden="true" style={{ fontSize: '18px' }}>
          {currentTheme?.icon}
        </span>
      </button>
    );
  }

  return null;
};

// Add keyframe animation for dropdown
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default ThemeToggle;
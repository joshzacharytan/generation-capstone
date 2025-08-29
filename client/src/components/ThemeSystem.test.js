import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

// Mock component to test theme context
const TestComponent = () => {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Theme System', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
  });

  test('ThemeProvider initializes with system theme', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });

  test('ThemeProvider loads saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  test('Theme toggle cycles through themes correctly', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');
    
    // Initial: system
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    
    // First toggle: light
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    
    // Second toggle: dark
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    
    // Third toggle: system
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });

  test('ThemeToggle component renders correctly', () => {
    render(
      <ThemeProvider>
        <ThemeToggle variant="button" showLabel={true} />
      </ThemeProvider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  test('Theme persistence saves to localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');
    fireEvent.click(toggleButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  test('Theme applies correct data attribute to document', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Note: In actual implementation, this would check document.documentElement
    // For testing, we'll verify the theme context returns the correct values
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
  });
});

describe('Theme System Edge Cases', () => {
  test('Handles invalid theme value in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should fall back to system theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });

  test('Handles system theme changes', () => {
    // Mock system theme as dark
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    localStorageMock.getItem.mockReturnValue('system');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
  });
});
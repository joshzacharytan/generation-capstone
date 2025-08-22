import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI } from '../services/api';

const SearchBox = ({ tenantDomain, placeholder = "Search products...", initialValue = "" }) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(delayedSearch);
  }, [query, tenantDomain]);

  const fetchSuggestions = async (searchQuery) => {
    try {
      setLoading(true);
      const response = await storeAPI.getSearchSuggestions(tenantDomain, searchQuery);
      setSuggestions(response.data);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const performSearch = (searchQuery) => {
    setShowSuggestions(false);
    navigate(`/store/${tenantDomain}/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    performSearch(suggestion.text);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  const highlightMatch = (text, searchQuery) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <strong key={index} style={{ backgroundColor: '#fff3cd' }}>
          {part}
        </strong>
      ) : part
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <input
          ref={searchRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            paddingRight: '3rem',
            border: '2px solid #e9ecef',
            borderRadius: '25px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            backgroundColor: '#f8f9fa'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#007bff';
            e.target.style.backgroundColor = 'white';
            handleFocus();
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e9ecef';
            e.target.style.backgroundColor = '#f8f9fa';
            handleBlur(e);
          }}
        />
        <button
          type="submit"
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            color: '#6c757d',
            fontSize: '1rem'
          }}
        >
          🔍
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '4px'
          }}
        >
          {loading && (
            <div style={{
              padding: '1rem',
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '0.875rem'
            }}>
              Searching...
            </div>
          )}

          {!loading && suggestions.length === 0 && query.trim().length >= 2 && (
            <div style={{
              padding: '1rem',
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '0.875rem'
            }}>
              No suggestions found
            </div>
          )}

          {!loading && suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f8f9fa' : 'none',
                backgroundColor: selectedIndex === index ? '#f8f9fa' : 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span style={{
                fontSize: '0.875rem',
                color: '#6c757d',
                minWidth: '60px'
              }}>
                {suggestion.type === 'product' ? '📦' : 
                 suggestion.type === 'category' ? '🏷️' : 
                 suggestion.type === 'brand' ? '🏢' : '🔍'}
                {suggestion.type}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: '#333' }}>
                  {highlightMatch(suggestion.text, query)}
                </div>
                {suggestion.subtitle && (
                  <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
              {suggestion.count && (
                <span style={{
                  fontSize: '0.8rem',
                  color: '#6c757d',
                  backgroundColor: '#e9ecef',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px'
                }}>
                  {suggestion.count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
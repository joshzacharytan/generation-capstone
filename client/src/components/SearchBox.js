import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
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
    setShowSuggestions(false);
    
    if (suggestion.type === 'product' && suggestion.id) {
      // Navigate directly to product page for product suggestions
      navigate(`/store/${tenantDomain}/product/${suggestion.id}`);
    } else {
      // Perform search for category, brand, or other suggestion types
      setQuery(suggestion.text);
      navigate(`/store/${tenantDomain}/search?q=${encodeURIComponent(suggestion.text)}`);
    }
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

  const handleFocus = (e) => {
    e.target.style.borderColor = 'var(--color-primary)';
    e.target.style.backgroundColor = 'var(--input-bg)';
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'var(--border-primary)';
    e.target.style.backgroundColor = 'var(--input-bg)';
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
        <strong key={index} style={{ backgroundColor: 'var(--color-warning)', color: 'var(--text-inverse)' }}>
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
            border: '2px solid var(--border-primary)',
            borderRadius: '25px',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s ease, background-color 0.2s ease',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-primary)'
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
            color: 'var(--text-secondary)',
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
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
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
              color: 'var(--text-secondary)',
              fontSize: '0.875rem'
            }}>
              Searching...
            </div>
          )}

          {!loading && suggestions.length === 0 && query.trim().length >= 2 && (
            <div style={{
              padding: '1rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
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
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                backgroundColor: selectedIndex === index ? 'var(--bg-tertiary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                minWidth: '60px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {suggestion.type === 'product' && suggestion.image_url ? (
                  <img
                    src={getImageUrl(suggestion.image_url)}
                    alt={suggestion.text}
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-tertiary)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'inline';
                    }}
                  />
                ) : null}
                <span style={{
                  display: suggestion.type === 'product' && suggestion.image_url ? 'none' : 'inline'
                }}>
                  {suggestion.type === 'product' ? '📦' : 
                   suggestion.type === 'category' ? '🏷️' : 
                   suggestion.type === 'brand' ? '🏢' : '🔍'}
                </span>
                <span style={{ fontSize: '0.8rem' }}>{suggestion.type}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {highlightMatch(suggestion.text, query)}
                </div>
                {suggestion.subtitle && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
              {suggestion.count && (
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-tertiary)',
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
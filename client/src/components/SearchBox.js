import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { storeAPI } from '../services/api';

const SearchBox = ({ tenantDomain, placeholder = "Search products...", initialValue = "" }) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [forceHide, setForceHide] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const uniqueId = useRef(`search-suggestions-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    setQuery(initialValue);
    // Clear suggestions when initialValue changes (e.g., navigating between pages)
    if (initialValue !== query) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
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

  // Clear suggestions when location changes (page navigation)
  useEffect(() => {
    setIsNavigating(true);
    forceClearSuggestions();
    
    // Global cleanup: force hide ALL search suggestion dropdowns
    const allSuggestionDropdowns = document.querySelectorAll('[id^="search-suggestions-"]');
    allSuggestionDropdowns.forEach(dropdown => {
      dropdown.style.display = 'none !important';
      dropdown.style.visibility = 'hidden !important';
      dropdown.style.opacity = '0 !important';
      dropdown.style.zIndex = '-1000 !important';
      dropdown.classList.add('force-hidden');
    });
    
    // Keep navigation state for a bit to ensure complete clearing
    const timeout = setTimeout(() => setIsNavigating(false), 500);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up this component's suggestions on unmount
      forceClearSuggestions();
    };
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    try {
      setLoading(true);
      // Reset navigation states to allow showing suggestions
      setIsNavigating(false);
      setForceHide(false);
      
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
    // Mark as navigating and aggressively clear all suggestion state
    setIsNavigating(true);
    setForceHide(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    // Force the suggestions dropdown to hide by clearing focus
    if (searchRef.current) {
      searchRef.current.blur();
    }
    
    // Add CSS class to force hide dropdown
    if (suggestionsRef.current) {
      suggestionsRef.current.classList.add('force-hidden');
      suggestionsRef.current.style.display = 'none !important';
      suggestionsRef.current.style.visibility = 'hidden !important';
      suggestionsRef.current.style.opacity = '0 !important';
    }
    
    // Navigate immediately
    navigate(`/store/${tenantDomain}/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Force hide suggestions dropdown via DOM if needed
    if (suggestionsRef.current) {
      suggestionsRef.current.style.display = 'none';
    }
  };

  const forceClearSuggestions = () => {
    setIsNavigating(true);
    setForceHide(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    // Force hide suggestions dropdown via DOM with aggressive CSS
    if (suggestionsRef.current) {
      suggestionsRef.current.classList.add('force-hidden');
      suggestionsRef.current.style.display = 'none !important';
      suggestionsRef.current.style.visibility = 'hidden !important';
      suggestionsRef.current.style.opacity = '0 !important';
      suggestionsRef.current.style.zIndex = '-1000 !important';
    }
    
    // Global cleanup: also hide any other suggestion dropdowns that might exist
    const allSuggestionDropdowns = document.querySelectorAll('[id^="search-suggestions-"]');
    allSuggestionDropdowns.forEach(dropdown => {
      dropdown.style.display = 'none !important';
      dropdown.style.visibility = 'hidden !important';
      dropdown.style.opacity = '0 !important';
      dropdown.style.zIndex = '-1000 !important';
      dropdown.classList.add('force-hidden');
    });
  };

  const handleSuggestionClick = (suggestion) => {
    // Immediately mark as navigating and hide suggestions dropdown aggressively
    setIsNavigating(true);
    forceClearSuggestions();
    
    // Remove focus from search input
    if (searchRef.current) {
      searchRef.current.blur();
    }
    
    if (suggestion.type === 'product') {
      // For product suggestions, navigate directly to the product page
      clearSearch();
      navigate(`/store/${tenantDomain}/product/${suggestion.id}`);
    } else {
      // For category/brand suggestions, perform search
      setQuery(suggestion.text);
      performSearch(suggestion.text);
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

  const handleFocus = () => {
    // Reset hiding states when user focuses on input
    setIsNavigating(false);
    setForceHide(false);
    
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

  const getImageUrl = (suggestion) => {
    if (suggestion.type !== 'product') return null;
    
    const imageField = suggestion.image_url || suggestion.image || suggestion.imageUrl || suggestion.img;
    if (!imageField) return null;
    
    // If it's already a full URL, return it as is
    if (imageField.startsWith('http')) return imageField;
    
    // Otherwise, prepend the server URL
    return `http://localhost:8000${imageField}`;
  };

  const highlightMatch = (text, searchQuery) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <strong key={index} style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' }}>
          {part}
        </strong>
      ) : part
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* CSS for force hiding suggestions */}
      <style>{`
        .force-hidden {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          z-index: -1000 !important;
          pointer-events: none !important;
        }
        
        /* Global rule to hide any orphaned search suggestion dropdowns */
        [id^="search-suggestions-"].force-hidden {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          z-index: -1000 !important;
          pointer-events: none !important;
        }
      `}</style>
      
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <input
          ref={searchRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-primary)';
            e.target.style.backgroundColor = 'var(--bg-elevated)';
            handleFocus();
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-primary)';
            e.target.style.backgroundColor = 'var(--input-bg)';
            handleBlur(e);
          }}
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
      {showSuggestions && suggestions.length > 0 && !(forceHide && isNavigating) && (
        <div
          id={uniqueId.current}
          ref={suggestionsRef}
          className={forceHide || isNavigating ? 'force-hidden' : ''}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: forceHide || isNavigating ? -1000 : 1000,
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '4px',
            visibility: showSuggestions ? 'visible' : 'hidden',
            opacity: showSuggestions ? 1 : 0
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
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-primary)' : 'none',
                backgroundColor: selectedIndex === index ? 'var(--bg-tertiary)' : 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {/* Product Image or Icon */}
              {getImageUrl(suggestion) ? (
                <img
                  src={getImageUrl(suggestion)}
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
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              
              {/* Fallback icon/placeholder */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: getImageUrl(suggestion) ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  fontSize: '1.2rem',
                  minWidth: '40px'
                }}
              >
                {suggestion.type === 'product' ? '📦' : 
                 suggestion.type === 'category' ? '🏷️' : 
                 suggestion.type === 'brand' ? '🏢' : '🔍'}
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
import React, { useState, useEffect, useCallback } from 'react';
import { storeAPI } from '../services/api';

// Helper function to get full image URL
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `http://localhost:8000${imageUrl}`;
};

const HeroBannerDisplay = ({ tenantDomain }) => {
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching hero banners for tenant:', tenantDomain);
      const response = await storeAPI.getHeroBanners(tenantDomain);
      console.log('Hero banners response:', response.data);
      setBanners(response.data || []);
    } catch (err) {
      // If there's an error fetching banners (like 404), just hide the component
      console.warn('No hero banners found for store:', err);
      console.log('Error details:', err.response?.data || err.message);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, [tenantDomain]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    // Auto-rotate banners if there are multiple
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => 
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Change banner every 5 seconds

      return () => clearInterval(interval);
    }
  }, [banners]);

  const handleBannerClick = (banner) => {
    if (banner.link_url) {
      // Open external links in new tab, internal links in same tab
      if (banner.link_url.startsWith('http')) {
        window.open(banner.link_url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = banner.link_url;
      }
    }
  };

  const handleDotClick = (index) => {
    setCurrentBannerIndex(index);
  };

  // Don't render anything if loading, error, or no banners
  if (loading || error || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxHeight: '400px',
      overflow: 'hidden',
      marginBottom: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {/* Banner Image and Content */}
      <div 
        style={{
          position: 'relative',
          cursor: currentBanner.link_url ? 'pointer' : 'default',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '250px',
          display: 'flex',
          alignItems: 'center'
        }}
        onClick={() => handleBannerClick(currentBanner)}
      >
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${getFullImageUrl(currentBanner.image_url)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} />
        
        {/* Overlay for text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)'
        }} />
        
        {/* Content Container */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '2rem',
          maxWidth: '600px',
          color: 'white'
        }}>
          {currentBanner.title && (currentBanner.show_title === true) && (
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              margin: '0 0 1rem 0',
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              lineHeight: '1.2'
            }}>
              {currentBanner.title}
            </h1>
          )}
          
          {currentBanner.subtitle && (
            <p style={{
              fontSize: '1.2rem',
              margin: '0 0 1.5rem 0',
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              lineHeight: '1.4',
              opacity: 0.95
            }}>
              {currentBanner.subtitle}
            </p>
          )}
          
          {currentBanner.link_url && currentBanner.link_text && (
            <button
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: '#333',
                border: 'none',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.9)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {currentBanner.link_text}
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation Dots (only show if multiple banners) */}
      {banners.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 3
        }}>
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(index);
              }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: index === currentBannerIndex ? 'white' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              onMouseOver={(e) => {
                if (index !== currentBannerIndex) {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.8)';
                }
              }}
              onMouseOut={(e) => {
                if (index !== currentBannerIndex) {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.5)';
                }
              }}
            />
          ))}
        </div>
      )}
      
      {/* Banner Counter (only show if multiple banners) */}
      {banners.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '15px',
          fontSize: '0.85rem',
          zIndex: 3
        }}>
          {currentBannerIndex + 1} / {banners.length}
        </div>
      )}
    </div>
  );
};

export default HeroBannerDisplay;
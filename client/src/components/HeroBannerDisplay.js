import React, { useState, useEffect, useCallback, useRef } from 'react';
import { storeAPI } from '../services/api';
import { getImageUrl as getFullImageUrl } from '../utils/imageUtils';

const HeroBannerDisplay = ({ tenantDomain }) => {
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

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

  // Auto-rotation with configurable timing and pause functionality
  useEffect(() => {
    if (banners.length <= 1 || isPaused) {
      return;
    }

    // Get rotation interval from banner settings or default to 5 seconds
    const rotationInterval = (banners[0]?.rotation_interval || 5) * 1000;

    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentBannerIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
      
      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Match CSS transition duration
    }, rotationInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [banners, isPaused]);

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

  const handleNextBanner = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentBannerIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
    
    // Reset transition state after animation completes
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 500); // Match CSS transition duration
  };

  const handlePrevBanner = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentBannerIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
    
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const handleDotClick = (index) => {
    if (isTransitioning || index === currentBannerIndex) return;
    
    setIsTransitioning(true);
    setCurrentBannerIndex(index);
    
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Don't render anything if loading, error, or no banners
  if (loading || error || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        maxHeight: '400px',
        overflow: 'hidden',
        marginBottom: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Container */}
      <div 
        style={{
          display: 'flex',
          width: `${banners.length * 100}%`,
          transform: `translateX(${-currentBannerIndex * (100 / banners.length)}%)`,
          transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none'
        }}
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            style={{
              width: `${100 / banners.length}%`,
              minHeight: '250px',
              position: 'relative',
              cursor: banner.link_url ? 'pointer' : 'default',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => handleBannerClick(banner)}
          >
            {/* Background Image */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${getFullImageUrl(banner.image_url)})`,
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
              {banner.title && (banner.show_title === true) && (
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  margin: '0 0 1rem 0',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                  lineHeight: '1.2'
                }}>
                  {banner.title}
                </h1>
              )}
              
              {banner.subtitle && (
                <p style={{
                  fontSize: '1.2rem',
                  margin: '0 0 1.5rem 0',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                  lineHeight: '1.4',
                  opacity: 0.95
                }}>
                  {banner.subtitle}
                </p>
              )}
              
              {banner.link_url && banner.link_text && (
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
                  {banner.link_text}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation Arrows (only show if multiple banners) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevBanner();
            }}
            disabled={isTransitioning}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              border: 'none',
              borderRadius: '50%',
              cursor: isTransitioning ? 'not-allowed' : 'pointer',
              fontSize: '1.5rem',
              color: '#333',
              zIndex: 4,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              opacity: isTransitioning ? 0.5 : 1
            }}
            onMouseOver={(e) => {
              if (!isTransitioning) {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.8)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ❮
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextBanner();
            }}
            disabled={isTransitioning}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              border: 'none',
              borderRadius: '50%',
              cursor: isTransitioning ? 'not-allowed' : 'pointer',
              fontSize: '1.5rem',
              color: '#333',
              zIndex: 4,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              opacity: isTransitioning ? 0.5 : 1
            }}
            onMouseOver={(e) => {
              if (!isTransitioning) {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.8)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ❯
          </button>
        </>
      )}
      
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
      
      {/* Pause Indicator (only show when paused) */}
      {isPaused && banners.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '0.5rem',
          borderRadius: '50%',
          fontSize: '1rem',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}>
          ⏸️
        </div>
      )}
    </div>
  );
};

export default HeroBannerDisplay;
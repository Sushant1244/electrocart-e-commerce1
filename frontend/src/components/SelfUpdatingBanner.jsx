import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createSelfUpdater, DEFAULT_CONFIG } from '../utils/selfUpdater';

/**
 * SelfUpdatingBanner - A banner component that automatically cycles through content
 * with configurable intervals, transition effects, and update rules.
 * 
 * Features:
 * - Auto-rotation through banner content
 * - Multiple transition effects (fade, slide, flip, zoom)
 * - Pause on hover functionality
 * - Navigation controls (next/previous/go to)
 * - Progress indicator
 * - Responsive design
 * 
 * @param {Array} banners - Array of banner objects with title, subtitle, image, cta, etc.
 * @param {Object} config - Configuration options for the banner
 */
export default function SelfUpdatingBanner({ 
  banners = [], 
  config = {},
  className = '',
  style = {},
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  // Merge default config with provided config
  const mergedConfig = { 
    ...DEFAULT_CONFIG, 
    ...config,
    onIndexChange: (newIndex, oldIndex) => {
      setCurrentIndex(newIndex);
      animateTransition();
      if (config.onIndexChange) {
        config.onIndexChange(newIndex, oldIndex);
      }
    },
  };
  
  // Create the self-updater instance
  const updaterRef = useRef(null);
  useEffect(() => {
    updaterRef.current = createSelfUpdater(banners, {
      ...mergedConfig,
      onIndexChange: (newIndex) => {
        setCurrentIndex(newIndex);
      },
    });
    
    return () => {
      if (updaterRef.current) {
        updaterRef.current.stop();
      }
    };
  }, [banners]);
  
  // Start auto-rotation
  useEffect(() => {
    if (banners.length > 1 && mergedConfig.autoRotate && updaterRef.current) {
      updaterRef.current.start((item, index) => {
        setCurrentIndex(index);
      });
      
      // Start progress tracking
      startProgressTracking();
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [banners.length, mergedConfig.autoRotate]);
  
  // Progress tracking for each slide
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    setProgress(0);
    const startTime = Date.now();
    const duration = mergedConfig.interval;
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(progressIntervalRef.current);
      }
    }, 50);
  }, [mergedConfig.interval]);
  
  // Handle transition animation
  const animateTransition = useCallback(() => {
    setIsAnimating(true);
    setProgress(0);
    startProgressTracking();
    
    setTimeout(() => {
      setIsAnimating(false);
    }, mergedConfig.transitionDuration);
  }, [mergedConfig.transitionDuration, startProgressTracking]);
  
  // Navigation handlers
  const handleNext = useCallback(() => {
    if (updaterRef.current && !isAnimating) {
      updaterRef.current.next();
    }
  }, [isAnimating]);
  
  const handlePrevious = useCallback(() => {
    if (updaterRef.current && !isAnimating) {
      updaterRef.current.previous();
    }
  }, [isAnimating]);
  
  const handleGoTo = useCallback((index) => {
    if (updaterRef.current && !isAnimating) {
      updaterRef.current.goTo(index);
      setCurrentIndex(index);
      animateTransition();
    }
  }, [isAnimating]);
  
  // Handle mouse events for pause on hover
  const handleMouseEnter = useCallback(() => {
    if (mergedConfig.pauseOnHover && updaterRef.current) {
      updaterRef.current.pause();
      setIsPaused(true);
    }
  }, [mergedConfig.pauseOnHover]);
  
  const handleMouseLeave = useCallback(() => {
    if (mergedConfig.pauseOnHover && updaterRef.current) {
      updaterRef.current.resume();
      setIsPaused(false);
    }
  }, [mergedConfig.pauseOnHover]);
  
  // Get current banner
  const currentBanner = banners[currentIndex] || banners[0] || {};
  
  // Get transition class based on config
  const getTransitionClass = () => {
    const { transitionType, direction } = mergedConfig;
    if (!mergedConfig.enableTransitions) return '';
    
    const transitionMap = {
      fade: 'banner-fade',
      slide: `banner-slide-${direction}`,
      flip: 'banner-flip',
      zoom: 'banner-zoom',
      none: 'banner-none',
    };
    
    return transitionMap[transitionType] || 'banner-fade';
  };
  
  // Don't render if no banners
  if (!banners || banners.length === 0) {
    return null;
  }
  
  // Single banner - no controls needed
  if (banners.length === 1) {
    return (
      <div 
        className={`self-updating-banner ${className}`}
        style={style}
        ref={containerRef}
      >
        <BannerContent banner={currentBanner} />
      </div>
    );
  }
  
  return (
    <div 
      className={`self-updating-banner ${className}`}
      style={style}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Banner Content */}
      <div className={`banner-content ${getTransitionClass()} ${isAnimating ? 'animating' : ''}`}>
        <BannerContent banner={currentBanner} />
      </div>
      
      {/* Navigation Arrows */}
      {mergedConfig.showNavigation !== false && (
        <>
          <button 
            className="banner-nav banner-prev" 
            onClick={handlePrevious}
            aria-label="Previous banner"
          >
            ‹
          </button>
          <button 
            className="banner-nav banner-next" 
            onClick={handleNext}
            aria-label="Next banner"
          >
            ›
          </button>
        </>
      )}
      
      {/* Dots Indicator */}
      {mergedConfig.showDots !== false && (
        <div className="banner-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`banner-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleGoTo(index)}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Progress Bar */}
      {mergedConfig.showProgress !== false && (
        <div className="banner-progress">
          <div 
            className="banner-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {/* Pause Indicator */}
      {isPaused && (
        <div className="banner-pause-indicator">
          <span>Paused</span>
        </div>
      )}
    </div>
  );
}

/**
 * BannerContent - Renders individual banner content
 */
function BannerContent({ banner }) {
  const {
    title,
    subtitle,
    description,
    image,
    backgroundImage,
    ctaText = 'Shop Now',
    ctaLink = '/products',
    badge,
    textAlign = 'left',
    textColor = 'black',
    overlay = true,
  } = banner;
  
  const bannerStyle = backgroundImage 
    ? { 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};
    
  const imageSrc = image || backgroundImage;
  
  return (
    <div className="banner-inner" style={bannerStyle}>
      {overlay && <div className="banner-overlay" />}
      
      <div className="banner-content">
        <div className="banner-text" style={{ textAlign }}>
          {badge && (
            <span className="banner-badge">{badge}</span>
          )}
          
          {title && (
            <h1 className="banner-title" style={{ color: textColor }}>
              {title}
            </h1>
          )}
          
          {subtitle && (
            <h2 className="banner-subtitle" style={{ color: textColor }}>
              {subtitle}
            </h2>
          )}
          
          {description && (
            <p className="banner-description" style={{ color: textColor }}>
              {description}
            </p>
          )}
          
          {ctaText && (
            <a href={ctaLink} className="banner-cta">
              {ctaText}
            </a>
          )}
        </div>
      </div>
      
      {imageSrc && !backgroundImage && (
        <div className="banner-image">
          <img src={imageSrc} alt={title || 'Banner'} />
        </div>
      )}
    </div>
  );
}

// Default banner data for demonstration
export const DEFAULT_BANNERS = [
  {
    id: 1,
    title: 'Summer Sale',
    subtitle: 'Up to 50% Off',
    description: 'Discover amazing deals on latest electronics and gadgets.',
    image: '/uploads/Iphone banner.png',
    badge: 'HOT',
    ctaText: 'Shop Now',
    ctaLink: '/products?category=sale',
    textAlign: 'left',
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Latest Tech Collection',
    description: 'Explore our newest products from top brands.',
    image: '/uploads/Alpha  Watch banner.png',
    badge: 'NEW',
    ctaText: 'Explore',
    ctaLink: '/products?category=new',
    textAlign: 'right',
  },
  {
    id: 3,
    title: 'Free Shipping',
    subtitle: 'On Orders Over $50',
    description: 'Get free delivery on all orders above $50.',
    image: '/uploads/Homepages.png',
    badge: 'FREE SHIP',
    ctaText: 'Learn More',
    ctaLink: '/faq',
    textAlign: 'center',
  },
];

// Banner Configuration Presets
export const BANNER_PRESETS = {
  // Fast rotation for promotional banners
  promotional: {
    interval: 3000,
    transitionDuration: 400,
    transitionType: 'fade',
    pauseOnHover: true,
    showNavigation: true,
    showDots: true,
    showProgress: true,
  },
  
  // Slow rotation for showcase banners
  showcase: {
    interval: 8000,
    transitionDuration: 800,
    transitionType: 'slide',
    direction: 'left',
    pauseOnHover: true,
    showNavigation: true,
    showDots: true,
    showProgress: false,
  },
  
  // Smooth slide for elegant displays
  elegant: {
    interval: 6000,
    transitionDuration: 600,
    transitionType: 'slide',
    direction: 'right',
    pauseOnHover: true,
    showNavigation: true,
    showDots: false,
    showProgress: true,
  },
  
  // Minimal for subtle transitions
  minimal: {
    interval: 5000,
    transitionDuration: 300,
    transitionType: 'none',
    pauseOnHover: false,
    showNavigation: false,
    showDots: true,
    showProgress: false,
  },
};

export { SelfUpdatingBanner };

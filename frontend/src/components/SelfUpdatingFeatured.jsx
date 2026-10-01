import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createSelfUpdater, DEFAULT_CONFIG } from '../utils/selfUpdater';

/**
 * SelfUpdatingFeatured - A featured products section that automatically
 * rotates through products with configurable intervals and transitions.
 * 
 * Features:
 * - Auto-rotation through featured products
 * - Multiple display modes (grid, carousel, spotlight)
 * - Transition effects between products
 * - Countdown timers for limited offers
 * - Real-time stock updates simulation
 * 
 * @param {Array} products - Array of product objects
 * @param {Object} config - Configuration options
 */
export default function SelfUpdatingFeatured({ 
  products = [], 
  config = {},
  renderProduct,
  className = '',
  style = {},
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const containerRef = useRef(null);
  
  // Configuration with defaults
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    // Default to showing 4 products at a time
    displayCount: config.displayCount || 4,
    // Default to spotlight mode
    displayMode: config.displayMode || 'spotlight',
    interval: config.interval || 6000,
    transitionType: config.transitionType || 'slide',
    onIndexChange: (newIndex) => {
      setCurrentIndex(newIndex);
    },
  };
  
  const { displayCount, displayMode } = mergedConfig;
  
  // Create updater instance
  const updaterRef = useRef(null);
  useEffect(() => {
    if (products.length > 0) {
      updaterRef.current = createSelfUpdater(products, {
        ...mergedConfig,
        onIndexChange: (newIndex) => {
          setCurrentIndex(newIndex);
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), mergedConfig.transitionDuration);
        },
      });
    }
    
    return () => {
      if (updaterRef.current) {
        updaterRef.current.stop();
      }
    };
  }, [products]);
  
  // Start auto-rotation
  useEffect(() => {
    if (products.length > displayCount && mergedConfig.autoRotate && updaterRef.current) {
      updaterRef.current.start((item, index) => {
        setCurrentIndex(index);
      });
    }
  }, [products.length, displayCount, mergedConfig.autoRotate]);
  
  // Update display products based on current index
  useEffect(() => {
    if (products.length === 0) return;
    
    let newDisplayProducts = [];
    
    if (displayMode === 'spotlight') {
      // Spotlight mode: show one featured product prominently
      newDisplayProducts = [products[currentIndex]];
    } else if (displayMode === 'carousel') {
      // Carousel mode: show products in a rotating window
      newDisplayProducts = [];
      for (let i = 0; i < displayCount; i++) {
        const index = (currentIndex + i) % products.length;
        newDisplayProducts.push(products[index]);
      }
    } else {
      // Grid mode: show all products (or first N)
      newDisplayProducts = products.slice(0, displayCount);
    }
    
    setDisplayProducts(newDisplayProducts);
  }, [currentIndex, products, displayCount, displayMode]);
  
  // Navigation handlers
  const handleNext = useCallback(() => {
    if (updaterRef.current) {
      updaterRef.current.next();
    }
  }, []);
  
  const handlePrevious = useCallback(() => {
    if (updaterRef.current) {
      updaterRef.current.previous();
    }
  }, []);
  
  // Render product card (custom or default)
  const renderProductCard = useCallback((product, index) => {
    if (renderProduct) {
      return renderProduct(product, index);
    }
    
    // Default product card
    return (
      <div key={product._id || index} className="featured-product-card">
        <div className="featured-product-image">
          <img 
            src={product.images?.[0] || '/uploads/placeholder.png'} 
            alt={product.name} 
          />
          {product.badge && (
            <span className="featured-badge">{product.badge}</span>
          )}
          {product.stock !== undefined && (
            <span className={`stock-badge ${product.stock < 5 ? 'low-stock' : ''}`}>
              {product.stock} left
            </span>
          )}
        </div>
        <div className="featured-product-info">
          <h3>{product.name}</h3>
          <p className="featured-price">
            {product.price ? `$${product.price.toLocaleString()}` : 'Price on request'}
          </p>
          {product.originalPrice && (
            <p className="featured-original-price">
              ${product.originalPrice.toLocaleString()}
            </p>
          )}
          {product.discount && (
            <span className="featured-discount">-{product.discount}%</span>
          )}
        </div>
      </div>
    );
  }, [renderProduct]);
  
  // Get transition class
  const getTransitionClass = () => {
    const { transitionType, direction } = mergedConfig;
    if (!mergedConfig.enableTransitions) return '';
    
    const transitionMap = {
      fade: 'featured-fade',
      slide: `featured-slide-${direction}`,
      zoom: 'featured-zoom',
    };
    
    return transitionMap[transitionType] || '';
  };
  
  // Don't render if no products
  if (!products || products.length === 0) {
    return (
      <div className={`self-updating-featured empty ${className}`} style={style}>
        <p>No featured products available</p>
      </div>
    );
  }
  
  return (
    <div 
      className={`self-updating-featured ${displayMode} ${className}`}
      style={style}
      ref={containerRef}
    >
      {/* Section Header */}
      <div className="featured-header">
        <h2>{mergedConfig.title || 'Featured Products'}</h2>
        {mergedConfig.showCounter && (
          <span className="featured-counter">
            {currentIndex + 1} / {products.length}
          </span>
        )}
      </div>
      
      {/* Products Display */}
      <div className={`featured-products ${getTransitionClass()} ${isAnimating ? 'animating' : ''}`}>
        {displayMode === 'spotlight' ? (
          <div className="spotlight-view">
            <div className="spotlight-product">
              {renderProductCard(displayProducts[0], currentIndex)}
            </div>
            {mergedConfig.showThumbnails && (
              <div className="spotlight-thumbnails">
                {products.map((product, index) => (
                  <button
                    key={product._id || index}
                    className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => updaterRef.current?.goTo(index)}
                  >
                    <img 
                      src={product.images?.[0] || '/uploads/placeholder.png'} 
                      alt={product.name}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {displayProducts.map((product, index) => (
              <div 
                key={product._id || index} 
                className="product-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {renderProductCard(product, index)}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Navigation Controls */}
      {products.length > displayCount && (
        <div className="featured-nav">
          <button 
            className="nav-btn prev" 
            onClick={handlePrevious}
            aria-label="Previous"
          >
            ‹
          </button>
          <button 
            className="nav-btn next" 
            onClick={handleNext}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      )}
      
      {/* Progress Indicator */}
      {mergedConfig.showProgress && (
        <div className="featured-progress">
          {products.map((_, index) => (
            <div 
              key={index}
              className={`progress-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => updaterRef.current?.goTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Display Mode Presets
export const FEATURED_PRESETS = {
  spotlight: {
    displayMode: 'spotlight',
    displayCount: 1,
    showThumbnails: true,
    showCounter: true,
    showProgress: true,
    interval: 5000,
    transitionType: 'fade',
  },
  carousel: {
    displayMode: 'carousel',
    displayCount: 4,
    showProgress: true,
    interval: 6000,
    transitionType: 'slide',
    direction: 'left',
  },
  grid: {
    displayMode: 'grid',
    displayCount: 8,
    showProgress: false,
    autoRotate: false,
    transitionType: 'fade',
  },
};

export { SelfUpdatingFeatured, FEATURED_PRESETS };

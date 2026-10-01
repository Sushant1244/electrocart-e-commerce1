import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import API from '../api/api';

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);

  React.useEffect(() => {
    const updateCartCount = () => {
      let cart = [];
      try {
        const raw = localStorage.getItem('cart') || '[]';
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) cart = parsed;
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
        cart = [];
      }
      setCartCount(cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0));
    };
    updateCartCount();
    const updateWishlist = () => {
      try {
        const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlistCount(Array.isArray(list) ? list.length : 0);
      } catch (e) { setWishlistCount(0); }
    };
    updateWishlist();
    window.addEventListener('storage', updateCartCount);
    // also listen for in-tab cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('wishlistUpdated', updateWishlist);
    window.addEventListener('storage', updateWishlist);
    const interval = setInterval(updateCartCount, 1000);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('wishlistUpdated', updateWishlist);
      window.removeEventListener('storage', updateWishlist);
      clearInterval(interval);
    };
  }, []);

  // Fetch auto-suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.trim().length < 2) {
        setSuggestions({ products: [], categories: [] });
        return;
      }
      
      try {
        const res = await API.get(`/products/suggestions?q=${encodeURIComponent(searchTerm)}&suggestions=true`);
        if (res.data) {
          setSuggestions({
            products: res.data.products || [],
            categories: res.data.categories || []
          });
        }
      } catch (e) {
        console.error('Failed to fetch suggestions', e);
      }
    };
    
    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (slug) => {
    navigate(`/product/${slug}`);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          // try to focus an element with id 'content' or the products section; fallback to body
          const target = document.getElementById('content') || document.getElementById('products') || document.querySelector('main') || document.body;
          if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus();
          }
        }}
      >
        Skip to content
      </a>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-left">
            <span>📞 +9779701605257</span>
            <span>📍 Store Location</span>
          </div>
          <div className="top-bar-center">
            <span>Tell a friend about Elecrocart & get 20% off</span>
          </div>
          <div className="top-bar-right">
            <select className="currency-select">
              <option>USD</option>
              <option>EUR</option>
              <option>NPR</option>
            </select>
            {user ? (
              <>
                <span>Welcome, {user.name || user.email}</span>
                {user.isAdmin === true && <Link to="/admin">Admin</Link>}
                <Link to="/orders">My Orders</Link>
                <button aria-label="Logout" className="link-btn" onClick={() => { onLogout(); navigate('/'); }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <span>/</span>
                <Link to="/register">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="header">
        <div className="container header-content">
          <div className="brand">
            <Link to="/" className="brand-link">
              <img
                src="/uploads/logo1.png"
                alt="Elecrocart"
                className="brand-logo"
                onError={(e) => { try { e.currentTarget.onerror = null; e.currentTarget.src = '/uploads/logo.png'; } catch (err) {} }}
              />
              <span className="brand-text">Elecrocart</span>
            </Link>
          </div>
            <nav className="main-nav" role="navigation" aria-label="Main navigation">
              {/* Use aria-current to indicate active link for assistive tech */}
              <Link to="/" aria-current={location.pathname === '/' && !location.hash ? 'page' : undefined}>HOME</Link>
              <Link to="/#products" aria-current={(location.hash && location.hash.includes('products')) || (location.pathname === '/' && (new URLSearchParams(location.search).has('category'))) ? 'page' : undefined}>ELECTRONICS</Link>
              <Link to="/blog" aria-current={location.pathname === '/blog' ? 'page' : undefined}>BLOG</Link>
              <Link to="/pages" aria-current={location.pathname === '/pages' ? 'page' : undefined}>PAGES</Link>
              <Link to="/faq" aria-current={location.pathname === '/faq' ? 'page' : undefined}>FAQ</Link>
              <Link to="/contact" aria-current={location.pathname === '/contact' ? 'page' : undefined}>CONTACT</Link>
            </nav>
            <div className="header-actions">
              <div className="search-box" ref={searchRef}>
                <form onSubmit={handleSearchSubmit}>
                  <input
                    aria-label="Search products"
                    className="search-input"
                    placeholder="Search products, brands..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleSearchSubmit(e); } }}
                  />
                </form>
                {/* Auto-suggestions dropdown */}
                {showSuggestions && (suggestions.products.length > 0 || suggestions.categories.length > 0) && (
                  <div className="suggestions-dropdown">
                    {suggestions.categories.length > 0 && (
                      <div className="suggestion-section">
                        <div className="suggestion-header">Categories</div>
                        {suggestions.categories.map((cat, idx) => (
                          <div
                            key={`cat-${idx}`}
                            className="suggestion-item category"
                            onClick={() => {
                              navigate(`/search?category=${encodeURIComponent(cat.name)}`);
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="suggestion-icon">📁</span>
                            {cat.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {suggestions.products.length > 0 && (
                      <div className="suggestion-section">
                        <div className="suggestion-header">Products</div>
                        {suggestions.products.map((product) => (
                          <div
                            key={product._id}
                            className="suggestion-item product"
                            onClick={() => handleSuggestionClick(product.slug)}
                          >
                            {product.image && (
                              <img
                                src={product.image}
                                alt=""
                                className="suggestion-thumb"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div className="suggestion-info">
                              <div className="suggestion-name">{product.name}</div>
                              <div className="suggestion-price">Rs. {product.price?.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="suggestion-footer" onClick={handleSearchSubmit}>
                      See all results for "{searchTerm}"
                    </div>
                  </div>
                )}
              </div>
              <NotificationDropdown />
              <Link to="/wishlist" className="icon-btn wishlist-icon mr-8" aria-label={`Wishlist with ${wishlistCount} items`}>
                <span className="heart-glyph" aria-hidden>♥</span>
                {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
              </Link>
              <Link to="/cart" className="icon-btn cart-icon" aria-label={`Cart with ${cartCount} items`}>🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</Link>
            </div>
            {/* Hamburger Menu Button */}
            <button 
              className={`hamburger-menu ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <div 
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-search">
          <input
            aria-label="Search products"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { 
              if (e.key === 'Enter') { 
                navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                setMobileMenuOpen(false);
              } 
            }}
          />
          <button onClick={() => {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setMobileMenuOpen(false);
          }}>🔍</button>
        </div>
        <nav className="mobile-nav-links">
          <Link 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            aria-current={location.pathname === '/' && !location.hash ? 'page' : undefined}
          >HOME</Link>
          <Link 
            to="/#products" 
            onClick={() => setMobileMenuOpen(false)}
            aria-current={(location.hash && location.hash.includes('products')) || (location.pathname === '/' && (new URLSearchParams(location.search).has('category'))) ? 'page' : undefined}
          >ELECTRONICS</Link>
          <Link 
            to="/blog" 
            onClick={() => setMobileMenuOpen(false)}
            aria-current={location.pathname === '/blog' ? 'page' : undefined}
          >BLOG</Link>
          <Link 
            to="/pages" 
            onClick={() => setMobileMenuOpen(false)}
            aria-current={location.pathname === '/pages' ? 'page' : undefined}
          >PAGES</Link>
          <Link 
            to="/contact" 
            onClick={() => setMobileMenuOpen(false)}
            aria-current={location.pathname === '/contact' ? 'page' : undefined}
          >CONTACT</Link>
          
          {/* User Section for Mobile */}
          <div className="mobile-user-section">
            {user ? (
              <>
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                {user.isAdmin === true && <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>}
                <button className="link-btn" onClick={() => { onLogout(); navigate('/'); setMobileMenuOpen(false); }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </nav>
        <div className="mobile-header-actions">
          <Link to="/wishlist" className="icon-btn wishlist-icon" onClick={() => setMobileMenuOpen(false)}>
            <span className="heart-glyph" aria-hidden>♥</span>
            {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
            <span style={{marginLeft: '8px'}}>Wishlist</span>
          </Link>
          <Link to="/cart" className="icon-btn cart-icon" onClick={() => setMobileMenuOpen(false)}>
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </>
  );
}

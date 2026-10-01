import React, { useEffect, useState, useRef } from 'react';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';
import ProductCard from '../components/ProductCard';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SelfUpdatingBanner } from '../components/SelfUpdatingBanner';
import '../styles/SelfUpdatingComponents.css';

export default function Home(){
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forceDemo, setForceDemo] = useState(false);
  // router helpers used by hero/shop buttons and category clicks
  const navigate = useNavigate();
  const location = useLocation();
  const buttonRefs = useRef([]);
  const filterOptions = ['All', 'Accessories', 'iPhone', 'Laptop', 'iPad'];
  const [activeFilter, setActiveFilter] = useState('All');

  // show loading while products are being fetched (moved below so hooks run first)

  useEffect(()=> {
  loadProducts();
  // listen for admin updates and reload products when they occur
    const handler = () => { loadProducts(); };
    window.addEventListener('productsChanged', handler);
    const storageHandler = (ev) => {
      if (ev.key === 'productsChanged') loadProducts();
    };
    window.addEventListener('storage', storageHandler);
    return () => { window.removeEventListener('productsChanged', handler); window.removeEventListener('storage', storageHandler); };
  }, []);

  // uploadsList removed: gallery was developer-only and is no longer displayed

  const loadProducts = async () => {
    try {
      const [allRes, featuredRes] = await Promise.all([
        API.get('/products'),
        API.get('/products?featured=true').catch(() => ({ data: [] }))
      ]);
      setProducts(allRes.data);
      setFeaturedProducts(featuredRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // render loading state inside JSX rather than returning early so hooks run consistently

  // Diagnostic: show debug hint when no products are available
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const categories = [
    { name: 'iPhone', imageFile: 'Iphone.png' },
    { name: 'Mini Speaker', imageFile: 'Mini Speaker.png' },
    { name: 'iPad', imageFile: 'Ipad.png' },
    { name: 'Headphone', imageFile: 'Headphone.png' },
    { name: 'Camera', imageFile: 'Camera.png' },
    { name: 'Accessories', imageFile: 'Accessories.png' }
  ];

  // Self-updating banner configuration
  const bannerConfig = {
    interval: 5000,
    transitionDuration: 500,
    transitionType: 'slide',
    direction: 'left',
    pauseOnHover: true,
    showNavigation: true,
    showDots: true,
    showProgress: true,
  };

  // Single static banner (old style - no rotation)
  const banners = [
    {
      id: 1,
      title: 'Security Smart Camera',
      subtitle: 'Just Start at $850',
      description: 'Shop now for the best security cameras at great prices.',
      image: '/uploads/Security Smart Camera.png',
      badge: 'HOT DEAL',
      ctaText: 'Shop Now',
      ctaLink: '/#products',
      textAlign: 'left',
    },
  ];

  // (removed unused getCategoryImage helper) - images for categories resolved inline where needed

  // Fallback images for products when API returns no images (maps slug -> upload path)
  const PRODUCT_IMAGE_FALLBACK = {
    'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'wireless-headphones': '/uploads/Wireless Headphones.png',
    'homepad-mini': '/uploads/Homepad mini.png',
    'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
    'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
    'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png'
  };

  // Local demo products (used when backend/products API is empty) - maps to files in /uploads
  const DEMO_PRODUCTS = [
    { _id: 'demo1', name: 'Alpha Watch ultra', slug: 'alpha-watch-ultra', price: 3500, images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png'], stock: 10, featured: true },
    { _id: 'demo2', name: 'Wireless Headphones', slug: 'wireless-headphones', price: 3200, images: ['/uploads/Wireless Headphones.png'], stock: 25 },
    { _id: 'demo3', name: 'Homepad mini', slug: 'homepad-mini', price: 1200, images: ['/uploads/Homepad mini.png'], stock: 50 },
    { _id: 'demo4', name: 'MatrixSafe Charger', slug: 'matrixsafe-charger', price: 1700, images: ['/uploads/MatrixSafe Charger.png'], stock: 30 },
    { _id: 'demo5', name: 'Iphone 15 Pro max', slug: 'iphone-15-pro-max', price: 178900, images: ['/uploads/Iphone 15 pro ma.png'], stock: 15, featured: true },
    { _id: 'demo6', name: 'Macbook M2 Dark gray', slug: 'macbook-m2-dark-gray', price: 117000, images: ['/uploads/MacBook Air M4.png'], stock: 8 }
  ];

  // Extra demo products so the UI shows more items
  DEMO_PRODUCTS.push(
    { _id: 'demo7', name: 'Music Magnet Headphone', slug: 'music-magnet-headphone', price: 14500, images: ['/uploads/Music magnet Headphone.jpg'], stock: 20 },
    { _id: 'demo8', name: 'Security Smart Camera', slug: 'security-smart-camera', price: 850, images: ['/uploads/Security Smart Camera.png'], stock: 40 },
    { _id: 'demo9', name: 'Smart Box', slug: 'smart-box', price: 2999, images: ['/uploads/Smart Box.png'], stock: 12 },
    { _id: 'demo10', name: 'Macbook Air M3', slug: 'macbook-air-m3', price: 98000, images: ['/uploads/Macebook Air M3.png'], stock: 6 },
    { _id: 'demo11', name: 'Mini Speaker', slug: 'mini-speaker', price: 2400, images: ['/uploads/Mini Speaker.png'], stock: 35 },
    { _id: 'demo12', name: 'ENTERTAINMENT & GAMES Pack', slug: 'entertainment-games-pack', price: 450, images: ['/uploads/ENTERTAINMENT & GAMES.png'], stock: 50 }
  );

  // Use demo products if API returned nothing, and apply category filter from URL if present
  const baseProducts = (products?.length) ? products : DEMO_PRODUCTS;
  const params = new URLSearchParams(location.search || '');
  const categoryParam = params.get('category') || '';
  const categoryFilter = categoryParam.trim().toLowerCase();

  // keep the activeFilter state in sync with the URL param so the UI reflects the selection
  useEffect(() => {
    if (!categoryParam) {
      setActiveFilter('All');
      return;
    }
    // try to match one of the filterOptions (case-insensitive)
    const match = filterOptions.find(f => f.toLowerCase() === categoryFilter || f.toLowerCase().includes(categoryFilter));
    setActiveFilter(match || 'All');
  }, [categoryParam]);

  const displayProducts = categoryFilter
    ? baseProducts.filter(p => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();
        // Common alias map so UI names like "iPhone" match backend category/tag variations
        const CATEGORY_ALIASES = {
          'iphone': ['iphone', 'phone', 'mobile', 'mobiles'],
          'ipad': ['ipad', 'tablet', 'tab'],
          'laptop': ['laptop', 'macbook', 'notebook'],
          'headphone': ['headphone', 'headphones', 'audio'],
          'camera': ['camera', 'cameras'],
          'accessories': ['accessory', 'accessories', 'charger', 'cable']
        };

        const matchesAlias = (aliasKey) => {
          const variants = CATEGORY_ALIASES[aliasKey] || [];
          return variants.some(v => name.includes(v) || slug.includes(v) || cat === v);
        };

        return (
          (cat && cat === categoryFilter) ||
          name.includes(categoryFilter) ||
          slug.includes(categoryFilter) ||
          matchesAlias(categoryFilter)
        );
      })
    : baseProducts;

  // If the category filter produced no results from API/db, try matching the demo products as a fallback
  const demoMatches = DEMO_PRODUCTS.filter(p => {
    const cat = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const slug = (p.slug || '').toLowerCase();
    const CATEGORY_ALIASES = {
      'iphone': ['iphone', 'phone', 'mobile', 'mobiles'],
      'ipad': ['ipad', 'tablet', 'tab'],
      'laptop': ['laptop', 'macbook', 'notebook'],
      'headphone': ['headphone', 'headphones', 'audio'],
      'camera': ['camera', 'cameras'],
      'accessories': ['accessory', 'accessories', 'charger', 'cable']
    };
    const matchesAlias = (aliasKey) => {
      const variants = CATEGORY_ALIASES[aliasKey] || [];
      return variants.some(v => name.includes(v) || slug.includes(v) || cat === v);
    };
    return (
      (cat && cat === categoryFilter) ||
      name.includes(categoryFilter) ||
      slug.includes(categoryFilter) ||
      matchesAlias(categoryFilter)
    );
  });

  let finalProducts;
  if (displayProducts?.length) {
    finalProducts = displayProducts;
  } else if (categoryFilter) {
    finalProducts = demoMatches;
  } else {
    finalProducts = baseProducts;
  }
  // If the user navigated with a category param and there are no API results,
  // automatically enable demo mode so clicking categories never shows an empty page.
  useEffect(() => {
    if (categoryFilter && (!displayProducts || displayProducts.length === 0)) {
      setForceDemo(true);
    }
  // Only run when categoryFilter changes
  }, [categoryFilter]);

  const effectiveProducts = forceDemo ? DEMO_PRODUCTS : finalProducts;

  const getProductImages = (p) => {
    if (p?.images?.length) return p.images;
    if (PRODUCT_IMAGE_FALLBACK[p?.slug]) return [PRODUCT_IMAGE_FALLBACK[p.slug]];
    return [];
  };

  // Countdown state for discount banner
  const [countdown, setCountdown] = useState({ days: '310', hours: '02', minutes: '09', seconds: '02' });
  const countdownRef = useRef();

  useEffect(() => {
    // target 310 days from now
    const target = Date.now() + 310 * 24 * 60 * 60 * 1000;

    function update() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      setCountdown({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      });
    }

    update();
    countdownRef.current = setInterval(update, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  // show loading while products are being fetched
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home-page">
      {/* Self-Updating Hero Banner Section */}
      <SelfUpdatingBanner 
        banners={banners} 
        config={bannerConfig}
        className="hero-banner"
      />

      {/* Trending Categories */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Trending Categories</h2>
          <div className="categories-grid">
              {categories.map((cat, idx) => (
                <button
                  key={cat.name}
                  type="button"
                  className="category-card"
                  aria-label={`Browse ${cat.name} category`}
                  onClick={() => {
                    navigate(`/?category=${encodeURIComponent(cat.name)}#products`);
                    setTimeout(() => { const el = document.getElementById('products'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 120);
                  }}
                  onKeyDown={(e) => {
                    // allow Enter/Space to activate the button (button handles by default), keep extra handlers minimal
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.currentTarget.click();
                    }
                  }}
                >
                  <div className="category-icon">
                    {(() => { const { local, remote } = resolveImageSrc(`/uploads/${cat.imageFile}`); return (<img src={local || remote} alt={cat.name} title={cat.name} loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='; }} />); })()}
                  </div>
                  <h4>{cat.name}</h4>
                </button>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="promo-section">
        <div className="container">
          <div className="promo-banners">
            <div className="promo-banner">
              <div className="promo-content">
                <h3>Security Smart Camera</h3>
                <p>Just Start at $850</p>
                <button
                    type="button"
                    className="btn-promo"
                    aria-label="View Camera products"
                  onClick={() => {
                    const cat = 'Camera';
                    navigate(`/?category=${encodeURIComponent(cat)}#products`);
                    setTimeout(() => {
                      const el = document.getElementById('products');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 120);
                  }}
                >
                  Shop Now
                </button>
              </div>
              <div className="promo-image">
                {(() => { const { local, remote } = resolveImageSrc('/uploads/Security Smart Camera.png'); return (<img src={local || remote} alt="Camera" loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.style.opacity=0.15; }} />); })()}
              </div>
            </div>
            <div className="promo-banner">
              <div className="promo-content">
                <h3>ENTERTAINMENT & GAMES</h3>
                <p>Just Start at $450</p>
                <button
                    type="button"
                    className="btn-promo"
                    aria-label="View Entertainment and Games products"
                  onClick={() => {
                    const cat = 'ENTERTAINMENT & GAMES';
                    navigate(`/?category=${encodeURIComponent(cat)}#products`);
                    setTimeout(() => {
                      const el = document.getElementById('products');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 120);
                  }}
                >
                  Shop Now
                </button>
              </div>
              <div className="promo-image">
                {(() => { const { local, remote } = resolveImageSrc('/uploads/ENTERTAINMENT & GAMES.png'); return (
                  <img
                    src={local || remote}
                    alt="ENTERTAINMENT & GAMES"
                    loading="lazy"
                    width={220}
                    height={140}
                    onError={(e) => {
                      try {
                        if (remote && e.currentTarget.src !== remote) {
                          e.currentTarget.src = remote;
                          return;
                        }
                      } catch (err) {
                        // log and continue with fallback image
                        // eslint-disable-next-line no-console
                        console.warn('Failed to load remote image, using fallback', err);
                      }
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">No image</text></svg>';
                    }}
                    style={{ objectFit: 'contain' }}
                  />
                ); })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section className="latest-products" id="products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Latest Products</h2>
            <a
              href="/products#products"
              className="view-all-link"
              onClick={(e) => {
                e.preventDefault();
                navigate('/products#products');
              }}
            >
              View All Product
            </a>
          </div>
            <div className="grid">
            {effectiveProducts.slice(0, 5).map(p => {
              // ensure ProductCard always gets at least one image
              const images = getProductImages(p);
              const prod = { ...p, images };
              return <ProductCard key={p._id} p={prod} />;
            })}
          </div>
        </div>
      </section>

      {/* Discount Banner */}
      <section className="discount-banner">
        <div className="container">
          <div className="discount-content">
            <div className="discount-text">
              <span className="hurry-btn" aria-hidden="true">Hurry Up!</span>
              <h2>Up To 20% Discount Check it Out</h2>
              <div className="countdown">
                <div className="countdown-item"><span className="countdown-value">{countdown.days}</span><span className="countdown-label">DAYS</span></div>
                <div className="countdown-item"><span className="countdown-value">{countdown.hours}</span><span className="countdown-label">HRS</span></div>
                <div className="countdown-item"><span className="countdown-value">{countdown.minutes}</span><span className="countdown-label">MNS</span></div>
                <div className="countdown-item"><span className="countdown-value">{countdown.seconds}</span><span className="countdown-label">SEC</span></div>
              </div>
              <button type="button" className="btn-shop-now" aria-label="Shop discounted products">SHOP NOW</button>
            </div>
            <div className="discount-images">
              <div className="phone-image">
                {(() => { const { local, remote } = resolveImageSrc('/uploads/Iphone banner.png'); return (<img src={local || remote} alt="Iphone banner" loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='; }} />); })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="popular-products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Product</h2>
            <div className="category-filters" role="tablist" aria-label="Product categories">
              {filterOptions.map((f, i) => {
                const isActive = activeFilter === f;
                return (
                  <button
                    key={f}
                    ref={(el) => { buttonRefs.current[i] = el; }}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    className={`filter-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveFilter(f);
                      if (f === 'All') {
                        navigate('/#products');
                        setTimeout(() => { const el = document.getElementById('products'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 120);
                      } else {
                        navigate(`/?category=${encodeURIComponent(f)}#products`);
                        setTimeout(() => { const el = document.getElementById('products'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 120);
                      }
                    }}
                    onKeyDown={(e) => {
                      // arrow navigation between tabs
                      if (e.key === 'ArrowRight') {
                        const next = (i + 1) % filterOptions.length;
                        const el = buttonRefs.current[next];
                        if (el) el.focus();
                        e.preventDefault();
                      } else if (e.key === 'ArrowLeft') {
                        const prev = (i - 1 + filterOptions.length) % filterOptions.length;
                        const el = buttonRefs.current[prev];
                        if (el) el.focus();
                        e.preventDefault();
                      } else if (e.key === 'Enter' || e.key === ' ') {
                        // activate on Enter or Space
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid">
      {effectiveProducts.length === 0 ? (
              <div className="no-products">
                <p>No products found. Make sure the backend is running at <strong>{API_BASE}</strong> and that products are seeded or available via <code>/api/products</code>.</p>
                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => setForceDemo(true)}>Show demo products</button>
                  {forceDemo && (
                    <button className="btn" style={{ marginLeft: 8 }} onClick={() => setForceDemo(false)}>Hide demo products</button>
                  )}
                </div>
              </div>
              ) : (
  effectiveProducts.slice(0, 8).map(p => {
                  const images = getProductImages(p);
                  const prod = { ...p, images };
                  return <ProductCard key={p._id} p={prod} />;
                })
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <h2 className="section-title">⭐ Featured Products</h2>
            <div className="grid">
              {featuredProducts.map(p => <ProductCard key={p._id} p={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Blog & Events Section */}
      <section className="blog-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Blog & Events</h2>
            <Link to="/blog" className="view-all-link">View All →</Link>
          </div>
          <div className="blog-grid">
            <div className="blog-card">
              <div className="blog-image">
                {(() => { const { local, remote } = resolveImageSrc('/uploads/ Music magnate .png'); return (<img src={local || remote} alt="Music magnate" loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">No image</text></svg>'; }} />); })()}
              </div>
              <div className="blog-date">October 15, 2025</div>
              <h3>Music magnate speaker</h3>
            </div>
            <div className="blog-card">
              <div className="blog-image">
                {(() => { const { local, remote } = resolveImageSrc('/uploads/Macbook Labero and.jpg'); return (<img src={local || remote} alt="Macbook" loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">No image</text></svg>'; }} />); })()}
              </div>
              <div className="blog-date">October 15, 2025</div>
              <h3>Macbook air labore at dolore</h3>
            </div>
            <div className="blog-card">
              <div className="blog-image">
                {(() => { const { local, remote } = resolveImageSrc('/uploads/Music magnet Headphone.jpg'); return (<img src={local || remote} alt="Music headphone" loading="lazy" onError={(e)=>{ if (remote && e.currentTarget.src !== remote) e.currentTarget.src = remote; else e.currentTarget.src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">No image</text></svg>'; }} />); })()}
              </div>
              <div className="blog-date">October 15, 2025</div>
              <h3>Music magnate headphone</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Service Features */}
      <section className="service-features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📦</div>
              <h4>Free Delivery</h4>
              <p>And free returns. See checkout for delivery date.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💳</div>
              <h4>Pay monthly at 0% APR</h4>
              <p>Choose to checkout with Apple Card monthly instalments.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚙️</div>
              <h4>Personalize it</h4>
              <p>Engrave your device with your name or a personal note</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

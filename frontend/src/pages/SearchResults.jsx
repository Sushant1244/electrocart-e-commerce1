import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/api';
import ProductCard from '../components/ProductCard';
import { resolveImageSrc } from '../utils/resolveImage';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get('q') || '';
  
  // Search and filter state
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: params.get('category') || '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    inStock: false,
    sortBy: 'newest'
  });
  
  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    priceRange: { min: 0, max: 0 },
    ratings: [5, 4, 3, 2, 1]
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // Show filter panel on mobile
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, filters, location.search]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (query) searchParams.set('q', query);
      if (filters.category) searchParams.set('category', filters.category);
      if (filters.minPrice) searchParams.set('minPrice', filters.minPrice);
      if (filters.maxPrice) searchParams.set('maxPrice', filters.maxPrice);
      if (filters.rating) searchParams.set('rating', filters.rating);
      if (filters.inStock) searchParams.set('inStock', 'true');
      if (filters.sortBy) searchParams.set('sortBy', filters.sortBy);
      searchParams.set('page', pagination.page);
      searchParams.set('limit', 20);

      const res = await API.get(`/products/search?${searchParams.toString()}`);
      
      if (res.data.products) {
        setResults(res.data.products);
        setPagination(res.data.pagination || pagination);
        setFilterOptions(res.data.filters || filterOptions);
      } else {
        // Fallback to client-side filtering
        setResults(res.data);
      }
    } catch (e) {
      console.error('Search API failed', e);
      // Client-side fallback
      try {
        const allRes = await API.get('/products');
        let filtered = (allRes.data || []).filter(p => {
          const term = query.toLowerCase();
          return (p.name || '').toLowerCase().includes(term) ||
                 (p.description || '').toLowerCase().includes(term) ||
                 (p.category || '').toLowerCase().includes(term);
        });
        
        // Apply filters client-side
        if (filters.category) {
          filtered = filtered.filter(p => p.category === filters.category);
        }
        if (filters.minPrice) {
          filtered = filtered.filter(p => p.price >= Number(filters.minPrice));
        }
        if (filters.maxPrice) {
          filtered = filtered.filter(p => p.price <= Number(filters.maxPrice));
        }
        if (filters.rating) {
          filtered = filtered.filter(p => p.rating >= Number(filters.rating));
        }
        if (filters.inStock) {
          filtered = filtered.filter(p => (p.stock || p.countInStock || 0) > 0);
        }
        
        // Apply sorting
        switch (filters.sortBy) {
          case 'price-asc':
            filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
          case 'price-desc':
            filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
          case 'rating-desc':
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case 'name-asc':
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
          case 'name-desc':
            filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
          default:
            break;
        }
        
        setResults(filtered);
        setPagination({ ...pagination, total: filtered.length });
      } catch (err) {
        console.error('Fallback search failed', err);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      inStock: false,
      sortBy: 'newest'
    });
  };

  // Demo products fallback
  const DEMO_PRODUCTS = [
    { _id: 'demo1', name: 'Alpha Watch ultra', slug: 'alpha-watch-ultra', price: 3500, images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png'], stock: 10, featured: true, description: 'Demo Alpha Watch' },
    { _id: 'demo2', name: 'Wireless Headphones', slug: 'wireless-headphones', price: 3200, images: ['/uploads/Wireless Headphones.png'], stock: 25 },
    { _id: 'demo3', name: 'Homepad mini', slug: 'homepad-mini', price: 1200, images: ['/uploads/Homepad mini.png'], stock: 50 },
    { _id: 'demo4', name: 'MatrixSafe Charger', slug: 'matrixsafe-charger', price: 1700, images: ['/uploads/MatrixSafe Charger.png'], stock: 30 },
    { _id: 'demo5', name: 'Iphone 15 Pro max', slug: 'iphone-15-pro-max', price: 178900, images: ['/uploads/Iphone 15 pro ma.png'], stock: 15, featured: true },
    { _id: 'demo6', name: 'Macbook M2 Dark gray', slug: 'macbook-m2-dark-gray', price: 117000, images: ['/uploads/MacBook Air M4.png'], stock: 8 },
    { _id: 'demo7', name: 'Music Magnet Headphone', slug: 'music-magnet-headphone', price: 14500, images: ['/uploads/Music magnet Headphone.jpg'], stock: 20 },
    { _id: 'demo8', name: 'Security Smart Camera', slug: 'security-smart-camera', price: 850, images: ['/uploads/Security Smart Camera.png'], stock: 40 },
    { _id: 'demo9', name: 'Smart Box', slug: 'smart-box', price: 2999, images: ['/uploads/Smart Box.png'], stock: 12 },
    { _id: 'demo10', name: 'Macbook Air M3', slug: 'macbook-air-m3', price: 98000, images: ['/uploads/Macebook Air M3.png'], stock: 6 },
    { _id: 'demo11', name: 'Mini Speaker', slug: 'mini-speaker', price: 2400, images: ['/uploads/Mini Speaker.png'], stock: 35 },
    { _id: 'demo12', name: 'ENTERTAINMENT & GAMES Pack', slug: 'entertainment-games-pack', price: 450, images: ['/uploads/ENTERTAINMENT & GAMES.png'], stock: 50 }
  ];

  const displayResults = results.length > 0 ? results : 
    (loading ? [] : DEMO_PRODUCTS.filter(p => {
      const term = query.toLowerCase();
      return (p.name || '').toLowerCase().includes(term) ||
             (p.description || '').toLowerCase().includes(term);
    }));

  return (
    <div className="search-results-page">
      <div className="container">
        {/* Search Header */}
        <div className="search-header">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
          
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div className="search-content">
          {/* Filters Sidebar */}
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <button onClick={clearFilters} className="clear-filters">Clear All</button>
            </div>
            
            {/* Category Filter */}
            <div className="filter-group">
              <h4>Category</h4>
              <select 
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Price Range */}
            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
            </div>
            
            {/* Rating Filter */}
            <div className="filter-group">
              <h4>Rating</h4>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
              >
                <option value="">All Ratings</option>
                {filterOptions.ratings.map(r => (
                  <option key={r} value={r}>{r} Stars & Up</option>
                ))}
              </select>
            </div>
            
            {/* In Stock Filter */}
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                />
                In Stock Only
              </label>
            </div>
          </aside>
          
          {/* Results Area */}
          <div className="search-results">
            {/* Sorting and Results Count */}
            <div className="results-toolbar">
              <div className="results-count">
                {loading ? 'Searching...' : `${pagination.total} products found`}
                {query && ` for "${query}"`}
              </div>
              
              <div className="sort-options">
                <label>Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>
            
            {/* Loading State */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Searching products...</p>
              </div>
            ) : displayResults.length > 0 ? (
              <>
                {/* Products Grid */}
                <div className="products-grid">
                  {displayResults.map(p => (
                    <ProductCard key={p._id || p.id || p.slug} p={p} />
                  ))}
                </div>
                
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={pageNum === pagination.page ? 'active' : ''}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-results">
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
                <button onClick={clearFilters} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .search-results-page {
          padding: 20px 0;
        }
        
        .search-header {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .search-form {
          display: flex;
          flex: 1;
          min-width: 250px;
          gap: 10px;
        }
        
        .search-input {
          flex: 1;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .search-btn {
          padding: 12px 25px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .filter-toggle-btn {
          display: none;
          padding: 12px 20px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .filter-toggle-btn {
            display: block;
          }
        }
        
        .search-content {
          display: flex;
          gap: 30px;
        }
        
        .filters-sidebar {
          width: 250px;
          flex-shrink: 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          height: fit-content;
        }
        
        @media (max-width: 768px) {
          .filters-sidebar {
            display: none;
            width: 100%;
          }
          .filters-sidebar.show {
            display: block;
          }
        }
        
        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .filters-header h3 {
          margin: 0;
        }
        
        .clear-filters {
          background: none;
          border: none;
          color: #007bff;
          cursor: pointer;
          font-size: 14px;
        }
        
        .filter-group {
          margin-bottom: 20px;
        }
        
        .filter-group h4 {
          margin: 0 0 10px;
          font-size: 14px;
          color: #333;
        }
        
        .filter-group select,
        .filter-group input[type="number"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .price-inputs input {
          width: 80px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .search-results {
          flex: 1;
        }
        
        .results-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .results-count {
          color: #666;
        }
        
        .sort-options {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .sort-options select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .no-results {
          text-align: center;
          padding: 60px 20px;
        }
        
        .no-results h3 {
          margin-bottom: 10px;
        }
        
        .no-results p {
          color: #666;
          margin-bottom: 20px;
        }
        
        .btn-primary {
          padding: 12px 25px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 30px;
        }
        
        .pagination button {
          padding: 8px 14px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .pagination button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

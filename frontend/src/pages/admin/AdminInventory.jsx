import React, { useState, useEffect, useMemo } from 'react';
import API from '../../api/api';
import { Link } from 'react-router-dom';
import { resolveImageSrc } from '../../utils/resolveImage';

/**
 * AdminInventory - Inventory Management Page
 * Provides comprehensive stock management, low stock alerts, and bulk operations
 */
export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(10);

  // Low stock threshold
  const LOW_STOCK_THRESHOLD = 20;
  const CRITICAL_STOCK_THRESHOLD = 5;

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats).sort()];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'low') {
      result = result.filter(p => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD);
    } else if (stockFilter === 'critical') {
      result = result.filter(p => p.stock > 0 && p.stock <= CRITICAL_STOCK_THRESHOLD);
    } else if (stockFilter === 'out') {
      result = result.filter(p => p.stock === 0);
    } else if (stockFilter === 'in') {
      result = result.filter(p => p.stock > 0);
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'stock':
          aVal = Number(a.stock) || 0;
          bVal = Number(b.stock) || 0;
          break;
        case 'price':
          aVal = Number(a.price) || 0;
          bVal = Number(b.price) || 0;
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [products, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length;
    const criticalStock = products.filter(p => p.stock > 0 && p.stock <= CRITICAL_STOCK_THRESHOLD).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock)), 0);
    
    return { total, inStock, lowStock, criticalStock, outOfStock, totalValue };
  }, [products]);

  // Handle product selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  // Handle bulk restock
  const handleBulkRestock = async () => {
    if (!bulkAction || selectedProducts.length === 0) return;
    
    const quantity = parseInt(bulkAction);
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      await Promise.all(
        selectedProducts.map(id => 
          API.get(`/products/by-id/${id}`).then(res => {
            const product = res.data;
            const newStock = (Number(product.stock) || 0) + quantity;
            return API.put(`/products/${id}`, { stock: newStock });
          })
        )
      );
      alert(`Successfully restocked ${selectedProducts.length} products by ${quantity} units each`);
      setSelectedProducts([]);
      setBulkAction('');
      fetchProducts();
    } catch (err) {
      console.error('Bulk restock failed:', err);
      alert('Failed to restock some products');
    }
  };

  // Handle single product restock
  const handleRestock = async () => {
    if (!restockProduct || restockQuantity <= 0) return;
    
    try {
      const newStock = (Number(restockProduct.stock) || 0) + restockQuantity;
      await API.put(`/products/${restockProduct._id}`, { stock: newStock });
      alert(`Restocked ${restockProduct.name} by ${restockQuantity} units. New stock: ${newStock}`);
      setShowRestockModal(false);
      setRestockProduct(null);
      setRestockQuantity(10);
      fetchProducts();
    } catch (err) {
      console.error('Restock failed:', err);
      alert('Failed to restock product');
    }
  };

  // Handle stock update (set specific value)
  const handleUpdateStock = async (product, newStock) => {
    try {
      await API.put(`/products/${product._id}`, { stock: parseInt(newStock) });
      fetchProducts();
    } catch (err) {
      console.error('Stock update failed:', err);
      alert('Failed to update stock');
    }
  };

  // Get stock status class
  const getStockStatus = (stock) => {
    if (stock === 0) return 'out';
    if (stock <= CRITICAL_STOCK_THRESHOLD) return 'critical';
    if (stock < LOW_STOCK_THRESHOLD) return 'low';
    return 'in';
  };

  // Currency formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-NP', { 
      style: 'currency', 
      currency: 'NPR',
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-page">
        <div className="error-state">
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchProducts}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      {/* Page Header */}
      <div className="inventory-header">
        <div>
          <h1>📦 Inventory Management</h1>
          <p className="muted">Manage stock levels, track products, and handle restocking</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={fetchProducts}>
            🔄 Refresh
          </button>
          <Link to="/admin/add" className="btn-primary">
            ➕ Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.inStock}</span>
            <span className="stat-label">In Stock</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.lowStock}</span>
            <span className="stat-label">Low Stock</span>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <span className="stat-value">{stats.criticalStock}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
        <div className="stat-card error">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <span className="stat-value">{stats.outOfStock}</span>
            <span className="stat-label">Out of Stock</span>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="inventory-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={stockFilter} 
            onChange={(e) => setStockFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Stock Levels</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock (&lt;20)</option>
            <option value="critical">Critical (&lt;=5)</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="toolbar-right">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="price">Sort by Price</option>
            <option value="category">Sort by Category</option>
          </select>
          
          <button 
            className="sort-order-btn"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedProducts.length} product(s) selected</span>
          <div className="bulk-controls">
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="bulk-quantity"
            />
            <button className="btn-primary" onClick={handleBulkRestock}>
              Bulk Restock
            </button>
            <button 
              className="btn-outline" 
              onClick={() => setSelectedProducts([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No products found matching your criteria
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => {
                const stockStatus = getStockStatus(product.stock);
                const { local, remote } = resolveImageSrc(product.images?.[0]);
                const imageUrl = local || remote || '/vite.svg';
                
                return (
                  <tr key={product._id} className={`stock-${stockStatus}`}>
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                      />
                    </td>
                    <td className="product-cell">
                      <img 
                        src={imageUrl} 
                        alt={product.name}
                        className="product-thumbnail"
                        onError={(e) => { e.target.src = '/vite.svg'; }}
                      />
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        <span className="product-id muted">ID: {product._id?.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="sku-cell">{product.sku || '—'}</td>
                    <td>{product.category || '—'}</td>
                    <td className="price-cell">{formatCurrency(product.price)}</td>
                    <td className="stock-cell">
                      <input
                        type="number"
                        min="0"
                        value={product.stock || 0}
                        onChange={(e) => handleUpdateStock(product, e.target.value)}
                        className="stock-input"
                      />
                    </td>
                    <td>
                      <span className={`stock-badge ${stockStatus}`}>
                        {stockStatus === 'out' ? 'Out of Stock' : 
                         stockStatus === 'critical' ? 'Critical' :
                         stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn restock"
                        onClick={() => {
                          setRestockProduct(product);
                          setShowRestockModal(true);
                        }}
                        title="Restock"
                      >
                        📦
                      </button>
                      <Link 
                        to={`/admin/edit/${product._id}`}
                        className="action-btn edit"
                        title="Edit"
                      >
                        ✏️
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="inventory-footer">
        <span className="results-count">
          Showing {filteredProducts.length} of {products.length} products
        </span>
      </div>

      {/* Restock Modal */}
      {showRestockModal && restockProduct && (
        <div className="modal-overlay" onClick={() => setShowRestockModal(false)}>
          <div className="modal-content restock-modal" onClick={e => e.stopPropagation()}>
            <h3>📦 Restock Product</h3>
            <div className="modal-product-info">
              <img 
                src={restockProduct.images?.[0] || '/vite.svg'} 
                alt={restockProduct.name}
                onError={(e) => { e.target.src = '/vite.svg'; }}
              />
              <div>
                <strong>{restockProduct.name}</strong>
                <p className="muted">Current Stock: {restockProduct.stock || 0}</p>
              </div>
            </div>
            
            <div className="form-group">
              <label>Quantity to Add</label>
              <input
                type="number"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                autoFocus
              />
            </div>

            <div className="restock-preview">
              <span>New Stock Level:</span>
              <strong>{(restockProduct.stock || 0) + restockQuantity}</strong>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleRestock}>
                Confirm Restock
              </button>
              <button 
                className="btn-outline" 
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockProduct(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

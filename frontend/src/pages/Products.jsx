import React, { useEffect, useState } from 'react';
import API from '../api/api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await API.get('/products');
        if (!mounted) return;
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load products', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || 'Failed to load products');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="loading" style={{ padding: 20 }}>Loading products…</div>;
  if (error) return <div style={{ padding: 20 }}><strong>Error:</strong> {error}</div>;

  if (!products.length) return (
    <div style={{ padding: 20 }}>
      <h2>No products available</h2>
      <p>There are currently no products in the catalog.</p>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Products</h1>
      <div className="products-grid">
        {products.map(p => <ProductCard key={p._id || p.id || p.slug} p={p} />)}
      </div>
    </div>
  );
}
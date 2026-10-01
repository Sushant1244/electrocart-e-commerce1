import React, { useEffect, useState } from 'react';
import API from '../api/api';
import ProductCard from '../components/ProductCard';

export default function New() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Fetch products sorted by newest
        const res = await API.get('/products?sortBy=newest');
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

  if (loading) return <div className="loading" style={{ padding: 20 }}>Loading new products…</div>;
  if (error) return <div style={{ padding: 20 }}><strong>Error:</strong> {error}</div>;

  return (
    <div className="container" role="main" style={styles.container}>
      <h1 style={styles.heading}>New Arrivals</h1>
      <p style={styles.text}>Check out our latest products!</p>
      
      {!products.length ? (
        <div style={styles.emptyState}>
          <p>No new products available at the moment.</p>
        </div>
      ) : (
        <div className="products-grid" style={styles.grid}>
          {products.map(p => (
            <ProductCard key={p._id || p.id || p.slug} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
    marginBottom: '1rem',
    color: '#333',
  },
  text: {
    fontSize: 'clamp(1rem, 3vw, 1.25rem)',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
};

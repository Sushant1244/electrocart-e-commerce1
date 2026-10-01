import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';
import { Link } from 'react-router-dom';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(undefined);
  const [imageUrls, setImageUrls] = useState([]); // array of { local, remote, url }
  const [mainImageObj, setMainImageObj] = useState(null);
  const [liked, setLiked] = useState(false);
  const [uploadsIndex, setUploadsIndex] = useState(null);

  const DEMOS = {
    'alpha-watch-ultra': { _id: 'demo1', name: 'Alpha Watch ultra', slug: 'alpha-watch-ultra', price: 3500, images: ['/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png'], stock: 10, featured: true, description: 'Demo Alpha Watch' },
    'wireless-headphones': { _id: 'demo2', name: 'Wireless Headphones', slug: 'wireless-headphones', price: 3200, images: ['/uploads/Wireless Headphones.png'], stock: 25, description: 'Demo headphones' },
    'homepad-mini': { _id: 'demo3', name: 'Homepad mini', slug: 'homepad-mini', price: 1200, images: ['/uploads/Homepad mini.png'], stock: 50 },
    'matrixsafe-charger': { _id: 'demo4', name: 'MatrixSafe Charger', slug: 'matrixsafe-charger', price: 1700, images: ['/uploads/MatrixSafe Charger.png'], stock: 30 },
    'iphone-15-pro-max': { _id: 'demo5', name: 'Iphone 15 Pro max', slug: 'iphone-15-pro-max', price: 178900, images: ['/uploads/Iphone 15 pro ma.png'], stock: 15, featured: true },
    'macbook-m2-dark-gray': { _id: 'demo6', name: 'Macbook M2 Dark gray', slug: 'macbook-m2-dark-gray', price: 117000, images: ['/uploads/MacBook Air M4.png'], stock: 8 },
  };

  useEffect(() => {
    let cancelled = false;
    setProduct(undefined);
    if (!slug) { navigate('/'); return; }
    API.get(`/products/${slug}`).then(res => { if (!cancelled) setProduct(res.data); }).catch(err => {
      console.error('Failed to load product', err?.message || err);
      if (!cancelled) {
        const demo = DEMOS[slug] || Object.values(DEMOS).find(d => (d.slug === slug) || ((d.name || '').toLowerCase().includes((slug || '').replace(/-/g,' ').toLowerCase())));
        if (demo) setProduct(demo);
        else setProduct(null);
      }
    });
    return () => { cancelled = true; };
  }, [slug]);

  // load similar products (same category)
  const [similar, setSimilar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [formPhotos, setFormPhotos] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  useEffect(() => {
    if (!product || !product.category) return;
    let c = product.category;
    API.get(`/products?category=${encodeURIComponent(c)}`).then(res => {
      const list = (res.data || []).filter(p => (p._id || p.id) !== (product._id || product.id)).slice(0,8);
      setSimilar(list);
    }).catch(() => setSimilar([]));
  }, [product]);

  const fetchReviews = (page = 1, limit = 6) => {
    if (!product) return Promise.resolve();
    return API.get(`/products/${product._id || product.id}/reviews?page=${page}&limit=${limit}`).then(res => {
      if (res && res.data) {
        if (res.data.reviews) {
          setReviews(res.data.reviews);
          setReviewsTotal(res.data.total || 0);
        } else {
          setReviews(res.data || []);
          setReviewsTotal((res.data && res.data.length) || 0);
        }
      }
    }).catch(() => { setReviews([]); setReviewsTotal(0); });
  };

  useEffect(() => {
    setReviewsPage(1);
    fetchReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const loadMoreReviews = async () => {
    const next = reviewsPage + 1;
    const res = await API.get(`/products/${product._id || product.id}/reviews?page=${next}&limit=6`).catch(() => null);
    if (res && res.data) {
      const list = res.data.reviews || res.data || [];
      setReviews(prev => (prev || []).concat(list));
      setReviewsTotal(res.data.total || (reviewsTotal + list.length));
      setReviewsPage(next);
    }
  };

  // Helper to normalize many image shapes into a list of candidate paths
  const normalizeImages = (imgs) => {
    if (!imgs) return [];
    if (Array.isArray(imgs)) return imgs.slice();
    if (typeof imgs === 'string') {
      try { const p = JSON.parse(imgs); if (Array.isArray(p)) return p; } catch (e) {}
      if (imgs.includes(',')) return imgs.split(',').map(s=>s.trim()).filter(Boolean);
      return [imgs];
    }
    if (typeof imgs === 'object') return [imgs];
    return [String(imgs)];
  };

  // Load uploads index once on mount
  useEffect(() => {
    fetch('/uploads/_list.json')
      .then(res => res.json())
      .then(data => setUploadsIndex(data))
      .catch(() => setUploadsIndex(null));
  }, []);

  useEffect(() => {
    if (!product) {
      setImageUrls([]);
      setMainImageObj(null);
      setLiked(false);
      return;
    }
    const raw = normalizeImages(product.images || []);
    const candidates = [];
    for (let entry of raw) {
      if (!entry) continue;
      if (typeof entry === 'object') {
        if (entry.url) candidates.push(entry.url);
        else if (entry.path) candidates.push(entry.path);
        continue;
      }
      const s = String(entry).trim();
      if (!s) continue;
      if (s.startsWith('http') || s.startsWith('/')) candidates.push(s);
      else candidates.push(`/uploads/${s}`);
    }

    // fallback map
    const FALLBACK = {
      'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
      'alpha-watch-series': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
      'wireless-headphones': '/uploads/Wireless Headphones.png',
      'homepad-mini': '/uploads/Homepad mini.png',
      'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
      'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
      'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png',
      'music-magnet-headphone': '/uploads/Music magnet Headphone.jpg',
      'security-smart-camera': '/uploads/Security Smart Camera.png',
      'smart-box': '/uploads/Smart Box.png',
      'mini-speaker': '/uploads/Mini Speaker.png',
      'entertainment-games-pack': '/uploads/ENTERTAINMENT & GAMES.png',
      'iphone-16-pro-max': '/uploads/Iphone 16 pro ma.png',
      'ipad': '/uploads/Ipad.png',
      'camera': '/uploads/Camera.png',
      'headphone': '/uploads/Headphone.png'
    };

    const prodSlug = String(product.slug || product._id || product.id || '').toLowerCase();
    if (candidates.length === 0 && FALLBACK[prodSlug]) candidates.push(FALLBACK[prodSlug]);

    // helper: try to match a candidate path to an exact filename in uploadsIndex
    const matchToUploadList = (path) => {
      if (!uploadsIndex || !Array.isArray(uploadsIndex)) return path;
      // extract filename
      const fn = String(path).split('/').pop();
      // try exact match
      const exact = uploadsIndex.find(u => u === fn || u === ` ${fn}` || u.trim() === fn.trim());
      if (exact) return `/uploads/${exact}`;
      // try case-insensitive match ignoring extra spaces
      const cleaned = fn.replace(/\s+/g, ' ').trim().toLowerCase();
      const found = uploadsIndex.find(u => (u || '').replace(/\s+/g,' ').trim().toLowerCase() === cleaned);
      if (found) return `/uploads/${found}`;
      return path;
    };

    const resolved = candidates.map(c => {
      try {
        const adjusted = matchToUploadList(c.startsWith('/') ? c : `/uploads/${c}`);
        const { local, remote } = resolveImageSrc(adjusted.startsWith('/') ? adjusted : `/uploads/${adjusted}`);
        return { local, remote, url: (remote || local || adjusted) };
      } catch (e) { return { local: null, remote: null, url: c }; }
    });

    setImageUrls(resolved);
    setMainImageObj(resolved[0] || null);
  }, [product, uploadsIndex]);

  useEffect(() => {
    try {
      if (!product) return;
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const productId = product._id || product.id || product.slug;
      setLiked(wishlist.includes(productId));
    } catch (err) {
      setLiked(false);
    }
  }, [product]);

  if (product === undefined) return <div className="loading">Loading...</div>;
  if (product === null) return (
    <div className="product-page">
      <div className="loading-error">
        <h3>Product not available</h3>
        <p>The product details couldn't be loaded right now. You can try again or continue browsing.</p>
  <div className="action-row">
          <button className="btn" onClick={() => window.location.reload()}>Retry</button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
      {/* Similar products section */}
      <section className="similar-products">
        <h3>Similar products</h3>
        <div className="similar-scroller">
          {similar.map(p => {
            const img = (p.images && p.images[0]) || '/uploads/Last productt.png';
            return (
              <Link to={`/product/${p.slug || p._id || p.id}`} className="similar-item" key={p._id || p.id}>
                <div className="similar-thumb"><img src={img} alt={p.name} /></div>
                <div className="similar-title">{p.name}</div>
                <div className="similar-meta">Rs {p.price}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Ratings & Reviews section */}
      <section className="ratings-reviews">
        <div className="ratings-left">
          <h3>Ratings & Reviews</h3>
          <div className="rating-summary">
            <div className="rating-value">{(product.rating || 0).toFixed ? (product.rating || 0).toFixed(1) : product.rating}</div>
            <div className="rating-count">{product.numReviews || 0} Ratings & Reviews</div>
          </div>
        </div>
        <div className="reviews-list">
          {/* display a few placeholder review thumbnails from product images */}
          <div className="review-thumbs">
            {reviews.slice(0,8).map((r, i) => (
              <div className="rev-thumb" key={i}><img src={(r.user && r.user.avatar) || product.images?.[i] || '/uploads/Last productt.png'} alt={`rev-${i}`} /></div>
            ))}
          </div>
          <div className="review-cards">
            {reviews.slice(0,6).map((r, i) => (
              <div className="review-card" key={i}>
                <div className="rev-badge">{r.rating} ★</div>
                <div className="rev-text">{r.comment || 'No comment'}</div>
                {/* Display review photos if available */}
                {r.photos && r.photos.length > 0 && (
                  <div className="review-photos">
                    {r.photos.map((photo, idx) => (
                      <img key={idx} src={photo} alt={`Review ${i + 1} photo ${idx + 1}`} className="review-photo" />
                    ))}
                  </div>
                )}
                <div className="rev-user">{r.user?.name || r.user?.email || 'User'} • {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="review-card"><div className="rev-text">No reviews yet. Be the first to review this product.</div></div>
            )}
            {reviews.length > 0 && reviews.length < reviewsTotal && (
              <div className="mt-8"><button className="btn" onClick={loadMoreReviews}>Load more reviews</button></div>
            )}
          </div>
        </div>
      </section>
    </div>
  );

  const chosen = mainImageObj?.url || (imageUrls[0] && imageUrls[0].url) || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="520" height="400"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="20">No image</text></svg>';

  const addToCart = () => {
    if (product.stock === 0) { alert('This product is out of stock'); return; }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.product === product._id);
    if (existingIndex >= 0) cart[existingIndex].quantity += 1;
    else {
      const imgObj = mainImageObj || imageUrls[0] || null;
      cart.push({ product: product._id, name: product.name, price: product.price, quantity: 1, slug: product.slug, image: (imgObj && (imgObj.remote || imgObj.local)) || null });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart');
  };

  const buyNow = () => {
    if (product.stock === 0) { alert('This product is out of stock'); return; }
    try {
      const imgObj = mainImageObj || imageUrls[0] || null;
      const productId = product._id || product.id || product.slug;
      const item = { product: productId, name: product.name, price: product.price || 0, quantity: 1, slug: product.slug, image: (imgObj && (imgObj.remote || imgObj.local)) || null };
      localStorage.setItem('cart', JSON.stringify([item]));
      try { window.dispatchEvent(new CustomEvent('cartUpdated')); } catch (e) {}
      // send notification about purchase initiation (non-blocking)
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Get user ID for personalized notification
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          const userId = user && (user._id || user.id);
          API.post('/notifications', { title: 'Started checkout', body: `You started checkout for ${product.name}`, userId }).catch(() => {});
        }
      } catch (e) {}
      navigate('/checkout');
    } catch (err) { console.error('BuyNow failed', err); alert('Failed to proceed to checkout'); }
  };

  // (Buy Now removed from product detail page - keep Add to Cart here)

  return (
    <div className="product-page">
      <div className="images">
        <div className="main-image-wrap">
          <img
            src={chosen}
            alt={product.name}
            className="main-product-image"
            loading="lazy"
            onError={(e) => {
              try {
                const cur = e.currentTarget.src;
                const obj = imageUrls.find(o => o.url === cur || o.local === cur || o.remote === cur);
                if (obj && obj.remote && cur !== obj.remote) { e.currentTarget.src = obj.remote; return; }
              } catch (err) {}
              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="520" height="400"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="20">No image</text></svg>';
              e.currentTarget.onerror = null;
            }}
          />
          <button
            className={`fav-btn ${liked ? 'liked' : 'outline'}`}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                const productId = product._id || product.id || product.slug;
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                const exists = wishlist.includes(productId);
                const next = exists ? wishlist.filter(x => x !== productId) : [productId, ...wishlist];
                localStorage.setItem('wishlist', JSON.stringify(next));
                setLiked(!exists);
                try { window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { productId, added: !exists } })); } catch (err) {}
              } catch (err) {}
            }}
          >
            <span className="heart" aria-hidden>{liked ? '♥' : '♡'}</span>
          </button>
        </div>

        {imageUrls && imageUrls.length > 1 && (
          <div className="thumbnails">
            {imageUrls.map((obj, idx) => (
              <div
                key={(obj.url || '') + idx}
                className={`thumb ${mainImageObj && obj.url === mainImageObj.url ? 'active' : ''}`}
                onClick={() => setMainImageObj(obj)}
              >
                <img
                  src={obj.url}
                  alt={`${product.name} ${idx+1}`}
                  onError={(e) => {
                    try { if (obj.remote && e.currentTarget.src !== obj.remote) { e.currentTarget.src = obj.remote; return; } } catch(_ ){}
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

  <div className="info">
        {product.featured && <span className="featured-badge">⭐ Featured Product</span>}
  <h2>{product.name}</h2>
        <p className="category-badge">Category: {product.category || 'Uncategorized'}</p>
        <p className="description">{product.description || 'No description available.'}</p>
        <div className="price-stock">
          <h3>
            Rs {product.price}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="original-price" style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.9rem' }}>
                Rs {product.originalPrice}
              </span>
            )}
          </h3>
          <p className={product.stock > 0 ? 'stock-available' : 'stock-unavailable'}>
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </p>
        </div>
        {/* Rating moved to the side column for layout */}

        <div className="action-row">
          <button onClick={addToCart} disabled={product.stock === 0} className={product.stock === 0 ? 'btn-disabled' : ''}>
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button onClick={buyNow} disabled={product.stock === 0} className="btn-buy-now">
            Buy Now
          </button>
        </div>
      </div>

      {/* Right-side area for rating (dotted/boxed area) */}
      <div className="product-side">
        <div className="rating-box">
    <div className="product-rating rating-center">
            {[...Array(5)].map((_, i) => {
              const isFilled = i < Math.round(product.rating || 0);
              return (
                <span
                  key={i}
      className={`star ${isFilled ? 'filled' : ''} star-clickable`}
                  title={`Give ${i+1} star${i+1>1?'s':''}`}
                  onClick={async () => {
                    // require auth locally before attempting to post
                    const token = localStorage.getItem('token');
                    if (!token) { navigate('/login'); return; }
                    try {
                      const payload = { rating: i+1 };
                      const res = await API.post(`/products/${product._id || product.id}/reviews`, payload);
                      if (res && res.data) setProduct(res.data);
                      else {
                        const prevNum = Number(product.numReviews || 0);
                        const prevRating = Number(product.rating || 0);
                        const newNum = prevNum + 1;
                        const newRating = ((prevRating * prevNum) + (i+1)) / newNum;
                        setProduct({ ...product, rating: newRating, numReviews: newNum });
                      }
                      try { window.dispatchEvent(new CustomEvent('productRated')); } catch (e) {}
                    } catch (err) {
                      const status = err?.response?.status;
                      const serverMsg = err?.response?.data?.message || err?.message || 'Failed to submit rating';
                      if (status === 401) { navigate('/login'); return; }
                      console.error('Failed to submit rating', serverMsg, err);
                      alert(serverMsg);
                    }
                  }}
                >★</span>
              );
            })}
            <div className="rating-meta">{(product.rating || 0).toFixed ? (product.rating || 0).toFixed(1) : product.rating}{product.numReviews ? ` (${product.numReviews})` : ''}</div>
          </div>
        </div>
      </div>

      {/* Review form and list actions */}
      <div className="reviews-actions">
        <button className="btn" onClick={() => { setShowReviewForm(s => !s); }}>{showReviewForm ? 'Hide review form' : 'Write a review'}</button>
        <div className="rating-center">Average: {(product.rating || 0).toFixed ? (product.rating || 0).toFixed(1) : product.rating} • {product.numReviews || 0} reviews</div>
      </div>

      {showReviewForm && (
        <form className="review-form" encType="multipart/form-data" onSubmit={async (e) => {
          e.preventDefault();
          if (!formRating) { alert('Please select a rating'); return; }
          // ensure user is logged-in before posting
          const token = localStorage.getItem('token');
          if (!token) { navigate('/login'); return; }
          setSubmittingReview(true);
          try {
            // Use FormData to support file uploads
            const formData = new FormData();
            formData.append('rating', formRating);
            formData.append('comment', formComment);
            formPhotos.forEach(photo => {
              formData.append('photos', photo);
            });
            
            const res = await API.post(`/products/${product._id || product.id}/reviews`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            // refresh reviews and product aggregates
            await fetchReviews(1);
            // refresh product aggregate from server response if present
            if (res && res.data && res.data.rating) setProduct(res.data);
            setShowReviewForm(false);
            setFormComment(''); setFormRating(0); setFormPhotos([]);
          } catch (err) {
            const status = err?.response?.status;
            const serverMsg = err?.response?.data?.message || err?.message || 'Failed to submit review';
            if (status === 401) { navigate('/login'); return; }
            console.error('Review submit failed', serverMsg, err);
            alert(serverMsg);
          } finally {
            setSubmittingReview(false);
          }
          }}>
          <div className="review-form-stars">
            {[1,2,3,4,5].map(n => (
              <button type="button" key={n} className={`star-select ${formRating >= n ? 'selected' : ''}`} onClick={() => setFormRating(n)} aria-label={`${n} stars`}>★</button>
            ))}
          </div>
          <textarea className="review-comment" placeholder="Write your review (optional)" value={formComment} onChange={e => setFormComment(e.target.value)} />
          
          {/* Photo upload section */}
          <div className="review-photo-upload">
            <label className="photo-upload-label">
              <span>Add Photos (optional)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length + formPhotos.length > 5) {
                    alert('Maximum 5 photos allowed');
                    return;
                  }
                  setFormPhotos(prev => [...prev, ...files]);
                }}
                style={{ display: 'none' }}
              />
            </label>
            {formPhotos.length > 0 && (
              <div className="selected-photos">
                {formPhotos.map((photo, idx) => (
                  <div key={idx} className="photo-preview">
                    <img src={URL.createObjectURL(photo)} alt={`Preview ${idx + 1}`} />
                    <button type="button" className="remove-photo" onClick={() => {
                      setFormPhotos(prev => prev.filter((_, i) => i !== idx));
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="review-form-actions">
            <button className="btn btn-primary" type="submit" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit review'}
            </button>
            <button type="button" className="btn" onClick={() => { setShowReviewForm(false); setFormComment(''); setFormRating(0); setFormPhotos([]); }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
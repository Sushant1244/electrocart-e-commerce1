import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';

export default function ProductCard({ p }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const productId = p._id || p.id || p.productId || p.slug;
      setLiked(wishlist.includes(productId));
    } catch (err) {
      setLiked(false);
    }
  }, [p]);
  // Fallback map: when the API returns generic names (Image 1.png) or images are missing,
  // use a known filename from backend/uploads based on product slug.
  const UPLOAD_FALLBACK = {
    'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'wireless-headphones': '/uploads/Wireless Headphones.png',
    'homepad-mini': '/uploads/Homepad mini.png',
    'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
    'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
    'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png',
    'music-magnet-headphone': '/uploads/Music magnet Headphone.jpg',
    'security-smart-camera': '/uploads/Security Smart Camera.png',
    'smart-box': '/uploads/Smart Box.png',
    'macbook-air-m3': '/uploads/Macebook Air M3.png',
    'mini-speaker': '/uploads/Mini Speaker.png',
    'entertainment-games-pack': '/uploads/ENTERTAINMENT & GAMES.png',
    'iphone-16-pro-max': '/uploads/Iphone 16 pro ma.png',
    'ipad': '/uploads/Ipad.png',
    'ipad-air-m2': '/uploads/Ipad Air M2 mini.png',
    'camera': '/uploads/Camera.png',
    'hikvision-camera': '/uploads/Hikvision Camera.png',
    'headphone': '/uploads/Headphone.png',
    'accessories': '/uploads/Accessories.png',
    'iphone-lighting-cable': '/uploads/Iphone Lighting Cable.png',
    'iphone-banner': '/uploads/Iphone banner.png',
    'apple-watch': '/uploads/Apple Watch.png'
  };

  const getImageUrl = (img) => {
    if (!img) return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">No image</text></svg>';
    const { local, remote } = resolveImageSrc(Array.isArray(img) ? img[0] : img);
    // prefer local public/uploads first (fast and available during dev). fallback to remote backend
    return local || remote;
  };

  // prefer the first product image unless it's a generic 'Image X' filename
  const rawFirst = Array.isArray(p.images) ? p.images[0] : p.images;
  let img;
  const slugKey = String((p && (p.slug ?? p._id ?? p.id)) || '').toLowerCase();
  
  // Check if the image is a generic placeholder name that should use fallback
  const isGenericImage = rawFirst && (
    String(rawFirst).match(/^Image\s*\d+/i) || // Image 1, Image 2, etc.
    String(rawFirst).match(/^img_/i) || // img_123
    String(rawFirst).match(/^photo_/i) || // photo_123
    String(rawFirst).match(/^DSC/i) || // DSC_1234 (camera photos)
    String(rawFirst).toLowerCase() === 'null' ||
    !String(rawFirst).match(/\.(png|jpg|jpeg|webp|svg|gif)$/i)
  );
  
  if (rawFirst && !isGenericImage) img = getImageUrl(rawFirst);
  else if (UPLOAD_FALLBACK[slugKey]) img = getImageUrl(UPLOAD_FALLBACK[slugKey]);
  else if (p.name && /watch/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['alpha-watch-ultra']);
  else if (p.name && /iphone/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['iphone-15-pro-max']);
  else if (p.name && /ipad/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['ipad']);
  else if (p.name && /macbook|laptop/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['macbook-m2-dark-gray']);
  else if (p.name && /headphone|earbud|airpod/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['wireless-headphones']);
  else if (p.name && /camera/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['camera']);
  else if (p.name && /charger|cable/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['matrixsafe-charger']);
  else if (p.name && /speaker|audio/i.test(p.name)) img = getImageUrl(UPLOAD_FALLBACK['mini-speaker']);
  else img = getImageUrl(UPLOAD_FALLBACK['alpha-watch-ultra']);
  const rating = p.rating || 5;
  
  const addToCart = (e) => {
    // prevent the outer card link/navigation
    e?.preventDefault();
    e?.stopPropagation();
    // Require user to be logged in to add to cart
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (!user) {
        // Ask user to login and preserve current location so they can return
        if (confirm('You must be logged in to add items to cart. Go to login page now?')) {
          const returnUrl = encodeURIComponent(window.location.pathname + (p && p.slug ? `?product=${p.slug}` : ''));
          navigate(`/login?next=${returnUrl}`);
        }
        return;
      }
    } catch (err) {
      // if localStorage parse fails, treat as not logged in
      if (confirm('You must be logged in to add items to cart. Go to login page now?')) {
        const returnUrl = encodeURIComponent(window.location.pathname + (p && p.slug ? `?product=${p.slug}` : ''));
        navigate(`/login?next=${returnUrl}`);
      }
      return;
    }
    if (p.stock === 0) { alert('This product is out of stock'); return; }
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const productId = p._id || p.id || p.productId || p.slug;
      const existingIndex = cart.findIndex(item => item.product === productId);
      if (existingIndex >= 0) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
      } else {
          // prefer storing a concrete URL (local or remote) so cart rendering is robust
          let imageToStore = null;
          try {
            const candidate = (Array.isArray(p.images) ? p.images[0] : p.images) || UPLOAD_FALLBACK[(p.slug || '').toLowerCase()] || '';
            const { local, remote } = resolveImageSrc(candidate);
            // store remote first so images load even when local public uploads are not present
            imageToStore = remote || local || img || null;
          } catch (err) {
            imageToStore = img || null;
          }

          cart.push({
            product: productId,
            name: p.name,
            price: p.price || 0,
            quantity: 1,
            slug: p.slug,
            image: imageToStore
          });
          // quick debug: print what image URL we store
          // eslint-disable-next-line no-console
          console.log('addToCart: storing image for', productId, imageToStore);
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      // dispatch storage event so header listeners update immediately in same tab
  // notify other UI parts in the same tab that the cart changed
  try { window.dispatchEvent(new CustomEvent('cartUpdated')); } catch (err) { /* fallback */ }
      // send a notification to backend for this user (non-blocking)
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Get user ID for personalized notification
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          const userId = user && (user._id || user.id);
          // create a quick notification record for add-to-cart
          API.post('/notifications', { title: 'Added to cart', body: `You added ${p.name} to your cart.`, userId }).catch(() => {});
        }
      } catch (e) {}
      alert('Added to cart');
    } catch (err) {
      console.error('Add to cart failed', err);
      alert('Failed to add to cart');
    }
  };


  // Buy Now removed from product card per request
  
  return (
  <div className="product-card" onClick={(e) => {
      // If a child link handled the click, let it. Otherwise navigate programmatically.
      const tag = e.target && e.target.tagName && e.target.tagName.toLowerCase();
      if (tag === 'a' || tag === 'button' || tag === 'input') return;
      if (p?.slug) navigate(`/product/${p.slug}`);
    }}>
      {p.featured && <span className="featured-badge">⭐ Featured</span>}
  <Link to={`/product/${p.slug || p._id}`}>
        <div className="product-image-wrapper">
          <div className="image-square">
            <img
              src={img}
              alt={p.name}
              title={img}
              onError={(e) => {
                // If the browser failed to load the local asset, try remote backend URL once.
                try {
                  const { remote } = resolveImageSrc(Array.isArray(p.images) ? p.images[0] : p.images || '');
                  if (remote && e.currentTarget.src !== remote) {
                    e.currentTarget.src = remote;
                    return;
                  }
                } catch (err) {
                  // ignore
                }
                // fallback tiny transparent PNG
                e.currentTarget.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
                e.currentTarget.onerror = null;
              }}
            />
          </div>
          <button
            className={`card-fav ${liked ? 'liked' : 'outline'}`}
            aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(e) => {
              // prevent outer navigation/click handling
              e.preventDefault();
              e.stopPropagation();
              try {
                const productId = p._id || p.id || p.productId || p.slug;
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                const exists = wishlist.includes(productId);
                let next = [];
                if (exists) next = wishlist.filter(x => x !== productId);
                else next = [productId, ...wishlist];
                localStorage.setItem('wishlist', JSON.stringify(next));
                setLiked(!exists);
                // dispatch update event for header and wishlist page
                try { window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { productId, added: !exists } })); } catch (err) {}

                // create a backend notification for logged-in users (non-blocking)
                try {
                  const token = localStorage.getItem('token');
                  if (token) {
                    // include product metadata so the notification can render richer content
                    const productIdMeta = productId;
                    let imageToStore = null;
                    try {
                      const candidate = (Array.isArray(p.images) ? p.images[0] : p.images) || UPLOAD_FALLBACK[(p.slug || '').toLowerCase()] || '';
                      const { local, remote } = resolveImageSrc(candidate);
                      imageToStore = remote || local || img || null;
                    } catch (err) {
                      imageToStore = img || null;
                    }
                    // Get user ID for personalized notification
                    const user = JSON.parse(localStorage.getItem('user') || 'null');
                    const userId = user && (user._id || user.id);
                    API.post('/notifications', { title: (exists ? 'Removed from wishlist' : 'Added to wishlist'), body: `${p.name} ${exists ? 'removed from' : 'added to'} your wishlist.`, userId, meta: { productId: productIdMeta, slug: p.slug, image: imageToStore } }).catch(() => {});
                  }
                } catch (err) {}
              } catch (err) {
                // ignore storage errors
              }
            }}
          >
            <span className="heart" aria-hidden>{liked ? '♥' : '♡'}</span>
          </button>
        </div>

        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>
          ))}
        </div>

  <h4 className="product-title">{p.name}</h4>
        {p.description && (
          <p className="product-excerpt" title={p.description}>
            {p.description.length > 140 ? p.description.slice(0, 140) + '…' : p.description}
          </p>
        )}
        
        <div className="product-pricing">
          <span className="current-price">{p.price != null ? `Rs ${p.price?.toLocaleString()}` : <span className="no-price">Rs —</span>}</span>
          {p.originalPrice && p.originalPrice > p.price && (
            <span className="original-price">Rs {p.originalPrice?.toLocaleString()}</span>
          )}
        </div>
        {p.stock !== undefined && (
          <>
            {p.stock < 10 && p.stock > 0 && <p className="stock-warning">Only {p.stock} left!</p>}
            {p.stock === 0 && <p className="out-of-stock">Out of Stock</p>}
          </>
        )}
      </Link>
      {/* Add to cart button shown on card */}
      <div className="card-actions">
  <button className="btn-add-cart" onClick={addToCart} disabled={p.stock === 0}>
          {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
  {/* wishlist removed */}
  {/* Buy Now removed from product card */}
      </div>
    </div>
  );
}

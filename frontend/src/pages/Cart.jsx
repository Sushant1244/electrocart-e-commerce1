import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { resolveImageSrc } from '../utils/resolveImage';

export default function Cart() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (e) {
      return [];
    }
  });
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('appliedPromo') || 'null');
    } catch (e) {
      return null;
    }
  });
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  
  // Inventory validation
  const [inventoryStatus, setInventoryStatus] = useState({});

  // fallback map for known demo slugs
  const SLUG_FALLBACK = {
    'alpha-watch-ultra': '/uploads/Alpha Watch ultra ⭐ Featured Product Alpha Watch ultra.png',
    'wireless-headphones': '/uploads/Wireless Headphones.png',
    'homepad-mini': '/uploads/Homepad mini.png',
    'matrixsafe-charger': '/uploads/MatrixSafe Charger.png',
    'iphone-15-pro-max': '/uploads/Iphone 15 pro ma.png',
    'macbook-m2-dark-gray': '/uploads/MacBook Air M4.png'
  };

  useEffect(() => {
    let cancelled = false;

    const resolveImageForItem = async (item) => {
      if (!item) return null;
      // If item already has an encoded image URL string, keep it
      if (item.image && typeof item.image === 'string') return item.image;

      // Slug fallback
      if (item.slug && SLUG_FALLBACK[item.slug]) return SLUG_FALLBACK[item.slug];

      try {
        if (item.slug) {
          const res = await API.get(`/products/${item.slug}`);
          const prod = res.data;
          if (prod?.images?.[0]) {
            const { local, remote } = resolveImageSrc(prod.images[0].startsWith('/') ? prod.images[0] : `/uploads/${prod.images[0]}`);
            return local || remote || null;
          }
        }
        if (item.product) {
          const res = await API.get(`/products/by-id/${item.product}`);
          const prod = res.data;
          if (prod?.images?.[0]) {
            const { local, remote } = resolveImageSrc(prod.images[0].startsWith('/') ? prod.images[0] : `/uploads/${prod.images[0]}`);
            return local || remote || null;
          }
        }
      } catch (e) {
        // ignore network errors
      }
      return null;
    };

    (async () => {
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
      let changed = false;
      for (let i = 0; i < currentCart.length; i++) {
        const item = currentCart[i];
        if (!item.image || typeof item.image !== 'string') {
          // eslint-disable-next-line no-await-in-loop
          const resolved = await resolveImageForItem(item);
          if (resolved) {
            currentCart[i].image = resolved;
            changed = true;
          }
        }
        if (cancelled) return;
      }
      if (changed) {
        localStorage.setItem('cart', JSON.stringify(currentCart));
        setCart(currentCart);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
      // ignore
    }
  }, [cart]);
  
  // Check inventory when cart changes
  useEffect(() => {
    const checkInventory = async () => {
      const items = cart.map(item => ({
        productId: item.product || item._id,
        quantity: item.quantity || 1
      }));
      
      if (items.length === 0) return;
      
      try {
        const res = await API.post('/products/check-inventory', { items });
        if (res.data && res.data.items) {
          const status = {};
          res.data.items.forEach(item => {
            status[item.productId] = item;
          });
          setInventoryStatus(status);
        }
      } catch (e) {
        console.error('Inventory check failed', e);
      }
    };
    
    checkInventory();
  }, [cart]);

  // Save applied promo to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('appliedPromo', JSON.stringify(appliedPromo));
    } catch (e) {}
  }, [appliedPromo]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    
    try {
      const res = await API.post('/promo/validate', { 
        code: promoCode, 
        orderAmount: subtotal 
      });
      
      if (res.data && res.data.valid) {
        setAppliedPromo(res.data);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid promo code';
      setPromoError(msg);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const subtotal = cart.reduce((s, c) => s + (Number(c.price) || 0) * (Number(c.quantity) || 1), 0);
  const discount = appliedPromo?.discount || 0;
  const total = subtotal - discount;

  const navigate = useNavigate();

  // Redirect to checkout page where user can edit full address and then proceed to payment
  const checkout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to checkout');
      window.location.href = '/login';
      return;
    }
    navigate('/checkout');
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <a href="/" className="btn-primary">Continue Shopping</a>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((c, i) => (
              <div key={i} className="cart-item">
                <div className="cart-item-thumb">
                  {(() => {
                    let imgSrc = c.image || (c.slug && SLUG_FALLBACK[c.slug]) || null;
                    if (!imgSrc) return <div className="thumb-placeholder" />;

                    // If imgSrc is an object (sometimes added by older code), pick a sensible string
                    if (typeof imgSrc === 'object') {
                      imgSrc = imgSrc.local || imgSrc.remote || imgSrc.url || null;
                    }

                    if (!imgSrc || typeof imgSrc !== 'string') return <div className="thumb-placeholder" />;

                    const shouldPassThrough = imgSrc.startsWith('http') || imgSrc.startsWith('data:') || imgSrc.startsWith(window.location.origin) || imgSrc.startsWith('/');
                    const { local, remote } = resolveImageSrc(shouldPassThrough ? imgSrc : `/uploads/${imgSrc}`);
                    const finalSrc = local || remote;
                    if (!finalSrc) return <div className="thumb-placeholder" />;

                    return (
                      <img
                        src={finalSrc}
                        alt={c.name}
                        onError={(e) => {
                          try {
                            if (remote && e.currentTarget.src !== remote) {
                              e.currentTarget.src = remote;
                              return;
                            }
                          } catch (err) {
                            // ignore
                          }
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="Arial, Helvetica, sans-serif" font-size="12">No image</text></svg>';
                        }}
                      />
                    );
                  })()}
                </div>

                <div className="cart-item-info">
                  <h4>{c.name}</h4>
                  <p className="cart-item-price">Rs {c.price}</p>
                </div>
                <div className="cart-item-controls">
                  <label>
                    Quantity:
                    <input
                      type="number"
                      value={c.quantity || 1}
                      min="1"
                      max={inventoryStatus[c.product || c._id]?.availableQty || 99}
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        const stockInfo = inventoryStatus[c.product || c._id];
                        if (stockInfo && !stockInfo.available) {
                          alert(stockInfo.message || 'Item not available in requested quantity');
                          return;
                        }
                        const newCart = [...cart];
                        newCart[i].quantity = q;
                        setCart(newCart);
                      }}
                    />
                  </label>
                  {inventoryStatus[c.product || c._id] && !inventoryStatus[c.product || c._id].available && (
                    <p className="stock-warning">{inventoryStatus[c.product || c._id].message}</p>
                  )}
                  <p className="item-total">Rs {(c.price * (c.quantity || 1)).toFixed(2)}</p>
                  <button onClick={() => removeItem(i)} className="btn-remove">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            
            {/* Promo Code Section */}
            {!appliedPromo ? (
              <div className="promo-section">
                <div className="promo-input-group">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="promo-input"
                  />
                  <button 
                    onClick={applyPromoCode} 
                    className="promo-btn"
                    disabled={promoLoading || !promoCode.trim()}
                  >
                    {promoLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="promo-error">{promoError}</p>}
                <p className="promo-hint">Try: WELCOME10, SAVE20, or FLAT500</p>
              </div>
            ) : (
              <div className="applied-promo">
                <div className="promo-success">
                  <span className="promo-icon">✓</span>
                  <span>{appliedPromo.code} - {appliedPromo.description}</span>
                </div>
                <button onClick={removePromo} className="remove-promo">Remove</button>
              </div>
            )}
            
            <div className="summary-lines">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>Rs {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="summary-line discount">
                  <span>Discount</span>
                  <span>- Rs {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-line total">
                <span>Total</span>
                <span>Rs {total.toFixed(2)}</span>
              </div>
            </div>
            
            <button onClick={checkout} className="btn-checkout">Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  );
}
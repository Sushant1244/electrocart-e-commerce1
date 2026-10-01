import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

export default function Payment() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [khaltiReady, setKhaltiReady] = useState(false);
  const [khaltiError, setKhaltiError] = useState(null);
  
  // Saved cards state
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardType: 'debit',
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    nickname: '',
    isDefault: false
  });
  const [savingCard, setSavingCard] = useState(false);
  const [cardError, setCardError] = useState('');

  // Check if user is logged in
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
  })();
  const isLoggedIn = storedUser && storedUser._id;
  const isAdminUser = !!(storedUser && (storedUser.isAdmin === true || String(storedUser.isAdmin) === 'true'));

  // Load saved cards when component mounts (if user is logged in)
  useEffect(() => {
    if (isLoggedIn) {
      loadSavedCards();
    }
  }, [isLoggedIn]);

  const loadSavedCards = async () => {
    try {
      const res = await API.get('/payments/methods');
      setSavedCards(res.data || []);
      // Select default card if any
      const defaultCard = res.data?.find(c => c.isDefault);
      if (defaultCard) {
        setSelectedCard(defaultCard._id);
      }
    } catch (err) {
      console.error('Failed to load saved cards', err);
    }
  };

  // Preload khalti public key and widget when the user selects Khalti to make UI responsive
  useEffect(() => {
    let mounted = true;
    const prepare = async () => {
      if (method !== 'khalti') return;
      setKhaltiError(null);
      try {
        let publicKey = import.meta.env.VITE_KHALTI_PUBLIC_KEY || window.__KHALTI_PUBLIC_KEY__ || null;
          if (!publicKey) {
          try {
            const cfg = await API.get('/payments/khalti/config');
            publicKey = cfg?.data?.publicKey || null;
          } catch (e) {
            // If proxy call failed, try again using the configured API URL or the current origin.
            // Use the app's API client (axios) with an absolute URL so authentication headers are preserved.
            try {
              let base = import.meta.env.VITE_API_URL || window.location.origin;
              // normalize base: remove trailing '/api' or trailing slash to avoid double '/api'
              try {
                // strip trailing '/api' or '/api/'
                base = base.replace(/\/api\/?$/i, '').replace(/\/$/, '');
              } catch (normErr) { /* ignore */ }
              const cfg2 = await API.get(base + '/api/payments/khalti/config');
              publicKey = cfg2?.data?.publicKey || null;
            } catch (e2) {
              if (mounted) setKhaltiError('Failed to fetch Khalti config (proxy and direct fetch via API failed)');
            }
          }
        }
        if (!publicKey) throw new Error('Khalti public key not configured');
        // Load widget script if missing
        if (!window.KhaltiCheckout) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://khalti.com/static/khalti-checkout.js';
            s.async = true;
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load Khalti script'));
            document.head.appendChild(s);
          });
        }
        if (mounted) setKhaltiReady(true);
      } catch (e) {
        if (mounted) setKhaltiError(e && e.message ? e.message : String(e));
      }
    };
    prepare();
    return () => { mounted = false; };
  }, [method]);

  const cart = (() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; }
  })();
  const shippingAddress = (() => {
    try { return JSON.parse(localStorage.getItem('shippingAddress') || 'null'); } catch (e) { return null; }
  })();

  const total = cart.reduce((s,c) => s + (c.price || 0) * (c.quantity || 1), 0);

  // Handle adding a new card
  const handleAddCard = async (e) => {
    e.preventDefault();
    setCardError('');
    
    // Validate card fields
    const cardNum = newCard.cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNum)) {
      setCardError('Please enter a valid card number (13-19 digits)');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(newCard.expiryDate)) {
      setCardError('Please enter expiry date in MM/YY format');
      return;
    }
    if (!/^\d{3,4}$/.test(newCard.cvv)) {
      setCardError('Please enter a valid CVV (3-4 digits)');
      return;
    }
    if (!newCard.cardholderName.trim()) {
      setCardError('Please enter the cardholder name');
      return;
    }

    setSavingCard(true);
    try {
      const res = await API.post('/payments/methods', {
        cardType: newCard.cardType,
        cardNumber: cardNum,
        cardholderName: newCard.cardholderName,
        expiryDate: newCard.expiryDate,
        cvv: newCard.cvv,
        nickname: newCard.nickname || undefined,
        isDefault: newCard.isDefault
      });
      
      // Add new card to list
      setSavedCards([res.data, ...savedCards]);
      
      // Reset form
      setNewCard({
        cardType: 'debit',
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
        nickname: '',
        isDefault: false
      });
      setShowAddCard(false);
      
      // Select the new card if it's the only one or if it's set as default
      if (savedCards.length === 0 || newCard.isDefault) {
        setSelectedCard(res.data._id);
      }
    } catch (err) {
      setCardError(err.response?.data?.message || 'Failed to save card');
    } finally {
      setSavingCard(false);
    }
  };

  // Handle deleting a card
  const handleDeleteCard = async (cardId) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    
    try {
      await API.delete(`/payments/methods/${cardId}`);
      setSavedCards(savedCards.filter(c => c._id !== cardId));
      if (selectedCard === cardId) {
        setSelectedCard(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete card');
    }
  };

  // Handle setting a card as default
  const handleSetDefault = async (cardId) => {
    try {
      const res = await API.post(`/payments/methods/${cardId}/set-default`);
      setSavedCards(savedCards.map(c => ({
        ...c,
        isDefault: c._id === cardId
      })));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set default card');
    }
  };

  // Format card number for display
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const placeOrder = async () => {
    if (isAdminUser) return alert('Admin users are not allowed to place purchases via the public checkout. Use the Admin → Create Order tool to create orders for customers.');
    if (!shippingAddress) return alert('Please save a shipping address first');
    
    // If using saved card, validate selection
    if (method === 'card' && !selectedCard) {
      return alert('Please select a saved card or add a new one');
    }
    
    setLoading(true);
    try {
      const payload = { 
        items: cart, 
        shippingAddress, 
        total, 
        paymentMethod: method,
        // Include saved card info if using card payment
        ...(method === 'card' && selectedCard ? { savedCardId: selectedCard } : {})
      };
      const res = await API.post('/orders', payload);
      const created = res?.data;

      // If user chose Khalti, call backend initiate endpoint and redirect to Khalti payment page
    if (method === 'khalti' && created && created._id) {
        try {
      // Use Khalti client widget for smoother UX. Ensure public key exists in env
      let publicKey = import.meta.env.VITE_KHALTI_PUBLIC_KEY || window.__KHALTI_PUBLIC_KEY__ || null;
      // If preload detected an error, surface it now and avoid silent failure
      if (khaltiError) throw new Error('Khalti widget failed to initialise: ' + String(khaltiError));
          // If publicKey not available at build time, fetch from backend config endpoint
          if (!publicKey) {
            try {
              const cfg = await API.get('/payments/khalti/config');
              publicKey = cfg?.data?.publicKey || null;
            } catch (e) {
              console.warn('Failed to fetch khalti config from server', e);
            }
          }
          if (!publicKey) throw new Error('Khalti public key not configured');
          const khaltiAmount = Math.round(total * 100);
          // Load Khalti script dynamically if not present
          if (!window.KhaltiCheckout) {
            await new Promise((resolve, reject) => {
              const s = document.createElement('script');
              s.src = 'https://khalti.com/static/khalti-checkout.js';
              s.async = true;
              s.onload = resolve;
              s.onerror = reject;
              document.head.appendChild(s);
            });
          }
          if (!window.KhaltiCheckout) throw new Error('Khalti widget failed to load');

          const config = {
            publicKey: publicKey,
            productIdentity: created._id,
            productName: 'ElectroCart Order',
            productUrl: window.location.origin,
            eventHandler: {
              onSuccess: async (payload) => {
                try {
                  try {
                    const dbg = await API.post('/payments/khalti/debug-verify', { token: payload.token, amount: payload.amount, purchase_order_id: created._id });
                    console.debug('Khalti debug verify response', dbg && dbg.data);
                    if (!(dbg.status >= 200 && dbg.status < 300)) {
                      alert('Payment verification failed (provider). Details logged to console. Contact support with order id: ' + (created._id || created.id));
                      localStorage.removeItem('cart');
                      navigate('/orders', { state: { justPlacedOrderId: created._id } });
                      return;
                    }
                  } catch (dbgErr) {
                    console.warn('Debug verify call failed', dbgErr);
                  }

                  await API.post('/payments/khalti/verify', { token: payload.token, amount: payload.amount, purchase_order_id: created._id });
                  localStorage.removeItem('cart');
                  navigate('/orders', { state: { justPlacedOrderId: created._id } });
                } catch (err) {
                  console.error('Khalti verify failed', err);
                  alert('Payment verification failed. Please contact support. Order created and is pending.');
                  navigate('/orders', { state: { justPlacedOrderId: created._id } });
                }
              },
              onError: (err) => {
                console.error('Khalti checkout error', err);
                alert('Payment failed or cancelled.');
                navigate('/orders', { state: { justPlacedOrderId: created._id } });
              },
              onClose: () => {}
            }
          };

          const checkout = new window.KhaltiCheckout(config);
          checkout.show({ amount: khaltiAmount });
          return;
        } catch (e) {
          console.error('Khalti client flow failed', e && e.message ? e.message : e);
          localStorage.removeItem('cart');
          alert('Order created but payment flow failed to start. Please check your orders.\nError: ' + (e && e.message ? e.message : String(e)));
          if (created && created._id) navigate('/orders', { state: { justPlacedOrderId: created._id } }); else navigate('/');
          return;
        }
      }

      // Handle card payment (saved cards)
      if (method === 'card' && created && created._id) {
        // For demo purposes, we'll mark the order as paid since it's a saved card
        // In production, you'd process the payment via a payment gateway
        alert('Order placed successfully using saved card!');
        localStorage.removeItem('cart');
        navigate('/orders', { state: { justPlacedOrderId: created._id } });
        return;
      }

      // Non-Khalti flows: clear cart and navigate to orders
      localStorage.removeItem('cart');
      if (created && created._id) {
        if (method === 'esewa') {
          alert('Order created and pending payment via eSewa. Complete payment in eSewa using your order ID and then call Verify on the Orders page.');
        } else if (method === 'bank') {
          alert('Order created and pending bank transfer. Use the provided bank details and upload proof once transfer is done.');
        }
        navigate('/orders', { state: { justPlacedOrderId: created._id } });
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Place order failed', err);
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      if (!err?.response) {
        alert('Failed to place order — cannot reach backend server. Is the backend running?');
      } else if (status >= 500) {
        alert(serverMessage || 'Server error while placing order. Check backend logs.');
      } else {
        alert(serverMessage || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container payment-page">
      <h1>Checkout & Payment</h1>
      <div className="payment-grid">
        <main>
          <section className="card p-16 mb-16" aria-labelledby="pm-heading">
            <h2 id="pm-heading">Payment Method</h2>
            <div className="payment-methods mt-8" role="radiogroup" aria-label="Payment methods">
              <label className="flex items-center mb-10" style={{gap:12}}>
                <input aria-label="Cash on Delivery" type="radio" name="pm" value="cod" checked={method==='cod'} onChange={() => setMethod('cod')} />
                <div>
                  <div style={{fontWeight:600}}>Cash on Delivery</div>
                  <div className="small-muted">Pay when the order is delivered to your address.</div>
                </div>
              </label>

              <label className="flex items-center mb-10" style={{gap:12}}>
                <input aria-label="eSewa" type="radio" name="pm" value="esewa" checked={method==='esewa'} onChange={() => setMethod('esewa')} />
                <div>
                  <div style={{fontWeight:600}}>eSewa</div>
                  <div className="small-muted">Quick online payment via eSewa wallet.</div>
                </div>
              </label>

              <label className="flex items-center mb-10" style={{gap:12}}>
                <input aria-label="Khalti" type="radio" name="pm" value="khalti" checked={method==='khalti'} onChange={() => setMethod('khalti')} />
                <div>
                  <div style={{fontWeight:600}}>Khalti</div>
                  <div className="small-muted">Secure payment using Khalti.</div>
                </div>
              </label>

              <label className="flex items-center mb-10" style={{gap:12}}>
                <input aria-label="Bank Transfer" type="radio" name="pm" value="bank" checked={method==='bank'} onChange={() => setMethod('bank')} />
                <div>
                  <div style={{fontWeight:600}}>Bank Transfer</div>
                  <div className="small-muted">Manual bank transfer — upload proof after transfer.</div>
                </div>
              </label>

              {/* Credit/Debit Card Option */}
              <label className="flex items-center" style={{gap:12}}>
                <input aria-label="Credit/Debit Card" type="radio" name="pm" value="card" checked={method==='card'} onChange={() => setMethod('card')} />
                <div>
                  <div style={{fontWeight:600}}>Credit / Debit Card</div>
                  <div className="small-muted">Pay using your saved cards or add a new card.</div>
                </div>
              </label>
            </div>
          </section>

          {/* Saved Cards Section */}
          {method === 'card' && (
            <section className="card p-16 mb-16">
              <div className="flex" style={{justifyContent:'space-between', alignItems:'center'}}>
                <h3 className="mt-0">Your Saved Cards</h3>
                {!showAddCard && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowAddCard(true)}
                    style={{padding:'8px 16px', fontSize:'14px'}}
                  >
                    + Add New Card
                  </button>
                )}
              </div>
              
              {cardError && (
                <div style={{background:'#fff6f6', color:'#7a1b1b', padding:'12px', borderRadius:'4px', marginBottom:'16px'}}>
                  {cardError}
                </div>
              )}

              {/* Add New Card Form */}
              {showAddCard && (
                <form onSubmit={handleAddCard} style={{marginTop:'16px', padding:'16px', background:'#f9f9f9', borderRadius:'8px'}}>
                  <h4 style={{marginTop:0}}>Add New Card</h4>
                  
                  <div className="mb-12">
                    <label style={{display:'block', marginBottom:'4px', fontWeight:500}}>Card Type</label>
                    <select 
                      value={newCard.cardType}
                      onChange={(e) => setNewCard({...newCard, cardType: e.target.value})}
                      style={{width:'100%', padding:'10px', borderRadius:'4px', border:'1px solid #ddd'}}
                    >
                      <option value="debit">Debit Card</option>
                      <option value="credit">Credit Card</option>
                    </select>
                  </div>

                  <div className="mb-12">
                    <label style={{display:'block', marginBottom:'4px', fontWeight:500}}>Card Number *</label>
                    <input 
                      type="text"
                      value={newCard.cardNumber}
                      onChange={(e) => setNewCard({...newCard, cardNumber: formatCardNumber(e.target.value)})}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      style={{width:'100%', padding:'10px', borderRadius:'4px', border:'1px solid #ddd'}}
                    />
                  </div>

                  <div className="mb-12">
                    <label style={{display:'block', marginBottom:'4px', fontWeight:500}}>Cardholder Name *</label>
                    <input 
                      type="text"
                      value={newCard.cardholderName}
                      onChange={(e) => setNewCard({...newCard, cardholderName: e.target.value})}
                      placeholder="John Doe"
                      style={{width:'100%', padding:'10px', borderRadius:'4px', border:'1px solid #ddd'}}
                    />
                  </div>

                  <div className="flex" style={{gap:'12px'}}>
                    <div className="mb-12" style={{flex:1}}>
                      <label style={{display:'block', marginBottom:'4px', fontWeight:500}}>Expiry Date *</label>
                      <input 
                        type="text"
                        value={newCard.expiryDate}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2,4);
                          setNewCard({...newCard, expiryDate: val});
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        style={{width:'100%', padding:'10px', borderRadius:'4px', border:'1px solid #ddd'}}
                      />
                    </div>
                    <div className="mb-12" style={{flex:1}}>
                      <label style={{display:'block', marginBottom:'4px', fontWeight:500}}>CVV *</label>
                      <input 
                        type="text"
                        value={newCard.cvv}
                        onChange={(e) => setNewCard({...newCard, cvv: e.target.value.replace(/\D/g, '').slice(0,4)})}
                        placeholder="123"
                        maxLength={4}
                        style={{width:'100%', padding:'10px', borderRadius:'4px', border:'1px solid #ddd'}}
                      />
                    </div>
                  </div>

                  <div className="mb-12">
                    <label style={{display:'block', marginBottom:'4px', fontWeight:500}}>Nickname (optional)</label>
                    <input 
                      type="text"
                      value={newCard.nickname}
                      onChange={(e) => setNewCard({...newCard, nickname: e.target.value})}
                      placeholder="e.g., My Visa Card"
                      style={{width:'100%', padding:'10px', borderRadius:'4px', border:'1px solid #ddd'}}
                    />
                  </div>

                  <div className="mb-12">
                    <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                      <input 
                        type="checkbox"
                        checked={newCard.isDefault}
                        onChange={(e) => setNewCard({...newCard, isDefault: e.target.checked})}
                      />
                      Set as default payment method
                    </label>
                  </div>

                  <div className="flex" style={{gap:'12px'}}>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={savingCard}
                      style={{padding:'10px 20px'}}
                    >
                      {savingCard ? 'Saving...' : 'Save Card'}
                    </button>
                    <button 
                      type="button" 
                      className="btn"
                      onClick={() => {
                        setShowAddCard(false);
                        setCardError('');
                      }}
                      style={{padding:'10px 20px'}}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Cards List */}
              {!showAddCard && savedCards.length === 0 && (
                <div style={{textAlign:'center', padding:'24px', color:'#666'}}>
                  <p>You don't have any saved cards yet.</p>
                  <p>Add a card to save it for future purchases.</p>
                </div>
              )}

              {!showAddCard && savedCards.length > 0 && (
                <div style={{marginTop:'16px'}}>
                  {savedCards.map(card => (
                    <div 
                      key={card._id}
                      onClick={() => setSelectedCard(card._id)}
                      style={{
                        padding:'12px 16px',
                        border: `2px solid ${selectedCard === card._id ? '#007bff' : '#ddd'}`,
                        borderRadius:'8px',
                        marginBottom:'8px',
                        cursor:'pointer',
                        background: selectedCard === card._id ? '#f0f7ff' : 'white',
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center'
                      }}
                    >
                      <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <input 
                          type="radio" 
                          name="savedCard" 
                          checked={selectedCard === card._id}
                          onChange={() => setSelectedCard(card._id)}
                        />
                        <div>
                          <div style={{fontWeight:600}}>
                            {card.cardBrand} •••• {card.cardNumberLast4}
                            {card.isDefault && <span style={{marginLeft:'8px', fontSize:'11px', background:'#28a745', color:'white', padding:'2px 6px', borderRadius:'4px'}}>Default</span>}
                          </div>
                          <div className="small-muted">{card.cardholderName} | Expires {card.expiryDate}</div>
                          {card.nickname && <div className="small-muted">{card.nickname}</div>}
                        </div>
                      </div>
                      <div style={{display:'flex', gap:'8px'}}>
                        {!card.isDefault && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(card._id);
                            }}
                            style={{padding:'4px 8px', fontSize:'12px', background:'transparent', border:'1px solid #ddd', borderRadius:'4px', cursor:'pointer'}}
                          >
                            Set Default
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card._id);
                          }}
                          style={{padding:'4px 8px', fontSize:'12px', background:'transparent', border:'1px solid #dc3545', color:'#dc3545', borderRadius:'4px', cursor:'pointer'}}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {method === 'card' && !isLoggedIn && (
                <div style={{marginTop:'16px', padding:'12px', background:'#fff3cd', borderRadius:'4px'}}>
                  <a href="/login" style={{color:'#856404'}}>Login</a> to save your cards for faster checkout.
                </div>
              )}
            </section>
          )}

          {method === 'khalti' && khaltiError && (
            <div className="card p-12 mb-16" style={{background:'#fff6f6', color:'#7a1b1b'}}>
              <strong>Khalti unavailable:</strong> {khaltiError}. You can still place the order and complete payment later.
            </div>
          )}

          {method === 'bank' && (
            <section className="card p-16 mb-16">
              <h3 className="mt-0">Bank transfer details</h3>
              <p style={{margin:0}}>Account: <strong>1234567890</strong></p>
              <p style={{margin:0}}>Bank: <strong>Example Bank</strong></p>
              <p style={{margin:0}}>IFSC: <strong>EXAMP0001</strong></p>
              <p className="mt-8 small-muted">Please make the transfer and use your order ID as reference. Upload transfer proof in your order details later.</p>
            </section>
          )}

          <div className="flex" style={{gap:12}}>
            <button className="btn btn-primary" onClick={placeOrder} disabled={loading} aria-disabled={loading}>
              {loading ? 'Placing order…' : `Pay Rs ${total.toFixed(2)}`}
            </button>
            <button className="btn" onClick={() => navigate('/cart')} disabled={loading}>Back to Cart</button>
          </div>
        </main>

        <aside>
          <div className="card order-summary p-16">
            <h3 style={{marginTop:0}}>Order Summary</h3>
            <div style={{marginTop:8}}>
              {cart.length === 0 ? <div>No items in cart</div> : (
                <div>
                  {cart.map((c) => (
                    <div key={c._id || c.id || c.slug || c.name} className="item">
                      <div className="img-48">
                        <img src={c.image || ''} alt={c.name} className="img-100pct" />
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600}}>{c.name}</div>
                        <div className="small-muted">Qty: {c.quantity || 1}</div>
                      </div>
                      <div style={{fontWeight:600}}>Rs {(c.price || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr />
            <div className="totals">
              <div>Total</div>
              <div>Rs {total.toFixed(2)}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

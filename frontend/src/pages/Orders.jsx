import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/orders/my');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Load orders failed', err);
      if (!err?.response) {
        setError('Cannot reach backend server. Is the API running?');
      } else if (err.response.status === 401) {
        // token invalid or missing — force re-login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      } else {
        setError(err.response.data?.message || 'Failed to load your orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTracking = async (orderId) => {
    setTrackingLoading(true);
    try {
      const res = await API.get(`/orders/track/${orderId}`);
      setTracking(res.data || null);
    } catch (err) {
      console.error('Failed to load tracking', err);
      alert(err?.response?.data?.message || 'Failed to load tracking information');
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  // If we navigated here right after placing an order, auto-open tracking
  useEffect(() => {
    const justPlacedId = location?.state?.justPlacedOrderId;
    if (justPlacedId) {
      // clear state in history to avoid reopening on back/refresh
      try { window.history.replaceState({}, document.title); } catch (e) {}
      loadTracking(justPlacedId);
    }
  }, [location]);

    if (loading) return <div className="loading">Loading your orders...</div>;

    if (error) {
      return (
        <div className="container page">
          <h1>My Orders</h1>
          <div>
            <div style={{color:'#b91c1c', marginBottom:12}}>{error}</div>
            <button className="btn" onClick={loadOrders}>Retry</button>
          </div>
        </div>
      );
    }

    if (!orders || orders.length === 0) {
      return (
        <div className="container page">
          <h1>My Orders</h1>
          <p>You have no orders yet.</p>
        </div>
      );
    }

    return (
      <div className="container page">
        <h1>My Orders</h1>
        <div className="orders-grid">
          {orders.map(o => (
            <div key={o._id} className="order-card">
              <h3>Order #{String(o._id).slice(-8)}</h3>
              <p><strong>Date:</strong> {new Date(o.createdAt).toLocaleString()}</p>
              <p><strong>Total:</strong> Rs {(o.totalPrice || o.total || 0).toFixed(2)}</p>
              <p><strong>Status:</strong> {o.status}</p>
              <div>
                <strong>Shipping Address</strong>
                <div>{o.shippingAddress?.fullName || o.shippingAddress?.name || ''}</div>
                <div>{o.shippingAddress?.line1 || o.shippingAddress?.address}</div>
                <div>{o.shippingAddress?.line2}</div>
                <div>{o.shippingAddress?.city} {o.shippingAddress?.postalCode}</div>
                <div>{o.shippingAddress?.country}</div>
              </div>
              <div className="order-items">
                <strong>Items:</strong>
                {o.items?.map((it, idx) => (
                  <div key={it._id || it.id || it.product?.id || idx}>{it.product?.name || it.name || 'Product'} - Qty: {it.quantity} - Rs {it.price}</div>
                ))}
              </div>
              <div style={{marginTop:12}}>
                <button className="btn" onClick={() => loadTracking(o._id)}>Track delivery</button>
                {/* For bank transfer: allow user to upload proof */}
                {String((o.paymentMethod || o.method || '')).toLowerCase() === 'bank' && (
                  <>
                    <label style={{marginLeft:8}} className="btn">
                      Upload proof
                      <input type="file" style={{display:'none'}} onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        if (!confirm('Upload this file as payment proof for the order?')) return;
                        const fd = new FormData(); fd.append('proof', file);
                        try {
                          const res = await API.post(`/orders/${o._id}/proof`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                          alert('Proof uploaded successfully');
                          await loadOrders();
                        } catch (err) {
                          console.error('Upload proof failed', err);
                          alert(err?.response?.data?.message || 'Failed to upload proof');
                        }
                      }} />
                    </label>
                  </>
                )}
                {/* For eSewa: allow pasting token to verify */}
                {String((o.paymentMethod || o.method || '')).toLowerCase() === 'esewa' && (
                  <button className="btn" style={{marginLeft:8}} onClick={async () => {
                    const token = prompt('Paste eSewa payment token/transaction id here to verify:');
                    if (!token) return;
                    try {
                      // amount: use order total if available
                      const amount = o.totalPrice || o.total || 0;
                      const res = await API.post('/payments/esewa/verify', { token, amount, orderId: o._id });
                      if (res && res.data && res.data.ok) {
                        alert('eSewa payment verified successfully');
                        await loadOrders();
                      } else {
                        alert('Verification response: ' + JSON.stringify(res.data || res));
                      }
                    } catch (err) {
                      console.error('eSewa verify failed', err);
                      alert(err?.response?.data?.message || 'Failed to verify eSewa payment');
                    }
                  }}>Verify eSewa payment</button>
                )}
                {/* Cancel order button: only show when order can be cancelled client-side */}
                {['processing','pending'].includes((o.status||'').toLowerCase()) && (
                  <button
                    className="btn btn-danger"
                    style={{marginLeft:8}}
                    onClick={async () => {
                      if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
                      try {
                        const res = await API.patch(`/orders/${o._id}/cancel`);
                        alert('Order cancelled successfully');
                        // refresh orders and optionally open tracking for updated order
                        await loadOrders();
                      } catch (err) {
                        console.error('Cancel failed', err);
                        alert(err?.response?.data?.message || 'Failed to cancel order');
                      }
                    }}
                  >
                    Cancel order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {tracking && (
          <div className="modal-overlay" onClick={() => setTracking(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Tracking for Order #{String(tracking._id).slice(-8)}</h3>
              <p><strong>Tracking number:</strong> {tracking.trackingNumber || '—'}</p>
              <div className="tracking-timeline">
                {(tracking.deliveryUpdates || []).map((u, i) => (
                  <div key={i} className="timeline-item">
                    <div className="ti-left">{new Date(u.timestamp || u.date || u.createdAt || Date.now()).toLocaleString()}</div>
                    <div className="ti-mid">{u.status}</div>
                    <div className="ti-right">{u.location || ''}<div className="muted small">{u.note}</div></div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12}}><button className="btn" onClick={() => setTracking(null)}>Close</button></div>
            </div>
          </div>
        )}
      </div>
    );
}

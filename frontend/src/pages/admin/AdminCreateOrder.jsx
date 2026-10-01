import React, { useState } from 'react';
import API from '../../api/api';

export default function AdminCreateOrder() {
  const [email, setEmail] = useState('');
  const [itemsJson, setItemsJson] = useState('[]');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      // Resolve userId by email via backend (simple endpoint may not exist) — we'll accept email as userId fallback
      // For now use email directly as userId if backend accepts it; better: add users lookup endpoint.
      let items = [];
      try { items = JSON.parse(itemsJson || '[]'); } catch (err) { return setMessage('Invalid items JSON'); }
      if (!Array.isArray(items) || items.length === 0) return setMessage('Please provide at least one item');

      const payload = { items, shippingAddress: { fullName: 'Customer', line1: 'TBD', city: 'TBD', country: 'TBD' }, total: items.reduce((s,i)=> s + ((i.price||0)*(i.quantity||1)), 0), paymentMethod: 'cod', userId: email };
      const res = await API.post('/orders', payload);
      setMessage(res?.data?._id ? `Order created: ${res.data._id}` : 'Order created');
      setItemsJson('[]');
    } catch (err) {
      setMessage(err?.response?.data?.message || err.message || 'Failed to create order');
    } finally { setLoading(false); }
  };

  return (
    <div className="container" style={{padding:20}}>
      <h2>Create Order for Customer</h2>
      <p>Enter customer email (used as userId lookup) and JSON array of items.</p>
      <form onSubmit={submit}>
        <div style={{marginBottom:10}}>
          <label style={{display:'block',marginBottom:6}}>Customer email (userId)</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="customer@example.com" style={{width:'100%',padding:8}} />
        </div>
        <div style={{marginBottom:10}}>
          <label style={{display:'block',marginBottom:6}}>Items JSON</label>
          <textarea value={itemsJson} onChange={e=>setItemsJson(e.target.value)} rows={6} style={{width:'100%',padding:8,fontFamily:'monospace'}} />
          <small>Example: <code>[{{"name":"Watch","price":199.99,"quantity":1}}]</code></small>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create Order'}</button>
        </div>
      </form>
      {message && <div style={{marginTop:12}}><strong>{message}</strong></div>}
    </div>
  );
}

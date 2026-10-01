import React from 'react';
import { Link } from 'react-router-dom';
import './admin.css';

export default function AdminWelcome(){
  return (
    <div className="admin-dashboard">
      <div className="welcome-banner card">
        <div className="welcome-inner">
          <div>
            <h1>Welcome, Admin</h1>
            <p className="muted">Use the admin panel to manage products, orders and view analytics.</p>
            <div style={{marginTop:12}}>
              <Link to="/admin" className="btn-primary" style={{marginRight:8}}>Go to Dashboard</Link>
              <Link to="/" className="btn-outline">Back to Store</Link>
            </div>
          </div>
          <div className="welcome-graphic" aria-hidden>
            {/* simple decorative graphic */}
            <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="220" height="120" rx="12" fill="#eef2ff"/>
              <circle cx="60" cy="60" r="30" fill="#7c3aed" />
              <rect x="110" y="36" width="80" height="12" rx="6" fill="#c7baf9"/>
              <rect x="110" y="60" width="60" height="12" rx="6" fill="#c7baf9"/>
            </svg>
          </div>
        </div>
      </div>

      <section style={{marginTop:16}}>
        <div className="card" style={{padding:16}}>
          <h3>Quick Links</h3>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <Link to="/admin/add" className="btn-outline">Add product</Link>
            <Link to="/admin/orders" className="btn-outline">Orders</Link>
            <Link to="/admin" className="btn-outline">Dashboard</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

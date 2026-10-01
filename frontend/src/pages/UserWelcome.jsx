import React from 'react';
import { Link } from 'react-router-dom';
import './admin/admin.css';

export default function UserWelcome(){
  return (
    <div className="container" style={{paddingTop:24}}>
      <div className="card" style={{padding:20}}>
        <h1>Welcome to ElectroCart</h1>
        <p className="muted">Find the best deals curated just for you. Use the navigation to browse categories or check your orders.</p>
        <div style={{marginTop:12, display:'flex', gap:8}}>
          <Link to="/products" className="btn-primary">Shop Products</Link>
          <Link to="/orders" className="btn-outline">My Orders</Link>
          <Link to="/" className="btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
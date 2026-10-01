import React, { useState } from 'react';
import API from '../api/api';
import { Link } from 'react-router-dom';

export default function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address');
      return;
    }
    
    try {
      const res = await API.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSubmitted(true);
        if (res.data.resetToken) {
          setResetToken(res.data.resetToken); // In production, this would be sent via email
        }
      } else {
        alert(res.data.message || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send reset email. Please try again.';
      alert(errorMessage);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Check Your Email</h2>
          <p>If an account exists with that email, a password reset link has been sent.</p>
          {resetToken && (
            <div className="token-info">
              <p><strong>Development Token (for testing only):</strong></p>
              <code style={{ wordBreak: 'break-all', display: 'block', padding: '0.5rem', background: '#f3f4f6', borderRadius: '4px', margin: '0.5rem 0' }}>{resetToken}</code>
              <p className="small-text">In production, use the link sent to your email</p>
              <Link to={`/reset-password?token=${resetToken}`} className="btn-auth-primary" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                Reset Password
              </Link>
            </div>
          )}
          {!resetToken && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                If an account exists with this email, please check your inbox for the reset link.
              </p>
              <Link to="/login" className="btn-auth-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          )}
          <Link to="/login" className="back-link">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="auth-subtitle">Enter your email to receive a password reset link</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-primary">Send Reset Link</button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}


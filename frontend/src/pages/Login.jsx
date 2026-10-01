import React, { useState } from 'react';
import API from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ onLogin }){
  const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5001/api')).replace(/\/$/, '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });

      if (res.data.requiresTwoFactor) {
        setTwoFactorRequired(true);
        setError('Enter the code from your authenticator app or use a backup code.');
        return;
      }
      
      // Check if email is verified (skip for admin users)
      const userData = res.data.user;
      if (userData.isAdmin !== true && userData.emailVerified === false) {
        // Store user data temporarily and redirect to verify email
        localStorage.setItem('user', JSON.stringify({ 
          ...userData, 
          emailVerified: false 
        }));
        setError('Please verify your email before logging in. A new verification code has been sent.');
        
        // Try to resend verification code
        try {
          await API.post('/auth/resend-verification', { email });
        } catch (resendErr) {
          // Ignore resend errors, user can request manually
        }
        
        setLoading(false);
        return;
      }
      
      // onLogin now returns the normalized user object
      const normalizedUser = onLogin(res.data.user);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      // Redirect admin to admin panel, customer to home
      if (normalizedUser?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      // Surface server validation messages and network errors for clearer feedback
      const serverMsg = err?.response?.data?.message;
      const status = err?.response?.status;
      if (serverMsg) {
        setError(serverMsg + (status ? ` (status ${status})` : ''));
      } else if (err.request && !err.response) {
        // Network error / backend unreachable
        setError(`Unable to contact backend at ${API_BASE}.\nPlease start the backend: open a terminal and run:\ncd backend && npm install && npm run dev`);
      } else if (err.message) {
        setError('Login failed: ' + err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactor = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/2fa/verify', { code: twoFactorCode.trim() });
      const normalizedUser = onLogin(res.data.user);
      navigate(normalizedUser?.isAdmin ? '/admin' : '/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Two-factor verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Please enter your credentials to login</p>

        {error && (
          <div className="error-message">
            {error}
            {error.includes('verify') && (
              <Link to="/verify-email" style={{ display: 'block', marginTop: '0.5rem', fontWeight: 600 }}>
                Click here to verify your email →
              </Link>
            )}
          </div>
        )}

        {twoFactorRequired ? (
          <form onSubmit={verifyTwoFactor} className="auth-form">
            <div className="form-group">
              <label>Authenticator or backup code</label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value)}
                placeholder="Enter your code"
                autoComplete="one-time-code"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify and sign in'}
            </button>
          </form>
        ) : (
        <form onSubmit={login} className="auth-form">
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
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={e=>setRememberMe(e.target.checked)}
                disabled={loading}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>

          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        )}

        

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

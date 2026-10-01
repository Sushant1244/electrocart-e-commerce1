import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail({ user, onVerified }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const navigate = useNavigate();

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Safely read stored user email from localStorage. JSON.parse can throw if the value is 'null' or malformed,
  // which previously caused the page to crash and other sections (e.g. blog) to not render.
  let storedEmail = '';
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      storedEmail = parsed && parsed.email ? parsed.email : '';
    }
  } catch (e) {
    // ignore parse errors and fallback to empty email
    storedEmail = '';
  }

  const email = user?.email || storedEmail || '';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    
    try {
      setLoading(true);
      await API.post('/auth/verify-email', { email, code });
      
      // Update localStorage user
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      u.emailVerified = true;
      localStorage.setItem('user', JSON.stringify(u));
      
      setSuccess(true);
      
      // Show success briefly then navigate
      setTimeout(() => {
        if (onVerified) onVerified(u);
        navigate('/');
      }, 1500);
      
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg?.includes('expired')) {
        setError('The verification code has expired. Please request a new one.');
      } else if (msg?.includes('Invalid')) {
        setError('Invalid verification code. Please check and try again.');
      } else {
        setError(msg || 'Verification failed. Please try again.');
      }
      setCode('');
    } finally { 
      setLoading(false); 
    }
  };

  const resend = async () => {
    if (countdown > 0) return;
    
    try {
      setResendLoading(true);
      setError('');
      setResendMessage('');
      
      await API.post('/auth/resend-verification', { email });
      
      setResendMessage('A new verification code has been sent to your email.');
      setCountdown(60); // Start 60 second countdown
      
      // Clear message after 5 seconds
      setTimeout(() => setResendMessage(''), 5000);
      
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg?.includes('wait')) {
        setError('Please wait before requesting another code.');
      } else if (msg?.includes('Too many')) {
        setError('Too many requests. Please try again later.');
      } else {
        setError(msg || 'Failed to resend code. Please try again.');
      }
    } finally { 
      setResendLoading(false); 
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Email Verified!</h2>
            <p>Your email has been successfully verified. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Verify your email</h2>
        <p className="auth-subtitle">Enter the 6-digit code sent to <strong>{email}</strong></p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {resendMessage && (
          <div className="success-message small">
            {resendMessage}
          </div>
        )}
        
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Verification Code</label>
            <div className="input-wrapper">
              <input 
                value={code} 
                onChange={e=>setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                placeholder="123456" 
                maxLength={6} 
                required 
                disabled={loading}
                className="otp-input"
              />
            </div>
          </div>
          <div className="form-group">
            <button className="btn-auth-primary" type="submit" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        </form>
        
        <p className="resend-text">
          Didn't receive the code? 
          <button 
            onClick={resend} 
            disabled={resendLoading || countdown > 0} 
            className="btn-link"
          >
            {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : 'Resend code'}
          </button>
        </p>
      </div>
    </div>
  );
}

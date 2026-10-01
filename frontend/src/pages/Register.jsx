import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register({ onLogin }){
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();
  const [otpPending, setOtpPending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const register = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await API.post('/auth/register', { 
        name: (name || '').trim(),
        email: (email || '').trim(),
        password: (password || '').trim()
      });
      // If backend returned a token/user (legacy), use it
      if (res.data && res.data.token && res.data.user) {
        const normalizedUser = onLogin(res.data.token, res.data.user);
        if (normalizedUser?.isAdmin) return navigate('/admin');
        return navigate('/');
      }
      // Otherwise expect a verification flow: backend sends { message, email }
      setRegisteredEmail(res.data.email || (email || '').trim());
      setOtpPending(true);
      setCountdown(60); // Start countdown after first OTP is sent
      return;
    } catch (err) {
      // Surface server validation messages and network errors to help debugging
      const serverMsg = err?.response?.data?.message;
      const status = err?.response?.status;
      if (serverMsg) {
        setError(serverMsg + (status ? ` (status ${status})` : ''));
      } else if (err.request && !err.response) {
        // Network error / backend unreachable
        setError(`Unable to contact backend at ${API_BASE}. Please start the backend: open a terminal and run: cd backend && npm install && node server.js`);
      } else if (err.message) {
        setError('Registration failed: ' + err.message);
      } else {
        setError('Registration failed');
      }
    }
  };

  const verifyOtp = async (e) => {
    e && e.preventDefault();
    setError('');
    
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Enter the 6-digit code sent to your email');
      return;
    }
    try {
      setVerifying(true);
      const resp = await API.post('/auth/verify-email', { email: registeredEmail || email, code: otpCode.trim() });
      // re-login or fetch user again if needed. For now, simply hide OTP panel and navigate home
      setOtpPending(false);
      
      setSuccessMessage('Email verified successfully!');
      
      // Attempt to log the user in automatically after successful verification
      try {
        const loginResp = await API.post('/auth/login', { email: registeredEmail || email, password: (password || '').trim() });
        if (loginResp.data && loginResp.data.token && loginResp.data.user) {
          onLogin(loginResp.data.token, loginResp.data.user);
        }
      } catch (loginErr) {
        // ignore login failure - user can manually login
      }
      
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      if (serverMsg?.includes('expired')) {
        setError('The verification code has expired. Please request a new one.');
      } else if (serverMsg?.includes('Invalid')) {
        setError('Invalid verification code. Please check and try again.');
      } else {
        setError(serverMsg || 'Verification failed');
      }
      setOtpCode('');
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0 || resendLoading) return;
    
    try {
      setResendLoading(true);
      setError('');
      
      await API.post('/auth/resend-verification', { email: registeredEmail || email });
      
      setSuccessMessage('A new verification code has been sent to your email.');
      setCountdown(60);
      
      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      if (serverMsg?.includes('wait')) {
        setError('Please wait before requesting another code.');
      } else if (serverMsg?.includes('Too many')) {
        setError('Too many requests. Please try again later.');
      } else {
        setError(serverMsg || 'Failed to resend code');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to get started</p>
        
        {/* role selector removed: registrations create regular customers by default */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {successMessage && !otpPending && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {!otpPending ? (
          <form onSubmit={register} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

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

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="Create a password"
                required
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
                placeholder="Confirm your password"
                required
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={agreeTerms}
                onChange={e=>setAgreeTerms(e.target.checked)}
                required
              />
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <button type="submit" className="btn-auth-primary">Create Account</button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="auth-form">
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}
            
            <p className="otp-instructions">Please enter the 6-digit verification code sent to <strong>{registeredEmail || email}</strong></p>
            
            <div className="form-group">
              <label>Verification Code</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="otp-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <button type="submit" className="btn-auth-primary" disabled={verifying || otpCode.length !== 6}>
                {verifying ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
            
            <p className="resend-text">
              Didn't receive the code? 
              <button 
                type="button"
                onClick={resendOtp} 
                disabled={resendLoading || countdown > 0} 
                className="btn-link"
              >
                {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : 'Resend code'}
              </button>
            </p>
          </form>
        )}

        <p className="auth-footer">
          Do you have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductPage from './pages/ProductPage';
import SearchResults from './pages/SearchResults';
import Cart from './pages/Cart';
import Blog from './pages/Blog';
import Pages from './pages/Pages';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Payment from './pages/Payment';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/admin/AdminDashboard';

import UserWelcome from './pages/UserWelcome';
import VerifyEmail from './pages/VerifyEmail';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import ErrorBoundary from './components/ErrorBoundary';
import AdminAddProduct from './pages/admin/AdminAddProduct';
import AdminEditProduct from './pages/admin/AdminEditProduct';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCreateOrder from './pages/admin/AdminCreateOrder';
import AdminAddBlog from './pages/admin/AdminAddBlog';
import AdminEditBlog from './pages/admin/AdminEditBlog';
import AdminBlogs from './pages/admin/AdminBlogs';
import AdminInventory from './pages/admin/AdminInventory';
import AdminPromos from './pages/admin/AdminPromos';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminLayout from './pages/admin/AdminLayout';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import New from './pages/New';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { setAuthToken } from './api/api';

function App(){
  const parseIsAdmin = (v) => {
    if (v === true || v === 1) return true;
    if (v === false || v === 0) return false;
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
    return Boolean(v);
  };

  const storedUser = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (!u) return null;
      // normalize isAdmin to boolean in a robust way
      if (u.isAdmin !== undefined) u.isAdmin = parseIsAdmin(u.isAdmin);
      return u;
    } catch (e) {
      console.error('Failed to parse stored user', e);
      return null;
    }
  })();
  const [user, setUser] = useState(storedUser || null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    setAuthToken(token);
  }, []);
  const onLogin = (token, user) => {
    // normalize isAdmin to boolean before storing
    const normalized = { ...user, isAdmin: parseIsAdmin(user?.isAdmin) };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setAuthToken(token);
    setUser(normalized);
    return normalized;
  };
  const onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
  };

  const requireVerified = (component) => {
    // If not authenticated, redirect to login first
    if (!user) return <Navigate to="/login" />;
    // Admins don't need email verification - they have special credentials
    if (user && user.isAdmin === true) return component;
    // For regular users, check if email is verified
    if (user && user.emailVerified === false) return <Navigate to="/verify-email" />;
    return component;
  };

  return (
    <div className="app">
      <Header user={user} onLogout={onLogout}/>
  <main id="content" className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/pages" element={<Pages />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login onLogin={onLogin} />} />
          <Route path="/register" element={<Register onLogin={onLogin} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminDashboard /></ErrorBoundary>) : <Navigate to="/login" /> } />
          {/* admin welcome route removed to keep a single /welcome page */}
          <Route path="/welcome" element={<UserWelcome />} />
          <Route path="/admin/add" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminAddProduct /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/edit/:id" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminEditProduct /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/orders" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminOrders /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/notifications" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminNotifications /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/inquiries" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminInquiries /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/users" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminUsers /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/reviews" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminReviews /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/create-order" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminCreateOrder /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/blogs" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminBlogs /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/promos" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminPromos /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/inventory" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminInventory /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/add-blog" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminAddBlog /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/admin/edit-blog/:id" element={ user?.isAdmin ? requireVerified(<ErrorBoundary><AdminEditBlog /></ErrorBoundary>) : <Navigate to="/login" /> } />
          <Route path="/orders" element={ requireVerified(<Orders />) } />
          <Route path="/wishlist" element={ requireVerified(<ErrorBoundary><Wishlist /></ErrorBoundary>) } />
          <Route path="/verify-email" element={<VerifyEmail user={user} onVerified={(u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); }} />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/new" element={<New />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

export default App;
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <h4>Contacts Us</h4>
            <p>SONU ENTERPRISES Store</p>
            <a href="/contact#store-location">📍 Kathmandu, Nepal</a>
            <p>📞 +9779766325733</p>
            <p>✉️ ElectroCart@gmail.com</p>
          </div>
          <div className="footer-column">
            <h4>Information</h4>
            <Link to="/support">Product Support</Link>
            <Link to="/checkout">Checkout</Link>
            <Link to="/license-policy">License Policy</Link>
            <Link to="/affiliate">Affiliate</Link>
          </div>
          <div className="footer-column">
            <h4>Customer Service</h4>
            <Link to="/help">Help Center</Link>
            <Link to="/voucher">Redeem Voucher</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/code-of-conduct">Policies & Rules</Link>
          </div>
          <div className="footer-column">
            <h4>Download Our App</h4>
            <p>Download Our App & get extra 20% Discount on your First Order...!</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 SONU ENTERPRISES. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

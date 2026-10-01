import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setError('Unable to connect. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = {
    email: 'support@elecrocart.com',
    phone: '+977-9701605257',
    address: 'Kathmandu, Nepal',
    businessHours: 'Sun-Fri: 9 AM - 6 PM'
  };

  const socialLinks = [
    { name: 'Facebook', icon: '📘', url: 'https://facebook.com' },
    { name: 'Instagram', icon: '📸', url: 'https://instagram.com' },
    { name: 'Twitter', icon: '🐦', url: 'https://twitter.com' },
    { name: 'WhatsApp', icon: '💬', url: 'https://wa.me/9779701605257' }
  ];

  const quickContact = [
    { title: 'Customer Support', description: 'For order issues & general inquiries', icon: '🎧', action: 'mailto:support@elecrocart.com' },
    { title: 'Technical Support', description: 'Product technical help', icon: '🔧', action: 'mailto:tech@elecrocart.com' },
    { title: 'Business Inquiries', description: 'Partnership & bulk orders', icon: '🤝', action: 'mailto:business@elecrocart.com' }
  ];

  return (
    <div className="container" role="main" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>Contact Us</h1>
      <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
        We'd love to hear from you! Send us a message and we'll respond as soon as possible.
      </p>

      {/* Quick Contact Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {quickContact.map((item, index) => (
          <a
            key={index}
            href={item.action}
            style={{
              display: 'block',
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #e0e0e0',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e9ecef'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f8f9fa'}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{item.icon}</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>{item.title}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{item.description}</p>
          </a>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* Contact Form */}
        <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Send us a Message</h2>
          
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
              <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>Message Sent!</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: '10px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '15px' }}>
                  {error}
                </div>
              )}
              
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your name"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="your@email.com"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="subject" style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="order">Order Related</option>
                  <option value="product">Product Question</option>
                  <option value="technical">Technical Support</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="message" style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Contact Information */}
        <div>
          {/* Contact Details Card */}
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Contact Information</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <div>
                  <strong style={{ display: 'block', color: '#333' }}>Address</strong>
                  <span style={{ color: '#666' }}>{contactInfo.address}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📞</span>
                <div>
                  <strong style={{ display: 'block', color: '#333' }}>Phone</strong>
                  <a href={`tel:${contactInfo.phone}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                    {contactInfo.phone}
                  </a>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>✉️</span>
                <div>
                  <strong style={{ display: 'block', color: '#333' }}>Email</strong>
                  <a href={`mailto:${contactInfo.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                    {contactInfo.email}
                  </a>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🕐</span>
                <div>
                  <strong style={{ display: 'block', color: '#333' }}>Business Hours</strong>
                  <span style={{ color: '#666' }}>{contactInfo.businessHours}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Follow Us</h2>
            <p style={{ color: '#666', marginBottom: '15px' }}>Stay connected with us on social media for updates and promotions.</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '10px 15px',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: '#333',
                    border: '1px solid #e0e0e0',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e9ecef';
                    e.currentTarget.style.borderColor = '#007bff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                >
                  <span>{social.icon}</span>
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Map Placeholder */}
          <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Visit Our Store</h3>
            <p style={{ color: '#666', margin: 0 }}>Come visit us at our physical location for a hands-on experience with our products.</p>
          </div>
        </div>
      </div>

      {/* FAQ Link */}
      <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginTop: '20px' }}>
        <p style={{ margin: '0 0 10px 0', color: '#666' }}>
          Have a quick question? Check our FAQ section for instant answers.
        </p>
        <button
          onClick={() => navigate('/faq')}
          style={{
            padding: '10px 25px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Visit FAQ
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="container" role="main" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>About Us</h1>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Welcome to Our Store</h2>
        <p>
          We are a premier electronics retailer offering the latest gadgets and technology products 
          at competitive prices. Our mission is to provide high-quality products with exceptional 
          customer service.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Our Mission</h2>
        <p>
          To deliver the best shopping experience by offering top-notch electronics, 
          reliable delivery, and outstanding customer support.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Why Choose Us?</h2>
        <ul>
          <li>✓ Wide selection of authentic products</li>
          <li>✓ Competitive pricing</li>
          <li>✓ Fast and reliable shipping</li>
          <li>✓ Secure payment options</li>
          <li>✓ 24/7 customer support</li>
          <li>✓ Easy returns and exchanges</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Contact Information</h2>
        <p>
          <strong>Email:</strong> support@store.com<br />
          <strong>Phone:</strong> +977-1-XXXXXXX<br />
          <strong>Address:</strong> Kathmandu, Nepal
        </p>
      </section>

      <button 
        onClick={() => navigate('/')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Back to Home
      </button>
    </div>
  );
}

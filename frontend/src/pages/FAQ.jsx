import React, { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order by logging into your account and visiting the "My Orders" section. You will find real-time tracking information and delivery status updates there.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most products. Items must be unused and in their original packaging. Please contact our support team to initiate a return.'
    },
    {
      question: 'How do I apply a discount code?',
      answer: 'You can apply discount codes during checkout. Enter your promo code in the "Promo Code" field and click "Apply". The discount will be reflected in your order total.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including credit/debit cards, Khalti digital wallet, and cash on delivery (COD) for eligible orders.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Standard delivery typically takes 3-7 business days within Nepal. International shipping may take 14-21 business days depending on the destination.'
    },
    {
      question: 'Can I change my shipping address after placing an order?',
      answer: 'You can change your shipping address within 24 hours of placing your order, provided it has not yet been shipped. Contact our support team for assistance.'
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach our customer support team through the live chat feature on our website, by email at support@elecrocart.com, or by calling +977-9701605257.'
    },
    {
      question: 'Do you offer warranty on products?',
      answer: 'Yes, most electronic products come with a manufacturer warranty. The warranty period varies by product and is specified on each product page.'
    },
    {
      question: 'How do I become a member of the loyalty program?',
      answer: 'Simply create an account on our website to automatically join our loyalty program. Earn points on every purchase and redeem them for discounts!'
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Absolutely! We use industry-standard encryption to protect your personal and payment information. Your data is never shared with third parties.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="container">
        <div className="faq-header">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about our products and services</p>
        </div>

        <div className="faq-search">
          <input 
            type="text" 
            placeholder="Search for answers..."
            className="faq-search-input"
          />
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-contact">
          <h3>Still have questions?</h3>
          <p>Contact our support team for personalized assistance</p>
          <div className="contact-options">
            <a href="tel:+9779701605257" className="contact-btn">
              <span>📞</span> Call Us
            </a>
            <a href="mailto:support@elecrocart.com" className="contact-btn">
              <span>📧</span> Email Support
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .faq-page {
          padding: 40px 0;
          min-height: 60vh;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .faq-header h1 {
          font-size: 2.5rem;
          color: #1e293b;
          margin-bottom: 10px;
        }

        .faq-header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .faq-search {
          max-width: 600px;
          margin: 0 auto 40px;
        }

        .faq-search-input {
          width: 100%;
          padding: 15px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .faq-search-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .faq-list {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .faq-item.open {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .faq-question {
          width: 100%;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #1e293b;
          text-align: left;
        }

        .faq-icon {
          font-size: 24px;
          color: #007bff;
          font-weight: 300;
        }

        .faq-answer {
          padding: 0 20px 20px;
          color: #6b7280;
          line-height: 1.6;
        }

        .faq-contact {
          text-align: center;
          margin-top: 60px;
          padding: 40px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .faq-contact h3 {
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        .faq-contact p {
          color: #6b7280;
          margin-bottom: 20px;
        }

        .contact-options {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .contact-btn:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
}

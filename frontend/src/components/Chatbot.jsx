import React, { useState, useRef, useEffect } from 'react';

// Pre-defined responses for common e-commerce questions
const faqResponses = {
  'hello': "Hello! 👋 Welcome to ElectroCart! I'm your AI shopping assistant. How can I help you today?",
  'hi': "Hi there! 😊 How can I assist you today?",
  'hey': "Hey! 🎉 What can I help you with?",
  'help': "I'd be happy to help! You can ask me about:\n• Products and categories\n• Orders and tracking\n• Shipping and delivery\n• Returns and refunds\n• Payment methods\n• Account issues\n• Discounts and promotions\n\nJust type your question!",
  'products': "We have a wide range of electronics including:\n📱 Smartphones & Tablets\n💻 Laptops & Computers\n🎧 Headphones & Audio\n📷 Cameras & Photography\n🎮 Gaming Accessories\n⌚ Smart Watches\n🏠 Smart Home Devices\n\nBrowse our Products page to see all items!",
  'category': "We have these categories:\n• Smartphones\n• Laptops & Computers\n• Audio & Headphones\n• Cameras\n• Gaming\n• Smart Home\n• Accessories\n\nYou can browse by category on our Products page!",
  'order': "To check your order status:\n1. Go to the Orders page\n2. Log in to your account\n3. View your order history\n\nNeed help with a specific order?",
  'orders': "To check your order status:\n1. Go to the Orders page\n2. Log in to your account\n3. View your order history\n\nNeed help with a specific order?",
  'shipping': "🚚 Shipping Information:\n• Standard delivery: 3-5 business days\n• Express delivery: 1-2 business days\n• Free shipping on orders over $50\n• Orders are processed within 24 hours\n\nWould you like more details?",
  'delivery': "🚚 Delivery Options:\n• Standard: 3-5 business days ($5.99)\n• Express: 1-2 business days ($12.99)\n• Free shipping on orders over $50\n\nTrack your order in the Orders page!",
  'return': "🔄 Returns & Refunds:\n• 30-day return policy\n• Items must be unused and in original packaging\n• Contact support to initiate a return\n• Refunds processed within 5-7 business days\n\nNeed help with a return?",
  'refund': "🔄 Returns & Refunds:\n• 30-day return policy\n• Items must be unused and in original packaging\n• Contact support to initiate a return\n• Refunds processed within 5-7 business days\n\nNeed help with a return?",
  'payment': "💳 Payment Methods:\n• Credit/Debit Cards (Visa, Mastercard, Amex)\n• PayPal\n• eSewa (for Nepal)\n• Cash on Delivery\n\nAll payments are secure and encrypted!",
  'pay': "💳 Payment Methods:\n• Credit/Debit Cards (Visa, Mastercard, Amex)\n• PayPal\n• eSewa (for Nepal)\n• Cash on Delivery\n\nAll payments are secure and encrypted!",
  'account': "👤 Account Help:\n• Login/Register: Use the header links\n• Forgot password: Use 'Forgot Password' link\n• Update profile: Account settings after login\n• Having issues? Contact support\n\nWhat do you need help with?",
  'login': "🔐 To Login:\n1. Click 'Login' in the header\n2. Enter your email and password\n3. Click 'Sign In'\n\nNew user? Click 'Register' to create an account!",
  'register': "📝 To Register:\n1. Click 'Register' in the header\n2. Fill in your details\n3. Verify your email\n4. Start shopping!\n\nAlready have an account? Use 'Login' instead!",
  'discount': "🎟️ Discounts & Promos:\n• Use promo codes at checkout\n• Sign up for newsletter for exclusive offers\n• Free shipping on orders over $50\n• Check our homepage for current sales\n\nHave a promo code to apply?",
  'promo': "🎟️ Promo Codes:\n• Enter your code at checkout\n• One code per order\n• Some codes have minimum purchase requirements\n• Check our homepage for current promotions!\n\nHave a promo code?",
  'contact': "📞 Contact Us:\n• Email: support@electrocat.com\n• Phone: +977-1-4567890\n• Use the Contact page\n\nWe're available 9 AM - 6 PM, Sunday-Friday!",
  'support': "📞 Support Options:\n• Email: support@electrocat.com\n• Phone: +977-1-4567890\n• Use the Contact page\n\nWe're available 9 AM - 6 PM, Sunday-Friday!",
  'track': "📦 To Track Your Order:\n1. Go to Orders page\n2. Find your order\n3. Click 'Track Order'\n\nYou'll see real-time shipping updates!",
  'price': "💰 Pricing:\n• All prices are in USD\n• Check product pages for current prices\n• Compare prices across similar products\n• Look for sales and discounts!\n\nSearching for something specific?",
  'warranty': "🛡️ Warranty Info:\n• Most electronics come with 1-year warranty\n• Warranty varies by product\n• Check product page for details\n• Extended warranty available for purchase\n\nNeed warranty help?",
  ' warranty': "🛡️ Warranty Info:\n• Most electronics come with 1-year warranty\n• Warranty varies by product\n• Check product page for details\n• Extended warranty available for purchase\n\nNeed warranty help?",
  'stock': "📦 Availability:\n• Product pages show real-time stock\n• 'Out of Stock' items are currently unavailable\n• Pre-order available for upcoming products\n• Contact support for bulk orders\n\nLooking for something specific?",
  'thanks': "You're welcome! 😊 Happy to help! Is there anything else I can assist you with?",
  'thank': "You're welcome! 😊 Happy to help! Is there anything else I can assist you with?",
  'thank you': "You're welcome! 😊 Happy to help! Is there anything else I can assist you with?",
  'bye': "Goodbye! 👋 Thank you for shopping with ElectroCart. Feel free to return anytime!",
};

// Find the best matching response
const getResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Check for exact matches first
  if (faqResponses[lowerMessage]) {
    return faqResponses[lowerMessage];
  }
  
  // Check for keyword matches
  const keywords = Object.keys(faqResponses);
  for (const keyword of keywords) {
    if (lowerMessage.includes(keyword)) {
      return faqResponses[keyword];
    }
  }
  
  // Default response
  return "I'm not sure I understand. 😅\n\nYou can ask me about:\n• Products and categories\n• Orders and tracking\n• Shipping and delivery\n• Returns and refunds\n• Payment methods\n• Account help\n• Discounts and promotions\n\nOr you can contact our support team for more help!";
};

// SVG Icons as components
const MessageIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const BotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const LoaderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 Welcome to ElectroCart! I'm your AI shopping assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800 + Math.random() * 500);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
      >
        <MessageIcon />
        <span className="chatbot-badge">AI</span>
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        {/* Chat Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <img src="/ai-logo-badge.svg" alt="AI" className="chatbot-avatar" />
            <div>
              <h3>ElectroCart AI</h3>
              <span className="chatbot-status">
                <span className="status-dot"></span>
                Online
              </span>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
            <CloseIcon />
          </button>
        </div>

        {/* Messages Area */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'user' : 'bot'}`}
            >
              {message.sender === 'bot' && (
                <div className="message-avatar">
                  <BotIcon />
                </div>
              )}
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot">
              <div className="message-avatar">
                <BotIcon />
              </div>
              <div className="message-content typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form className="chatbot-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
          />
          <button type="submit" disabled={!inputMessage.trim()} aria-label="Send message">
            {isTyping ? <LoaderIcon /> : <SendIcon />}
          </button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;

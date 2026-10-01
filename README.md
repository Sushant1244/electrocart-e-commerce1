⚡ ElectroCart — Full-Stack E-Commerce Platform

![ElectroCart](https://img.shields.io/badge/ElectroCart-v2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)


---

📖 Introduction
==============

ElectroCart is a modern, full-stack e-commerce platform tailored for the Nepalese market. It provides a seamless online shopping experience with robust backend support for merchants and customers alike. The platform supports both demo mode (in-memory data) and production mode (PostgreSQL database).

## Why ElectroCart?

- 🏪 **Local Market Focus** — Built specifically for Nepalese businesses with Khalti and eSewa payment integrations
- 🔄 **Flexible Architecture** — Works with or without a database for easy testing and deployment
- 📱 **Mobile-First** — Responsive design that looks great on any device
- 🔒 **Secure by Default** — JWT authentication, OTP verification, and role-based access control
- 📊 **Rich Analytics** — Comprehensive dashboard with revenue charts and reporting

---

## Key Capabilities

- 🛒 **Smooth Shopping** — Intuitive product browsing, search, and filtering with pagination
- 🔒 **Secure Authentication** — User registration with OTP verification and JWT sessions
- 💳 **Payment Integration** — Khalti and eSewa for local payment processing with sandbox support
- 📊 **Admin Dashboard** — Comprehensive product, order, and user management
- 📱 **Responsive Design** — Works beautifully on desktop and mobile devices
- 🏷️ **Promo Codes** — Create and track discount codes with usage limits
- 📝 **Blog System** — Content management for marketing and announcements
- 🔔 **Notifications** — In-app notifications for order updates and promotions

Built with React (Vite) frontend, Node.js/Express backend, and PostgreSQL database support.

---

✨ Key Features
==============

🛍️ Customer Features
---------------------

### User Authentication
- **Registration** — Email-based registration with password strength validation
- **OTP Verification** — Mandatory email OTP verification for account activation
- **Login** — Secure JWT-based authentication with remember me option
- **Password Reset** — Email-based password reset functionality
- **Session Management** — Token refresh and logout from all devices option

### Shopping Experience
- **Product Browsing** — Browse by categories, featured products, latest arrivals
- **Search & Filter** — Real-time search with price, category, and rating filters
- **Product Details** — Detailed view with images, specifications, and reviews
- **Pagination** — Efficient product listing with infinite scroll option

### Cart & Checkout
- **Shopping Cart** — Persistent cart that saves across sessions
- **Quantity Management** — Add, remove, update product quantities
- **Price Calculation** — Automatic subtotal, tax, and shipping calculation
- **Guest Checkout** — Optional checkout without account creation
- **Order Confirmation** — Email confirmation with order details

### Wishlist
- **Save Products** — Add products to wishlist for later
- **Move to Cart** — Quick move from wishlist to cart
- **Price Alerts** — Get notified of price drops (future feature)

### Order Management
- **Order History** — View all past orders with status
- **Order Tracking** — Real-time status updates (Pending → Processing → Shipped → Delivered)
- **Order Details** — Full breakdown of items, shipping, and payment
- **Cancel/Return** — Request order cancellation or returns

### User Dashboard
- **Profile Management** — Update personal information and profile picture
- **Address Book** — Multiple shipping addresses management
- **Notifications** — In-app notification center
- **Security Settings** — Change password, manage sessions

---

🛠️ Admin Features
------------------

### Dashboard Analytics
- **Revenue Overview** — Daily, weekly, monthly revenue charts
- **Top Products** — Best-selling products analysis
- **Order Statistics** — Orders by status, average order value
- **Customer Insights** — New vs returning customers
- **Sales Reports** — Exportable sales data

### Product Management
- **CRUD Operations** — Full create, read, update, delete for products
- **Bulk Upload** — Import products via CSV/JSON
- **Image Gallery** — Multiple images per product
- **Variants** — Size, color, and other product variants
- **Stock Alerts** — Low stock notifications
- **Featured Products** — Highlight products on homepage

### Inventory Management
- **Stock Tracking** — Real-time inventory levels
- **Low Stock Alerts** — Automatic notifications when stock is low
- **Stock History** — Track inventory changes over time
- **Bulk Stock Update** — Update multiple products at once

### Order Management
- **Order Processing** — Update order status through workflow
- **Order Details** — View complete order information
- **Refund Processing** — Handle partial and full refunds
- **Invoice Generation** — Downloadable invoices
- **Shipping Labels** — Generate shipping labels (future)

### Blog Management
- **Create Posts** — Rich text editor for blog content
- **Categories** — Organize posts by category
- **Publish Schedule** — Schedule posts for future publication
- **SEO Settings** — Meta tags and descriptions

### User Management
- **User List** — View all registered users
- **Role Management** — Admin, Manager, Customer roles
- **Account Actions** — Suspend, activate, delete users
- **User Analytics** — Customer purchase history

### Promo Codes
- **Create Codes** — Percentage or fixed amount discounts
- **Usage Limits** — Limited uses per code
- **Date Range** — Valid from/to dates
- **Product Restrictions** - Apply to specific products or categories

### Payment Reports
- **Khalti Transactions** — All Khalti payment records
- **eSewa Transactions** — All eSewa payment records
- **Transaction Search** — Filter by date, amount, status
- **Reconciliation** — Match payments with orders

---

💳 Payment Integration
======================

ElectroCart integrates with Nepal's most popular payment gateways:

### Khalti
- **Sandbox Mode** — Test payments without real money
- **Live Mode** — Accept real payments in production
- **Verification** — Automatic payment verification
- **Refund Support** — Process refunds directly from dashboard
- **Webhook** — Real-time payment status updates

**Configuration:**
```env
KHALTI_ENV=dev  # or 'live' for production
KHALTI_SECRET_KEY=your_khalti_secret_key
KHALTI_LIVE_PUBLIC_KEY=your_khalti_public_key
```

### eSewa
- **Sandbox Testing** — Test merchant ID for development
- **Live Payments** — Production merchant integration
- **Payment Verification** — Server-side verification
- **Success/Failure URLs** — Redirect handling

**Configuration:**
```env
ESEWA_MERCHANT_ID=your_merchant_id
ESEWA_SECRET_KEY=your_secret_key
```

### Payment Flow
1. Customer adds items to cart and proceeds to checkout
2. Selects payment method (Khalti or eSewa)
3. Redirected to payment gateway with order details
4. Customer completes payment
5. Gateway redirects back with payment token
6. Server verifies payment and confirms order
7. Order status updated, confirmation email sent

---

⚙️ Technical Features
=====================

### Authentication & Security
- **JWT Tokens** — Secure token-based authentication
- **Access & Refresh Tokens** — Short-lived access, long-lived refresh
- **OTP System** — Time-based one-time passwords
- **Password Hashing** — bcrypt with salt rounds
- **Rate Limiting** — Prevent brute force attacks
- **CORS Configuration** — Secure cross-origin requests
- **Input Validation** — Joi schema validation
- **XSS Protection** — Sanitize user inputs

### Database & ORM
- **PostgreSQL Support** — Full relational database integration
- **Sequelize ORM** — Abstraction layer for database operations
- **Migrations** — Version-controlled database schema
- **Seed Data** — Sample data for development
- **Connection Pooling** — Efficient database connections

### Email System
- **Nodemailer** — SMTP-based email sending
- **Multiple Providers** — Gmail, SendGrid, custom SMTP
- **Email Templates** — Customizable HTML templates
- **Fallback Options** — Alternative email providers

### File Handling
- **Multer** — Multi-part file uploads
- **Local Storage** — Default file system storage
- **S3 Support** — Amazon S3 integration for production
- **Image Processing** — Automatic image optimization
- **File Validation** — Type and size restrictions

### API Design
- **RESTful Architecture** — Standard HTTP methods
- **JSON Responses** — Consistent JSON format
- **Error Handling** — Standardized error responses
- **Pagination** — Offset and cursor-based pagination
- **Filtering** — Advanced query parameters
- **Sorting** — Multi-field sorting support

### Logging & Monitoring
- **Winston Logger** — Structured logging
- **Error Tracking** — Capture and log errors
- **Request Logging** — API request/response logging
- **Debug Mode** — Detailed development logs

---

🏗️ Tech Stack
============

| Layer          | Technology                              |
|----------------|----------------------------------------|
| Frontend       | React 18, Vite, React Router v6       |
| Styling        | CSS Modules, Custom CSS               |
| State          | React Context, useState/useEffect     |
| HTTP Client    | Fetch API                              |
| Charts         | Recharts                               |
| Backend        | Node.js, Express                       |
| Database       | PostgreSQL (optional), Sequelize ORM   |
| Authentication | JWT, bcrypt                            |
| Email          | Nodemailer (SMTP)                      |
| File Upload    | Multer, AWS SDK (S3)                   |
| Validation     | Joi                                    |
| Testing        | Vitest, Jest                           |
| Deployment     | Vercel, Render                         |

---

📂 Project Structure
===================

```
ecommerce-3/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── common/      # Shared components
│   │   │   └── __tests__/   # Component tests
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── auth/        # Authentication pages
│   │   │   └── *.jsx       # Main pages
│   │   ├── context/         # React context providers
│   │   ├── data/            # Static demo data
│   │   ├── constants/       # App constants, categories
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # Global styles
│   ├── public/
│   │   └── uploads/         # Static images
│   └── tests/               # Frontend tests
├── backend/                  # Express API server
│   ├── controllers/         # Route handlers (business logic)
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── cartController.js
│   │   ├── paymentController.js
│   │   └── ...
│   ├── routes/              # API route definitions
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── ...
│   ├── models/              # Sequelize models
│   │   ├── pg/              # PostgreSQL models
│   │   └── adapter.js       # Database adapter
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # JWT verification
│   │   └── isAdmin.js       # Admin check
│   ├── utils/               # Utility functions
│   │   ├── emailHelpers.js
│   │   ├── mailer.js
│   │   └── s3.js
│   ├── helper/              # Helper functions
│   ├── data/                # JSON seed data
│   ├── scripts/             # Database scripts
│   ├── docs/                # Documentation
│   ├── uploads/             # Uploaded files
│   └── server.js            # Entry point
├── README.md                # Main documentation
├── ADMIN_DOCS.md            # Admin panel guide
├── VERCEL_DEPLOY.md         # Vercel deployment guide
├── LICENSE                  # MIT License
└── package.json             # Root package.json
```

---

🚀 Getting Started
==================

🧰 Prerequisites
---------------

Before you begin, ensure you have the following installed:

| Requirement    | Version      | Notes                              |
|----------------|--------------|------------------------------------|
| Node.js        | 18+          | LTS version recommended            |
| npm            | 9+           | Comes with Node.js                 |
| PostgreSQL     | 14+ (optional)| Required for production mode      |
| Git            | Any recent   | For version control                |

### Installing Node.js

**macOS:**
```bash
# Using Homebrew
brew install nodejs

# Or download from nodejs.org
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

### Installing PostgreSQL (Optional)

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

⚡ Installation
--------------

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ecommerce-3
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings (see Environment Variables section)
nano .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 4. Database Setup (Optional - for production)

If you want to use PostgreSQL:

```bash
# In backend directory
createdb electrocart

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed:pg
```

▶️ Running Locally
------------------

### Development Mode (Without Database)

```bash
# Terminal 1 — Start Backend
cd backend
npm run dev
# Server runs on http://localhost:5001

# Terminal 2 — Start Frontend
cd frontend
npm run dev
# App opens at http://localhost:5173
```

### Development Mode (With Database)

```bash
# Ensure PostgreSQL is running
# Make sure POSTGRES_URL is set in backend/.env

# Terminal 1 — Start Backend
cd backend
npm run dev

# Terminal 2 — Start Frontend
cd frontend
npm run dev
```

### Production Build

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm start
```

💡 **Demo Mode:** The application runs with sample data if no database is configured. This is perfect for testing and development without setting up PostgreSQL.

---

🔑 Environment Variables
========================

### Backend (backend/.env)

Create a `.env` file in the backend directory:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ===========================================
# DATABASE CONFIGURATION (Optional)
# ===========================================
# For local PostgreSQL
POSTGRES_URL=postgres://username:password@localhost:5432/electrocart

# For PostgreSQL on cloud (e.g., Supabase, Neon, Railway)
# POSTGRES_URL=postgres://user:password@host:port/database

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret-change-in-production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# ===========================================
# EMAIL CONFIGURATION (SMTP)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=ElectroCart

# Alternative email provider (Resend)
# RESEND_API_KEY=re_123456789

# ===========================================
# PAYMENT GATEWAY - KHALTI
# ===========================================
# Development (Sandbox)
KHALTI_ENV=dev
KHALTI_SECRET_KEY=your-khalti-secret-key
KHALTI_LIVE_PUBLIC_KEY=your-khalti-public-key

# Production
# KHALTI_ENV=live
# KHALTI_SECRET_KEY=your-live-khalti-secret
# KHALTI_LIVE_PUBLIC_KEY=your-live-khalti-public

# ===========================================
# PAYMENT GATEWAY - ESEWA
# ===========================================
ESEWA_MERCHANT_ID=your-esewa-merchant-id
ESEWA_SECRET_KEY=your-esewa-secret-key
ESEWA_BASE_URL=https://esewa.com.np
ESEWA_SUCCESS_URL=http://localhost:5173/payment/success
ESEWA_FAILURE_URL=http://localhost:5173/payment/failure

# ===========================================
# FILE STORAGE (Optional - S3)
# ===========================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# ===========================================
# ADMIN CONFIGURATION
# ===========================================
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123  # Change in production!
```

### Getting SMTP App Password for Gmail

1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords (search in settings)
4. Create new app password for "Mail"
5. Use the generated 16-character password in SMTP_PASS

### Frontend (frontend/.env)

```env
# API Configuration
VITE_API_URL=http://localhost:5001

# Payment Keys
VITE_KHALTI_PUBLIC_KEY=your-khalti-public-key

# Optional: Analytics
# VITE_GA_TRACKING_ID=UA-XXXXX-X

# Optional: Feature Flags
# VITE_ENABLE_DEBUG=true
```

---

⚡ Scripts
=========

### Backend Scripts

| Script              | Description                                    |
|---------------------|------------------------------------------------|
| `npm start`         | Start production server                        |
| `npm run dev`       | Start development server with auto-reload      |
| `npm run dev:nodemon` | Start with nodemon watcher                  |
| `npm test`          | Run tests                                      |
| `npm run seed:pg`   | Seed PostgreSQL database with sample data     |
| `npm run migrate`   | Run database migrations                        |
| `npm run create-db` | Create PostgreSQL database                     |

### Frontend Scripts

| Script           | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Start development server            |
| `npm run build`  | Create production build              |
| `npm run preview`| Preview production build            |
| `npm run test`   | Run tests                            |
| `npm run lint`   | Run ESLint                           |

---

👤 Default Admin Account
========================

After initial setup, you can access the admin panel:

- **URL:** http://localhost:5173/admin
- **Email:** admin@example.com
- **Password:** admin123 (change in production!)

### Creating a New Admin User

```bash
cd backend
node set_admin_password.js admin@yourdomain.com newpassword
```

---

🌐 API Endpoints
================

### Authentication (`/api/auth`)

| Method | Endpoint           | Description                | Auth  |
|--------|--------------------|----------------------------|-------|
| POST   | `/api/auth/register`    | Register new user         | No    |
| POST   | `/api/auth/login`       | Login user                | No    |
| POST   | `/api/auth/otp/send`    | Send OTP to email         | No    |
| POST   | `/api/auth/otp/verify`  | Verify OTP                | No    |
| POST   | `/api/auth/refresh`     | Refresh access token      | No    |
| POST   | `/api/auth/logout`      | Logout user               | Yes   |
| POST   | `/api/auth/forgot`      | Request password reset    | No    |
| POST   | `/api/auth/reset`       | Reset password            | No    |

**Example: Register User**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "9800000000"
  }'
```

**Example: Login**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Products (`/api/products`)

| Method | Endpoint              | Description                  | Auth  |
|--------|-----------------------|------------------------------|-------|
| GET    | `/api/products`        | List all products           | No    |
| GET    | `/api/products/:id`    | Get single product          | No    |
| POST   | `/api/products`        | Create product              | Admin |
| PUT    | `/api/products/:id`    | Update product              | Admin |
| DELETE | `/api/products/:id`    | Delete product              | Admin |
| GET    | `/api/products/search` | Search products             | No    |
| GET    | `/api/products/featured` | Get featured products     | No    |

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `category` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `search` - Search term
- `sort` - Sort field (price, createdAt)
- `order` - Sort order (asc, desc)

**Example: Get Products**
```bash
curl "http://localhost:5001/api/products?page=1&limit=10&category=Electronics"
```

### Orders (`/api/orders`)

| Method | Endpoint              | Description                  | Auth  |
|--------|-----------------------|------------------------------|-------|
| GET    | `/api/orders`          | List user orders             | Yes   |
| GET    | `/api/orders/:id`      | Get order details            | Yes   |
| POST   | `/api/orders`          | Create new order             | Yes   |
| PUT    | `/api/orders/:id`      | Update order status          | Admin |
| DELETE | `/api/orders/:id`      | Cancel order                 | Yes   |

### Cart (`/api/cart`)

| Method | Endpoint      | Description           | Auth  |
|--------|---------------|-----------------------|-------|
| GET    | `/api/cart`   | Get user's cart       | Yes   |
| POST   | `/api/cart`   | Add item to cart      | Yes   |
| PUT    | `/api/cart`   | Update cart item      | Yes   |
| DELETE | `/api/cart/:id`| Remove item from cart | Yes   |

### Wishlist (`/api/wishlist`)

| Method | Endpoint         | Description            | Auth  |
|--------|------------------|------------------------|-------|
| GET    | `/api/wishlist`   | Get user's wishlist    | Yes   |
| POST   | `/api/wishlist`   | Add to wishlist        | Yes   |
| DELETE | `/api/wishlist/:id`| Remove from wishlist   | Yes   |

### Payments

#### Khalti (`/api/payments/khalti`)

| Method | Endpoint                    | Description            | Auth  |
|--------|-----------------------------|------------------------|-------|
| POST   | `/api/payments/khalti/initiate` | Initiate payment  | Yes   |
| POST   | `/api/payments/khalti/verify`   | Verify payment    | Yes   |

#### eSewa (`/api/payments/esewa`)

| Method | Endpoint                 | Description           | Auth  |
|--------|--------------------------|-----------------------|-------|
| POST   | `/api/payments/esewa/initiate` | Initiate payment | Yes   |
| GET    | `/api/payments/esewa/success`   | Payment success | Yes   |
| GET    | `/api/payments/esewa/failure`   | Payment failure | Yes   |

### Admin Endpoints

| Method | Endpoint                  | Description               | Auth  |
|--------|---------------------------|---------------------------|-------|
| GET    | `/api/analytics`           | Dashboard analytics       | Admin |
| GET    | `/api/analytics/revenue`  | Revenue reports           | Admin |
| GET    | `/api/inventory`           | Stock management          | Admin |
| PUT    | `/api/inventory/:id`       | Update stock              | Admin |
| GET    | `/api/reports`             | Sales reports             | Admin |
| GET    | `/api/blogs`               | List blog posts           | Admin |
| POST   | `/api/blogs`               | Create blog post          | Admin |
| PUT    | `/api/blogs/:id`           | Update blog post          | Admin |
| DELETE | `/api/blogs/:id`           | Delete blog post          | Admin |
| GET    | `/api/promo`              | List promo codes          | Admin |
| POST   | `/api/promo`               | Create promo code         | Admin |
| PUT    | `/api/promo/:id`          | Update promo code         | Admin |
| DELETE | `/api/promo/:id`          | Delete promo code         | Admin |

### Users (`/api/users`)

| Method | Endpoint            | Description            | Auth  |
|--------|---------------------|------------------------|-------|
| GET    | `/api/users`        | List all users         | Admin |
| GET    | `/api/users/:id`    | Get user details       | Yes   |
| PUT    | `/api/users/profile`| Update profile         | Yes   |
| PUT    | `/api/users/address`| Update address        | Yes   |

### Notifications (`/api/notifications`)

| Method | Endpoint              | Description              | Auth  |
|--------|-----------------------|--------------------------|-------|
| GET    | `/api/notifications`  | Get user notifications   | Yes   |
| PUT    | `/api/notifications/:id/read`| Mark as read      | Yes   |
| DELETE | `/api/notifications/:id`| Delete notification    | Yes   |

---

🗄️ Database Schema
==================

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('customer', 'admin', 'manager') DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  stock INTEGER DEFAULT 0,
  images TEXT[], -- Array of image URLs
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  specifications JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  items JSONB NOT NULL, -- Array of {product_id, name, price, quantity, image}
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  payment_method VARCHAR(50),
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_token VARCHAR(255),
  promo_code VARCHAR(50),
  discount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cart Items Table
```sql
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Wishlist Table
```sql
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);
```

### Reviews Table
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Promo Codes Table
```sql
CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

🧪 Testing
=========

### Running Backend Tests

```bash
cd backend
npm test
```

### Running Frontend Tests

```bash
cd frontend
npm run test
```

### Test Coverage

The project includes tests for:
- Authentication flows
- Order creation
- Inventory management
- Email sending
- Payment integration (sandbox)
- Cart operations

---

🔧 Troubleshooting
==================

### Common Issues

#### 1. Database Connection Failed

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
- Make sure PostgreSQL is running: `brew services start postgresql` (macOS)
- Check POSTGRES_URL in .env file
- Verify database credentials

#### 2. Email Not Sending

**Error:** `SMTP connection failed`

**Solution:**
- Verify SMTP credentials in .env
- For Gmail, ensure App Password is correct (not your regular password)
- Check if 2-Step Verification is enabled on Gmail
- Try using an app-specific password

#### 3. Payment Gateway Issues

**Error:** `Payment verification failed`

**Solution:**
- For Khalti: Verify KHALTI_SECRET_KEY is correct
- For eSewa: Verify ESEWA_MERCHANT_ID and ESEWA_SECRET_KEY
- Check that you're using correct environment (dev/live)
- Ensure callback URLs match your configuration

#### 4. CORS Errors

**Error:** `Access-Control-Allow-Origin`

**Solution:**
- Update CLIENT_URL in backend/.env to match your frontend URL
- Check CORS configuration in backend/server.js

#### 5. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5001`

**Solution:**
- Find and kill the process: `lsof -i :5001` then `kill -9 <PID>`
- Or change the PORT in .env

#### 6. JWT Token Expired

**Solution:**
- Clear browser localStorage and login again
- Check JWT_EXPIRE setting (default: 15m)
- Implement refresh token flow

#### 7. Images Not Loading

**Solution:**
- Check that uploads folder exists and has proper permissions
- Verify FILE_PATH in server.js
- For production, configure S3 storage

---

📦 Deployment
==============

### Vercel Deployment

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed instructions.

Quick steps:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```



### Environment Variables for Production

When deploying to production, ensure:
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Configure proper database URL
- [ ] Set up SMTP for transactional emails
- [ ] Configure payment gateway keys for live environment
- [ ] Enable HTTPS/SSL

---

🤝 Contributing
==============

We welcome contributions! Please follow these steps:

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ecommerce-3.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Write tests for new features
6. Run tests: `npm test`
7. Commit your changes: `git commit -m 'Add some feature'`
8. Push to the branch: `git push origin feature/your-feature-name`
9. Create a Pull Request

### Code Style

- Use meaningful variable and function names
- Comment complex logic
- Follow existing code patterns
- Use ESLint for code linting
- Format code with Prettier

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details

---

📝 License
==========

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

🙏 Acknowledgments
==================

- [React](https://react.dev/) - UI framework
- [Express](https://expressjs.com/) - Web framework
- [Sequelize](https://sequelize.org/) - ORM
- [Khalti](https://khalti.com/) - Payment gateway
- [eSewa](https://esewa.com.np/) - Payment gateway
- [Nodemailer](https://nodemailer.com/) - Email sending
- [Recharts](https://recharts.org/) - Charts
- [Vite](https://vitejs.dev/) - Build tool

---

📞 Support
==========

- 📧 Email: sushantsha985@gmail.com
- 💬 Discord: [Join our community](https://discord.gg/electrocart)
- 📖 Documentation: [Wiki](https://github.com/electrocart/wiki)
- 🐛 Issues: [GitHub Issues](https://github.com/electrocart/issues)

---

Made with ❤️ for the Nepalese e-commerce community

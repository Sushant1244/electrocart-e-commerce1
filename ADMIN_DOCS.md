# ElectroCart Admin Panel - Documentation

## Overview

The ElectroCart Admin Panel provides comprehensive management capabilities for e-commerce operations, including product management, order tracking, inventory control, and analytics. This document covers the enhanced features and new Inventory Management system.

---

## Admin Panel Features

### 1. Dashboard (`/admin`)

The main dashboard provides a comprehensive overview of store performance:

- **Statistics Cards**: Total Revenue, Total Sales, Products Count, Users Count
- **Revenue Charts**: Visual representation of monthly revenue trends
- **Sales Analytics**: Weekly sales patterns and category distribution
- **Low Stock Alerts**: Warning notifications for products running low
- **Recent Orders**: Quick view of latest orders with status badges

### 2. Inventory Management (`/admin/inventory`)

The new Inventory Management system offers comprehensive stock control:

#### Features

- **Real-time Stock Overview**: View all products with current stock levels
- **Advanced Filtering**: Filter by category, stock status (In Stock, Low Stock, Critical, Out of Stock)
- **Search Functionality**: Search products by name, SKU, or description
- **Sorting Options**: Sort by name, stock level, price, or category
- **Bulk Operations**: Select multiple products and restock them simultaneously
- **Quick Stock Updates**: Direct inline editing of stock quantities
- **Stock Status Indicators**: Visual badges showing stock health

#### Stock Status Levels

| Status | Definition | Color |
|--------|-----------|-------|
| In Stock | Stock > 20 units | Green |
| Low Stock | Stock 1-19 units | Yellow |
| Critical | Stock 1-5 units | Orange |
| Out of Stock | Stock = 0 | Red |

#### Actions

- **Restock Individual Products**: Add stock to a single product
- **Bulk Restock**: Add stock to multiple products at once
- **Direct Stock Edit**: Click on stock quantity to edit directly
- **View Product Details**: Navigate to product edit page

### 3. Product Management (`/admin/add`, `/admin/edit/:id`)

- Add new products with images, pricing, descriptions
- Edit existing product details
- Set product categories and variants
- Manage product visibility

### 4. Order Management (`/admin/orders`)

- View all customer orders
- Update order status (Pending, Processing, Shipped, Delivered, Cancelled)
- Track delivery status
- Add tracking numbers

### 5. Blog Management (`/admin/blogs`, `/admin/add-blog`, `/admin/edit-blog/:id`)

- Create and publish blog posts
- Edit existing blogs
- Manage blog content

---

## API Endpoints

### Inventory API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/inventory/overview` | Get inventory statistics | Admin |
| GET | `/api/inventory/low-stock` | Get low stock products | Admin |
| POST | `/api/inventory/bulk-stock` | Bulk update stock | Admin |
| PATCH | `/api/inventory/adjust-stock/:id` | Adjust single product stock | Admin |

#### Inventory Overview Response

```json
{
  "success": true,
  "stats": {
    "totalProducts": 50,
    "inStock": 45,
    "lowStock": 3,
    "criticalStock": 1,
    "outOfStock": 1,
    "totalValue": 150000
  },
  "lowStockProducts": [...],
  "outOfStockProducts": [...],
  "categoryStats": [...]
}
```

#### Bulk Stock Update Request

```json
{
  "products": [
    { "productId": "abc123", "stock": 50 },
    { "productId": "def456", "stock": 30 }
  ]
}
```

---

## User Authentication & Authorization

### Admin Access

Admin access requires:
1. Valid JWT token
2. User account with `isAdmin: true` flag

### Role-Based Permissions

| Feature | Regular User | Admin |
|---------|--------------|-------|
| View Products | ✅ | ✅ |
| Add to Cart | ✅ | ✅ |
| Place Orders | ✅ | ✅ |
| View Own Orders | ✅ | ✅ |
| Admin Dashboard | ❌ | ✅ |
| Inventory Management | ❌ | ✅ |
| Product CRUD | ❌ | ✅ |
| Order Management | ❌ | ✅ |

---

## Responsive Design

The admin panel is fully responsive and works on:

- **Desktop**: Full sidebar navigation with expanded content
- **Tablet**: Collapsible sidebar
- **Mobile**: Hamburger menu with slide-out navigation

### Mobile Navigation

1. Tap the hamburger icon (☰) to open the menu
2. Use the menu to navigate between sections
3. Tap outside or select an item to close

---

## Error Handling

### Frontend Error States

- **Loading States**: Spinner animations while data loads
- **Error States**: User-friendly error messages with retry options
- **Empty States**: Helpful messages when no data exists

### API Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized (no token)
- `403` - Forbidden (not admin)
- `500` - Server Error

---

## Testing

### Backend Tests

Run inventory tests:

```bash
cd backend
npm test -- inventory.test.js
```

### Test Coverage

- Authentication (401 for missing, 403 for non-admin)
- Inventory overview endpoint
- Low stock filtering
- Bulk stock operations
- Stock adjustment validation

---

## Quick Start for Admins

### Accessing Admin Panel

1. Log in with admin credentials
2. Navigate to `/admin` 
3. Use the sidebar to access different sections

### Managing Inventory

1. Go to **Inventory** from sidebar
2. Use filters to find products
3. Click stock quantity to edit directly
4. Use **Restock** button for bulk updates
5. Click **Add Product** for new items

---

## Troubleshooting

### Common Issues

**"Unable to load admin data"**
- Ensure backend server is running on port 5001
- Check network connectivity

**"Access denied: Admins only"**
- Verify your account has admin privileges
- Log out and log back in to refresh token

**Inventory not updating**
- Check product ID exists
- Verify stock value is a positive number

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB/PostgreSQL (via adapter)
- **Authentication**: JWT
- **Charts**: Recharts

---

## File Structure

```
frontend/src/pages/admin/
├── AdminDashboard.jsx      # Main dashboard
├── AdminInventory.jsx     # Inventory management (NEW)
├── AdminLayout.jsx         # Layout with sidebar (NEW)
├── AdminAddProduct.jsx     # Add product form
├── AdminEditProduct.jsx   # Edit product form
├── AdminOrders.jsx        # Order management
├── AdminBlogs.jsx        # Blog listing
├── AdminAddBlog.jsx      # Add blog form
├── AdminEditBlog.jsx     # Edit blog form
└── admin.css             # All admin styles

backend/
├── routes/
│   └── inventory.js      # Inventory API (NEW)
├── middleware/
│   └── auth.js           # JWT authentication
└── test/
    └── inventory.test.js # API tests (NEW)
```

---

*Last Updated: February 2026*

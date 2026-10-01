# Payment Verification Troubleshooting Guide

## ElectroCart Ecommerce - Payment Verification Issues

---

## 🔍 Root Cause Analysis

Based on the system analysis, here are the **identified issues** causing payment verification failures:

### Current Configuration Status

| Payment Method | Configured | Status |
|----------------|------------|--------|
| **Khalti** | ✅ Yes | Working (Live keys configured) |
| **eSewa** | ❌ No | NOT CONFIGURED - Uses dev fallback |
| **Bank Transfer** | ⚠️ Partial | Requires manual confirmation |

### Key Findings from Code Review

1. **eSewa**: No `ESEWA_SECRET` or `ESEWA_VERIFY_URL` configured in `backend/.env`
2. **Bank Payment**: Requires either webhook callback OR manual confirmation via API
3. **Khalti**: Properly configured with live keys

---

## Understanding the Payment Flow

### eSewa Payment Flow
```
1. User selects eSewa → Order created (unpaid)
2. User redirected to eSewa → Makes payment
3. eSewa returns token → Frontend calls /api/payments/esewa/verify
4. Server verifies token with eSewa API → Marks order as paid
```

**Current Issue**: Without proper eSewa credentials, verification cannot complete.

### Bank Payment Flow
```
1. User selects Bank Transfer → Order created (unpaid)
2. System generates reference number (BANK-XXXXX)
3. User transfers money to bank account
4. Payment confirmed via:
   - Option A: Bank webhook callback (requires bank integration)
   - Option B: Manual confirmation via /api/payments/bank/confirm
```

**Current Issue**: No automated webhook - requires manual API call.

---

## Troubleshooting Steps

### 🟢 For eSewa Payment Issues

#### If you're in DEVELOPMENT mode (local testing):
The system has a **dev fallback** that auto-accepts any token. Try:
1. Make sure you're testing with the dev environment
2. Check if payment actually returns a token to the frontend

#### If you're in PRODUCTION or want real eSewa:

**Step 1: Configure eSewa Credentials**

Add to `backend/.env`:
```env
# eSewa Configuration
ESEWA_VERIFY_URL=https://esewa.com.np/api/verify
ESEWA_SECRET=your_esewa_secret_key
```

**Step 2: Restart the server**
```bash
cd backend && node server.js
```

**Step 3: Test eSewa verification**
```bash
curl -X POST http://localhost:3000/api/payments/esewa/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"test_token","amount":1000,"orderId":"YOUR_ORDER_ID"}'
```

#### Common eSewa Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Verification failed" | Invalid token or API error | Check token with eSewa dashboard |
| "eSewa verify failed" | Network/API timeout | Check internet connection |
| "token required" | Frontend not sending token | Check payment integration |
| Order stays "pending" | No callback received | Verify frontend calls /esewa/verify |

---

### 🔵 For Bank Payment Issues

#### Option 1: Manual Confirmation (Recommended for testing)

**Step 1: Get the order reference**

When you initiate a bank payment, you receive a reference like:
```json
{
  "reference": "BANK-1234567890-1234",
  "instructions": { "reference": "BANK-1234567890-1234" }
}
```

**Step 2: Confirm payment via API**

```bash
curl -X POST http://localhost:3000/api/payments/bank/confirm \
  -H "Content-Type: application/json" \
  -d '{"reference":"BANK-1234567890-1234","status":"paid"}'
```

Or confirm by order ID:
```bash
curl -X POST http://localhost:3000/api/payments/bank/confirm \
  -H "Content-Type: application/json" \
  -d '{"purchase_order_id":"YOUR_ORDER_ID","status":"paid"}'
```

#### Option 2: Webhook Integration (For production)

**Step 1: Configure webhook endpoint**

Your bank needs to POST to: `https://your-domain.com/api/payments/bank/webhook`

**Step 2: Expected webhook payload:**
```json
{
  "orderId": "ORDER_ID",
  "status": "paid",
  "details": {
    "transactionId": "TXN123",
    "amount": 1000,
    "date": "2026-02-14"
  }
}
```

#### Common Bank Payment Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Order stays "pending" | No confirmation received | Call /bank/confirm endpoint |
| "Unknown reference" | Reference not found | Check the reference number |
| "orderId required" | Missing order ID | Include orderId in request |
| Amount mismatch | Transfer != Order amount | Verify with bank |

---

## Quick Fixes

### Fix 1: Enable Unverified Orders for Testing

If you just want to test the order flow without real payments:

Add to `backend/.env`:
```env
ALLOW_UNVERIFIED_ORDERS=true
```

> ⚠️ **WARNING**: Never enable this in production!

### Fix 2: Check Server Logs

The backend terminal shows payment status. Look for:
```
[esewa] eSewa verify failed: ...
[khalti] Khalti verify returned non-2xx ...
bank webhook handler failed: ...
```

### Fix 3: Database Check

Check order payment status directly in database:
```sql
SELECT id, total, paymentMethod, isPaid, paymentResult 
FROM "Orders" 
WHERE id = 'YOUR_ORDER_ID';
```

---

## Information to Provide for Support

If issues persist, collect this information:

### Required Information

1. **Order Details**
   - Order ID: `___________`
   - Amount: `___________`
   - Payment Method: `___________` (esewa/bank/khalti)

2. **Error Messages**
   - Exact error text: `___________`
   - When did it occur: `___________`

3. **Payment Provider Response**
   - Transaction ID (if any): `___________`
   - Token (if any): `___________`

4. **Environment Details**
   - Development or Production? `___________`
   - Did this work before? `___________`

### How to Get Order ID

1. From browser developer tools → Network tab → Check order creation response
2. From database: `SELECT * FROM "Orders" ORDER BY "createdAt" DESC LIMIT 5;`
3. From frontend: Check order confirmation page

### How to Test Payment Verification

**Test eSewa (with dev mode):**
```bash
curl -X POST http://localhost:3000/api/payments/esewa/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"test","amount":100,"orderId":"ORDER_ID"}'
```

**Test Bank Confirmation:**
```bash
curl -X POST http://localhost:3000/api/payments/bank/confirm \
  -H "Content-Type: application/json" \
  -d '{"purchase_order_id":"ORDER_ID","status":"paid"}'
```

**Test Khalti Verification:**
```bash
curl -X POST http://localhost:3000/api/payments/khalti/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN","amount":100,"purchase_order_id":"ORDER_ID"}'
```

---

## Payment Status Reference

| Status | Meaning | Next Step |
|--------|---------|------------|
| `isPaid: false, paymentResult: null` | Payment not initiated | Start payment process |
| `isPaid: false, paymentResult: {...}` | Payment initiated, not verified | Complete verification |
| `isPaid: true, paidAt: Date` | Payment verified successfully | Order processing |
| `isPaid: false, paidAt: null` | Payment failed | Retry or use different method |

---

## Configuration Checklist

- [ ] Khalti keys configured (Live keys present)
- [ ] eSewa credentials added (for production)
- [ ] Bank webhook configured (for production) OR
- [ ] Manual confirmation process in place
- [ ] Server restarted after .env changes

---

## Contact Development Team

If you've tried all above and still facing issues:

1. Check backend logs for specific error messages
2. Verify all payment credentials in `.env`
3. Test with a simple order first (COD mode)
4. Provide the order ID and exact error message

**Server log location**: Check terminal where `node server.js` is running

---

*Last Updated: 2026-02-14*
*For ElectroCart Ecommerce Platform*

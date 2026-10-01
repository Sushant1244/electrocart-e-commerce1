# OTP Authentication Troubleshooting Guide

## ElectroCart Ecommerce - Email Verification OTP System

---

## 🔍 Important Finding: Email System Status

**Your email system IS working!** Server logs show:
- Using SMTP transport: `smtp.ethereal.email`
- Emails successfully sent to: `sushantshah985@gmail.com`, `samandaman614@gmail.com`

**However**, Ethereal Email is a TESTING service that doesn't deliver real emails. This is why you're NOT receiving them in your inbox.

### ⚠️ To Receive Real Emails - Configure Gmail

The `.env` file has placeholder values. You need real Gmail credentials:

1. **Generate App-Specific Password:**
   - Go to [myaccount.google.com](https://myaccount.google.com) → Security
   - Enable 2-Step Verification
   - Search "App passwords" → Create new for "Mail"
   - Copy the 16-character password

2. **Update `backend/.env`:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-real-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx    # App password
   FROM_EMAIL=your-real-gmail@gmail.com
   ```

3. **Restart server:** `cd backend && node server.js`

4. **Test:** `node backend/scripts/test_send_otp.js your-email@gmail.com`

---

## Table of Contents

1. [Common OTP Errors and Causes](#common-otp-errors-and-causes)
2. [SMTP Configuration Issues](#smtp-configuration-issues)
3. [OTP Code Issues](#otp-code-issues)
4. [Account Verification Failures](#account-verification-failures)
5. [Rate Limiting Issues](#rate-limiting-issues)
6. [Testing the OTP System](#testing-the-otp-system)
7. [Prevention Strategies](#prevention-strategies)
8. [Platform-Specific Solutions](#platform-specific-solutions)
9. [Debugging Tips](#debugging-tips)

---

## Common OTP Errors and Causes

### 1. Incorrect Code Entry

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Invalid code" error | Typing wrong digits | Request new OTP, type carefully |
| Auto-fill wrong code | Browser cached old OTP | Disable auto-fill, type manually |
| Leading/trailing spaces | Copy-paste error | Trim spaces when entering code |
| Similar looking digits (0/O, 1/I) | Confusion between characters | Request new code with clearer digits |

**Best Practices:**
- Type the code manually instead of copy-pasting
- Clear any auto-fill suggestions
- Request a new code if unsure

### 2. Expired Codes

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Expired code" error | Code older than 10 minutes | Request new OTP |
| Code worked once but fails | Multiple verification attempts | Use the first correct code |
| Taking too long to enter | Delay in typing | Request new code and enter quickly |

**Your System Settings:**
- Code validity: **10 minutes**
- After expiration, you must request a new code
- Each code can only be used once

### 3. Device Time Synchronization

| Symptom | Cause | Solution |
|---------|-------|----------|
| Code expires prematurely | Device clock is wrong | Sync device time automatically |
| "Invalid code" despite correct input | Time zone mismatch | Set correct time zone |
| Works on one device, not another | Different time settings | Check time on all devices |

**How to Fix:**
```
# On iOS:
Settings → General → Date & Time → Set Automatically: ON

# On Android:
Settings → System → Date & Time → Automatic date & time: ON

# On Windows:
Settings → Time & Language → Set time automatically: ON

# On Mac:
System Preferences → Date & Time → Set date and time automatically: ON
```

### 4. Rate Limiting Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Too many resend attempts" | More than 5 requests/hour | Wait 1 hour before trying again |
| "Please wait before requesting" | Less than 60s between requests | Wait 60 seconds |
| Suddenly stopped receiving | Rate limit exceeded | Check your request frequency |

**Your System Limits:**
- Maximum: **5 OTP requests per hour**
- Minimum interval: **60 seconds** between requests
- Both limits apply per email address

### 5. Account Verification Failures

| Symptom | Cause | Solution |
|---------|-------|----------|
| "User not found" | Wrong email address | Use the email you registered with |
| "Already verified" | Account verified previously | No action needed, login directly |
| "Token mismatch" | Database sync issue | Restart server, request new code |
| Verification doesn't persist | Database error | Check server logs, contact support |

---

## Platform-Specific Solutions

### Mobile Apps

**iOS:**
- Check Settings → Mail → Spam settings
- Add noreply@ to contacts
- Enable push notifications for verification

**Android:**
- Check Gmail → Spam folder
- Disable battery optimization for email app
- Verify Google Play Services is up to date

**General Mobile Tips:**
- Use SMS as backup verification method
- Enable biometric authentication after verification
- Keep email app updated

### Websites

**Browser Issues:**
- Clear browser cache and cookies
- Disable extensions that block emails
- Try incognito/private browsing mode
- Ensure JavaScript is enabled

**Session Issues:**
- Don't open verification link in multiple tabs
- Complete verification in the same session
- Disable VPN while verifying

### Banking Systems

**For Financial Services:**
- Use hardware security keys when available
- Enable SMS + Email dual verification
- Keep phone number updated
- Contact bank if OTP not received after multiple attempts

**Security Considerations:**
- Never share OTP with anyone
- Banks never ask for OTP via phone
- Report suspicious emails to your bank

### Messaging Services (WhatsApp, Telegram)

**Alternative Delivery:**
- Request OTP via WhatsApp/Telegram if available
- Use authenticator app (Google Authenticator, Authy)
- Backup codes for account recovery

---

## Prevention Strategies

### For Users

1. **Add sender to contacts**
   - Add noreply@electrocart.com to your contacts
   - This prevents emails from going to spam

2. **Use a reliable email provider**
   - Gmail, Outlook, or Yahoo are recommended
   - Avoid using custom domain emails that may block SMTP

3. **Enable multiple verification methods**
   - Add phone number for SMS backup
   - Use authenticator app for time-based codes

4. **Keep contact info updated**
   - Verify your email is correct
   - Update email if you change addresses

5. **Act promptly on verification**
   - Enter code immediately after receiving
   - Don't wait - codes expire in 10 minutes

### For Developers

1. **Log all OTP operations**
   ```javascript
   console.log('[OTP] Sending to:', email);
   console.log('[OTP] Generated code:', otp);
   console.log('[OTP] Expires at:', new Date(expireAt));
   ```

2. **Monitor delivery rates**
   - Track successful vs failed deliveries
   - Set up alerts for repeated failures

3. **Implement backup verification**
   - SMS fallback via Twilio
   - Authenticator app (TOTP)

4. **Handle edge cases**
   - Duplicate verification requests
   - Concurrent verification attempts
   - Database connection failures

5. **Security best practices**
   - Hash OTP codes (already implemented with SHA-256)
   - Rate limiting (already implemented)
   - Log failed attempts for fraud detection

---

## OTP System Implementation Details

### Current Configuration

- **Code Length**: 6 digits (000000-999999)
- **Expiration**: 10 minutes
- **Hash Algorithm**: SHA-256
- **Rate Limit**: 5 resends per hour, 60 seconds between resends
- **Email Service**: Gmail SMTP (nodemailer)

### Endpoint Flow

```
1. POST /api/auth/register → Creates user, generates OTP, sends email
2. POST /api/auth/verify-email → Verifies OTP, marks email as verified
3. POST /api/auth/resend-verification → Rate-limited resend of OTP
```

---

## Fix SMTP Configuration

### Step 1: Enable 2-Step Verification on Google Account

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** (left sidebar)
3. Under "How you sign in to Google", enable **2-Step Verification**

### Step 2: Generate App-Specific Password

1. Go to [myaccount.google.com](https://myaccount.google.com) → **Security**
2. Search for "App passwords" in the search bar
3. Select **Mail** as the app
4. Select **Other (Custom name)** and name it "ElectroCart"
5. Click **Generate**
6. Copy the 16-character password shown

### Step 3: Update .env File

Edit `backend/.env`:

```env
# SMTP settings for Gmail - OTP Email Verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx    # <- Your 16-char App password
FROM_EMAIL=your-actual-gmail@gmail.com
```

### Step 4: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend && node server.js
```

---

## Testing the OTP System

### Test 1: Check SMTP Configuration

Run the test script:

```bash
cd backend
node scripts/test_send_otp.js your-email@gmail.com
```

Expected output:
```
========================================
OTP Email Test
========================================

Sending OTP to: your-email@gmail.com

Generated OTP: 123456
----------------------------------------
✓ Transporter initialized successfully
✓ OTP email sent successfully!
  Message ID: <some-id>
  Accepted: ['your-email@gmail.com']

========================================
SUCCESS: OTP sent to your-email@gmail.com
========================================
```

### Test 2: Full Registration Flow

1. Start the backend server
2. Start the frontend
3. Register a new user at `http://localhost:5173/register`
4. Check email for OTP
5. Enter OTP to verify email

---

## Troubleshooting Steps

### If OTP Email Not Received

1. **Check spam/junk folder** - Gmail sometimes marks automated emails as spam
2. **Verify SMTP configuration** - Run test script above
3. **Check server logs** - Look for email errors in terminal
4. **Verify email address** - Make sure you're using correct email
5. **Wait for rate limit** - If you requested too many, wait 1 hour

### If OTP Code Invalid/Expired

1. **Request new code** - Use "Resend verification code" option
2. **Enter quickly** - Code expires in 10 minutes
3. **Check time sync** - Your device time should be accurate
4. **Clear cache** - Try incognito/private browsing mode

### If Verification Fails After Correct Code

1. **Database sync issue** - Restart the server
2. **Check user record** - Ensure email matches exactly
3. **Request new code** - Previous code may have been used

---

## Prevention Strategies

### For Users

1. **Add noreply to contacts** - Prevents spam filtering
2. **Use correct email** - Double-check email address
3. **Enter code promptly** - Don't delay verification
4. **Check spam folder** - First-time senders often go there

### For Developers

1. **Log all OTP operations** - Track send/verify attempts
2. **Monitor email delivery** - Set up alerts for failures
3. **Implement backup verification** - SMS or auth app as backup
4. **Use proper rate limiting** - Prevent abuse while allowing legitimate use

---

## Platform-Specific Solutions

### Mobile Apps

- **Push notification alternative**: Consider Firebase Cloud Messaging
- **SMS fallback**: Use Twilio for countries without reliable email

### Websites

- **Progressive web app**: Offline OTP verification
- **Session storage**: Remember verified users

### Banking Systems

- **Hardware tokens**: For high-security transactions
- **Biometric verification**: Fingerprint/face ID

### Messaging Services

- **Multi-factor approach**: OTP + WhatsApp/elegram delivery
- **Backup codes**: Generate backup codes for account recovery

---

## Error Messages Reference

| Error Code | Message | Action |
|------------|---------|--------|
| 400 | Email and code required | Provide both email and OTP |
| 400 | Invalid or expired verification code | Request new OTP |
| 400 | Email exists | Use different email or login |
| 429 | Too many resend attempts | Wait 1 hour before trying again |
| 429 | Please wait before requesting another code | Wait 60 seconds |
| 500 | Failed to set up email verification | Contact support |
| 500 | Failed to verify email | Try again or contact support |

---

## Contact Support

If issues persist after trying all solutions:

1. Check backend logs for detailed error messages
2. Verify all .env configuration values
3. Test SMTP with the test script
4. Contact development team with:
   - Error message
   - Steps to reproduce
   - Email used
   - Server logs (redacted)

---

*Last Updated: 2026-02-14*
*For ElectroCart Ecommerce Platform*

---

## Debugging Tips

### Check Server Logs

The backend terminal shows email delivery status. Look for:

```
[mailer] sent [ 'user@example.com' ]  # Success!
[mailer] Email delivery failed: ...    # Check error message
```

### Verify OTP Flow

1. **Registration**: `POST /api/auth/register` → Creates user, sends OTP
2. **Verification**: `POST /api/auth/verify-email` → Validates 6-digit code
3. **Resend**: `POST /api/auth/resend-verification` → Rate-limited (5/hour)

### Common User Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| New registration | OTP email sent immediately |
| Verify within 10 min | Email verified successfully |
| After 10 minutes | "Expired code" error - request new |
| Too many resends | "Too many attempts" - wait 1 hour |

### Test Email Delivery

Run the test script:

```bash
cd backend
node scripts/test_send_otp.js your-email@gmail.com
```

If successful, you'll see:
```
✓ Transporter initialized successfully
✓ OTP email sent successfully!
```

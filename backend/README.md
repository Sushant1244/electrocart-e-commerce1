# Backend - SMTP / Email setup

This project sends transactional emails (verification codes, reset links, order notifications) using Nodemailer.

By default (development) the app will use an Ethereal test account and print a preview URL in the server logs so you can inspect emails locally.

To deliver real emails (e.g. to Gmail), set the following environment variables in `backend/.env` or in your deployment environment and restart the backend:

- SMTP_HOST (e.g. `smtp.gmail.com` or provider host)
- SMTP_PORT (usually `587` for STARTTLS, `465` for SSL)
- SMTP_USER (your SMTP username - often your email address or API user)
- SMTP_PASS (SMTP password, app password or API key)
- FROM_EMAIL (the value used in the From header; default: `no-reply@electrocart.local`)

Example for Gmail (recommended: use an App Password when 2FA is enabled):

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password_here
FROM_EMAIL=electrocartecommerce@gmail.com

Notes and recommendations:
- For production use, prefer a transactional email provider (SendGrid, Mailgun, Postmark, Amazon SES) rather than directly using Gmail. These providers have higher deliverability and API features (templates, analytics).
- If you use Gmail, create an App Password (Google account -> Security -> App passwords) and use that as `SMTP_PASS` instead of your account password.
- Ensure `FROM_EMAIL` is an email you control; some SMTP providers require sender verification.
- After setting env vars, restart the backend process so nodemailer picks up the SMTP transport.

Troubleshooting:
- If emails are not delivered, check backend logs for errors from the mailer. The server will log a clear error if SMTP is missing in production.
- During local development, Ethereal previews will be printed in server logs. Open the preview URL in your browser to view the email content.


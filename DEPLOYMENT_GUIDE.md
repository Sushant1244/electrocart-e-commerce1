# Complete Deployment Guide for rameshprasadsah.com.np

This guide will help you host your e-commerce website on your domain `rameshprasadsah.com.np` using Vercel.

---

## Prerequisites

Before starting, you need to create these free accounts:

1. **Vercel** - https://vercel.com (for hosting)
2. **Neon** - https://neon.tech (for free PostgreSQL database)
3. **Gmail** or any SMTP provider (for sending emails)

---

## Step 1: Push Code to GitHub

1. Create a new repository on GitHub
2. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2: Set Up PostgreSQL Database (Neon - Free)

1. Go to https://neon.tech and sign up with GitHub
2. Create a new project:
   - Name: `ecommerce-db`
   - Select "Free" tier
3. Once created, go to "Connection Details"
4. Copy the connection string (it looks like: `postgres://username:password@host.neon.tech/database?sslmode=require`)

---

## Step 3: Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. In Environment Variables, add these:

| Variable Name | Value |
|--------------|-------|
| `NODE_ENV` | `production` |
| `POSTGRES_URL` | Your Neon connection string |
| `CLIENT_URL` | `https://rameshprasadsah.com.np` (after domain setup) |
| `PORT` | `5001` |
| `PG_SYNC` | `true` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password |
| `FROM_EMAIL` | Your Gmail address |
| `VITE_KHALTI_PUBLIC_KEY` | `6d924a2e26d84ad6934b8593625dfea1` |
| `VITE_API_URL` | (leave empty) |

5. Click "Deploy"

---

## Step 4: Connect Custom Domain (rameshprasadsah.com.np)

After deployment succeeds:

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Enter `rameshprasadsah.com.np`
4. Click "Add"

### Configure DNS at Your Domain Registrar

Log into where you bought `rameshprasadsah.com.np` (e.g., .np registrar) and add these DNS records:

| Type | Name | Value |
|------|------|-------|
| CNAME | @ | cname.vercel-dns.com |
| CNAME | www | cname.vercel-dns.com |

**Note:** The exact CNAME value may vary - Vercel will show you the correct value after you add the domain.

---

## Step 5: Update Environment Variables

After connecting domain:

1. Go to Vercel → Settings → Environment Variables
2. Update `CLIENT_URL` to: `https://rameshprasadsah.com.np`
3. Redeploy: Go to Deployments → Click "..." → "Redeploy"

---

## Step 6: Test Your Website

After DNS propagates (may take 5-30 minutes):

- Visit: https://rameshprasadsah.com.np
- Test the API: https://rameshprasadsah.com.np/api/products

---

## Important Notes

### Gmail App Password
To use Gmail for sending emails:
1. Go to https://myaccount.google.com/apppasswords
2. Generate an app password (select "Mail" and "Other custom name")
3. Use that 16-character password as `SMTP_PASS`

### Getting Help
- Vercel support: https://vercel.com/docs
- Neon support: https://neon.tech/docs

---

## Alternative: If You Have Your Own Server

If you want to host on your own server instead of Vercel:

1. Upload the code to your server
2. Set up PostgreSQL on the server
3. Configure environment variables in a `.env` file
4. Run:
```bash
cd backend && npm install && npm start
cd frontend && npm install && npm run build
```
5. Configure Nginx to serve the frontend and proxy API requests
6. Point your domain A record to your server IP

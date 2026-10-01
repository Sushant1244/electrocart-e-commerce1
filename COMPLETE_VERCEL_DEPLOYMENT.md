# Complete Vercel Deployment Guide

This guide covers connecting your domain, backend, and database to Vercel.

---

## Prerequisites

- [ ] Vercel account
- [ ] Domain: rameshprasadsah.com.np
- [ ] PostgreSQL database (Vercel Postgres recommended)

---

## Step 1: Deploy Backend + Frontend to Vercel

### Option A: Deploy via GitHub
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: **Other**
   - Build Command: *(leave empty)*
   - Output Directory: *(leave empty)*
6. Click **Deploy**

### Option B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

---

## Step 2: Set Up PostgreSQL Database

### Create Database (Vercel Postgres)
1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Search **"Postgres"** and click it
3. Click **"Deploy"**
4. Copy the `POSTGRES_URL` from the connection details

---

## Step 3: Configure Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add these:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `PORT` | `5001` | Production |
| `POSTGRES_URL` | *(your database URL from Step 2)* | Production |
| `CLIENT_URL` | `https://rameshprasadsah.com.np` | Production |
| `FRONTEND_URL` | `https://rameshprasadsah.com.np` | Production |
| `PG_SYNC` | `true` | Production |
| `SMTP_HOST` | `smtp.gmail.com` | Production |
| `SMTP_PORT` | `587` | Production |
| `SMTP_USER` | *(your email)* | Production |
| `SMTP_PASS` | *(your app password)* | Production |
| `FROM_EMAIL` | *(your email)* | Production |
| `VITE_KHALTI_PUBLIC_KEY` | `6d924a2e26d84ad6934b8593625dfea1` | Production |

**Note:** After adding variables, you need to **redeploy** for changes to take effect.

---

## Step 4: Connect Your Domain

### Add Domain in Vercel
1. Go to **Settings** → **Domains**
2. Enter `rameshprasadsah.com.np`
3. Click **Add**

### Configure DNS at Your Domain Registrar
Add this DNS record (exact value from Vercel):

| Type | Name | Value |
|------|------|-------|
| CNAME | www | *(the CNAME shown in Vercel, e.g., `00d03b8d75c2dOaO.vercel-dns-017.com`)* |

### Wait for Propagation
- Wait 5-30 minutes
- Click **Refresh** in Vercel Domains page
- Domain should show **"Valid"** status

---

## Step 5: Initialize Database Tables

After deployment, run the seed script to create tables:

```bash
# Option 1: Via Vercel CLI
vercel env pull
cd backend && node seed_pg.js
```

Or add a one-time trigger in your backend code to sync on first request by setting `PG_SYNC=true`.

---

## Step 6: Test Your Deployment

| Endpoint | URL |
|----------|-----|
| Frontend | https://rameshprasadsah.com.np |
| API | https://rameshprasadsah.com.np/api/products |

Test API:
```bash
curl https://rameshprasadsah.com.np/api/products
```

---

## Troubleshooting

### Domain Not Working
- Run `dig www.rameshprasadsah.com.np` to check DNS
- Ensure CNAME record is correct

### Database Connection Error
- Verify `POSTGRES_URL` is correct
- Check database allows Vercel IP connections

### CORS Error
- Ensure `CLIENT_URL=https://rameshprasadsah.com.np` is set

### 500 Error on API
- Check Vercel deployment logs
- Verify all environment variables are set

---

## Complete Flow

```
1. GitHub Push
      ↓
2. Vercel Deploys (builds frontend + backend)
      ↓
3. Backend reads POSTGRES_URL
      ↓
4. Backend connects to PostgreSQL
      ↓
5. Domain points to Vercel
      ↓
6. Users access https://rameshprasadsah.com.np
```

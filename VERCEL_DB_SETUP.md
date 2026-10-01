# How to Connect Database in Vercel Deployment

Your e-commerce backend uses PostgreSQL. Here's how to connect a production database to your Vercel deployment.

## Option 1: Vercel PostgreSQL (Recommended)

### Step 1: Create a Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Search for **"Postgres"** in the Vercel marketplace
4. Click **"Deploy"** to create a new PostgreSQL database
5. Give it a name (e.g., `ecommerce-db`)
6. Copy the `POSTGRES_URL` from the connection details

### Step 2: Add Environment Variable in Vercel

1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - **Variable Name:** `POSTGRES_URL`
   - **Value:** `postgres://...` (the URL from Step 1)
   - **Environment:** Production

### Step 3: Initialize the Database

Run the seed script to create tables:
```bash
cd backend
node seed_pg.js
```

---

## Option 2: External PostgreSQL (e.g., Neon, Supabase, Railway)

### Step 1: Create Database

1. Sign up at [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) or [Railway.app](https://railway.app)
2. Create a new PostgreSQL project
3. Get your connection string (POSTGRES_URL)

### Step 2: Add to Vercel

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `POSTGRES_URL` | `postgres://user:pass@host:5432/db` | Production |

---

## Option 3: Use .env.production

Create `backend/.env.production` with your database credentials:

```env
# PostgreSQL Connection
POSTGRES_URL=postgres://username:password@host:5432/database_name

# Or individual credentials
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ecommerce_production
DB_PORT=5432
DB_SSL=true
```

Then add these in Vercel Settings → Environment Variables.

---

## Database Connection Flow

```
Vercel Backend (server.js)
    ↓ reads
POSTGRES_URL from Environment Variables
    ↓ connects to
PostgreSQL Database (Vercel Postgres / Neon / Supabase)
```

---

## Troubleshooting

**Error: "relation does not exist"**
- Run the seed script: `node backend/seed_pg.js`

**Error: "connection refused"**
- Check your POSTGRES_URL is correct
- Ensure database allows connections from Vercel's IP

**Error: "password authentication failed"**
- Verify username and password in your connection string

---

## Your Current Local Database

Your local setup uses:
```
postgres://postgres:root@localhost:5432/electrocart_ecommerce
```

For production, replace `localhost` with your cloud database host.

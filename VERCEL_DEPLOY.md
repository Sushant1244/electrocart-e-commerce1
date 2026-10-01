# Vercel Deployment Guide

This project is configured for deployment to Vercel. It includes both the backend (Express.js) and frontend (React + Vite).

## Prerequisites

1. A Vercel account
2. PostgreSQL database (Vercel Postgres, Neon, or another provider)
3. SMTP credentials for email notifications

## Environment Variables

Set the following environment variables in your Vercel project settings:

### Backend (.env)
- `NODE_ENV=production`
- `POSTGRES_URL` - PostgreSQL connection string (e.g., `postgres://user:password@host:5432/database`)
- `CLIENT_URL` - Your Vercel project URL (e.g., `https://your-project.vercel.app`)
- `PORT=5001`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` - Email settings
- `KHALTI_LIVE_KEY` - Khalti payment secret key (optional)
- `KHALTI_LIVE_PUBLIC_KEY` - Khalti payment public key (optional)
- `PG_SYNC=true` - Enable PostgreSQL schema sync on first deploy

### Frontend
- `VITE_KHALTI_PUBLIC_KEY` - Khalti public key (already set: `6d924a2e26d84ad6934b8593625dfea1`)
- `VITE_API_URL` - Leave empty for production (uses relative `/api` path)

## Deployment Steps

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Option 2: Deploy via GitHub

1. Push your code to a GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure the project settings:
   - Framework Preset: Other
   - Build Command: Leave empty (configured in vercel.json)
   - Output Directory: Leave empty
6. Add environment variables
7. Click "Deploy"

## Project Structure

```
ecommerce-3/
├── vercel.json          # Vercel configuration
├── backend/
│   ├── server.js        # Express server
│   ├── package.json     # Backend dependencies
│   └── ...
└── frontend/
    ├── vite.config.mjs  # Vite configuration
    ├── package.json     # Frontend dependencies
    └── ...
```

## API Endpoints

After deployment, the API will be available at:
- `https://your-project.vercel.app/api/auth`
- `https://your-project.vercel.app/api/products`
- `https://your-project.vercel.app/api/orders`
- `https://your-project.vercel.app/api/...`

## Troubleshooting

### CORS Issues
Ensure `CLIENT_URL` in your environment variables matches your Vercel project URL exactly.

### Database Connection
Make sure `POSTGRES_URL` is correctly formatted:
```
postgres://username:password@host:port/database
```

### File Uploads
Static files are served from `/uploads` path. Make sure uploads are properly configured.

### Build Issues
If the deployment fails to build, make sure:
1. The `frontend/package.json` has a valid `build` script (e.g., `vite build`)
2. The `vercel.json` includes the frontend build step with `@vercel/static-build`
3. The output directory is set to `frontend/dist` to match backend expectations
4. Run `cd frontend && npm run build` locally to verify the build works

### Frontend Not Showing
If the frontend is not displaying after deployment:
1. Check that the route destination points to `frontend/dist/index.html`
2. Verify the build completed successfully in Vercel deployment logs
3. Ensure environment variable `VITE_API_URL` is set correctly (leave empty for production to use relative `/api` path)
4. Check that `vercel.json` outputDirectory is set to `frontend/dist`

## Notes

- The backend runs as a Vercel serverless function
- Cold starts may take a few seconds on first request
- Database connection pooling is handled by the PostgreSQL driver

// vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Set base path for production (Vercel serves from root)
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    copyPublicDir: true,
  },
  publicDir: 'public',
  server: {
    // Bind to IPv4 localhost to avoid IPv6-only binding issues on some macOS setups
    host: '127.0.0.1',
    proxy: {
      "/api": {
        // Use explicit IPv4 loopback to avoid accidental IPv6 resolution of 'localhost'
  // Allow overriding the backend URL with VITE_BACKEND_URL during local dev
  // Default to the backend's usual port 5001 so Vite proxy reaches the running server.
  target: process.env.VITE_BACKEND_URL || "http://127.0.0.1:5001",
        changeOrigin: true,
        secure: false,
        ws: false,
        logLevel: 'debug',
        // Increase proxy timeout to avoid short-lived dev-server proxy hangs
        proxyTimeout: 120000,
        timeout: 120000,
        // Provide hooks to log proxy lifecycle events for easier debugging
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            try {
              // eslint-disable-next-line no-console
              console.error('[vite-proxy] proxy error:', err && err.message ? err.message : err);
            } catch (e) {}
          });
          proxy.on('proxyReq', (proxyReq, req, res, options) => {
            try {
              // eslint-disable-next-line no-console
              console.error('[vite-proxy] proxyReq ->', req.method, req.url, 'headers:', JSON.stringify(req.headers));
            } catch (e) {}
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            try {
              // eslint-disable-next-line no-console
              console.error('[vite-proxy] proxyRes <-', req.method, req.url, 'status:', proxyRes && proxyRes.statusCode);
            } catch (e) {}
          });
        },
        onError: (err, req, res) => {
          try {
            // eslint-disable-next-line no-console
            console.error('[vite-proxy] onError ->', err && err.stack ? err.stack : err);
            if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Proxy error' }));
          } catch (e) {}
        },
        onProxyReq: (proxyReq, req, res) => {
          try {
            // eslint-disable-next-line no-console
            console.error('[vite-proxy] onProxyReq -> method:', req.method, 'url:', req.url);
          } catch (e) {}
        },
        onProxyRes: (proxyRes, req, res) => {
          try {
            // eslint-disable-next-line no-console
            console.error('[vite-proxy] onProxyRes -> method:', req.method, 'url:', req.url, 'status:', proxyRes && proxyRes.statusCode);
          } catch (e) {}
        }
      }
    }
  },
});

AI logo files for the ElectroCart project

Files added:
- `ai-logo.svg` — full vector logo (1024×1024 viewBox). Use for header, marketing, or large assets.
- `ai-logo-badge.svg` — compact rounded-square badge (128×128). Use as a favicon or small UI badges.

How to use in the frontend:
- Public folder (Vite): these files are placed in `frontend/public/` and will be served at `/ai-logo.svg` and `/ai-logo-badge.svg`.
- Example img usage in React:
  <img src="/ai-logo.svg" alt="ElectroCart AI" width="64" height="64" />

Favicon use (in `index.html`):
  <link rel="icon" href="/ai-logo-badge.svg" />

If you want raster (PNG) exports, tell me the sizes you need (e.g. 32×32, 128×128, 512×512) and I will generate SVG-based PNGs you can download or I can add to the repo (note: generating PNG files requires an SVG raster step).

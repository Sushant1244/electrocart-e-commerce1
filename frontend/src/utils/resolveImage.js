import { API_BASE_URL } from '../api/api';

export function resolveImageSrc(img) {
  const API_BASE = API_BASE_URL.replace(/\/api\/?$/, '');
  if (!img) return { local: null, remote: null };
  // allow arrays or comma-separated values
  if (Array.isArray(img)) img = img[0];
  if (typeof img === 'string' && img.includes(',')) img = img.split(',')[0];
  img = String(img).trim();
  // If the image is already an absolute URL or a data URI, return as-is.
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith(window.location.origin)) return { local: img, remote: img };
  // Normalize paths: accept '/uploads/x', 'uploads/x' or just 'x'
  let cleanPath = img;
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  if (!cleanPath.startsWith('uploads/')) cleanPath = `uploads/${cleanPath}`;
  cleanPath = `/${cleanPath}`;
  const lastSlash = cleanPath.lastIndexOf('/');
  const prefix = cleanPath.substring(0, lastSlash + 1);
  const filename = cleanPath.substring(lastSlash + 1);
  // encode filename but preserve slashes and spaces replaced with %20
  const encoded = encodeURIComponent(filename).replace(/%20/g, '%20');
  const origin = window.location.origin;
  const local = `${origin}/uploads/${encoded}`;
  const remote = API_BASE ? `${API_BASE.replace('/api', '')}/uploads/${encoded}` : `${origin}/uploads/${encoded}`;
  return { local, remote };
}

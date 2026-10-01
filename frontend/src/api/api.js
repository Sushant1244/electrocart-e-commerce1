import axios from 'axios';

// In production, use /api prefix. In development, use localhost:5001
const getBaseURL = () => {
  // If explicitly set, use that value (for custom API URLs)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '') {
    const url = import.meta.env.VITE_API_URL;
    // Ensure /api prefix is included
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  // Use /api prefix in production (served from same origin)
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  // Development: add /api prefix to match backend routes
  return 'http://localhost:5001/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  // Do not force Content-Type globally so multipart/form-data (FormData) requests
  // from admin forms work correctly and let the browser set the boundary.
  withCredentials: false,
});
export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

// Initialize Authorization header from localStorage token (so callers don't need to call setAuthToken)
let initialToken = null;
try {
  if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
    initialToken = localStorage.getItem('token');
  }
} catch (e) {
  // localStorage not available in this environment (tests or SSR)
  initialToken = null;
}
if (initialToken) api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;

// Intercept 401 responses and clear auth so UI can prompt login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const message = err?.response?.data?.message;
    if (status === 401 && message && /token/i.test(message)) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        // best-effort navigate to login
        window.location.href = '/login';
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(err);
  }
);

export default api;
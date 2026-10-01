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
  return 'http://127.0.0.1:5001/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  // Do not force Content-Type globally so multipart/form-data (FormData) requests
  // from admin forms work correctly and let the browser set the boundary.
  withCredentials: true,
});
export function setAuthToken(token) {
  // Authentication is handled by httpOnly cookies; tokens never enter JavaScript.
  delete api.defaults.headers.common['Authorization'];
}

// Rotate the refresh cookie once when the short-lived access cookie expires.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const config = err?.config || {};
    if (status === 401 && !config._retry && !config.url?.includes('/auth/')) {
      config._retry = true;
      try {
        return api.post('/auth/refresh').then(() => api(config));
      } catch (e) {
        // Fall through to the original response.
      }
    }
    return Promise.reject(err);
  }
);

export default api;
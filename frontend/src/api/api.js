import axios from 'axios';

const configuredApiUrl = String(import.meta.env.VITE_API_URL || '/api').trim();
const normalizedApiUrl = configuredApiUrl.startsWith('http')
  ? configuredApiUrl.replace(/\/+$/, '')
  : `/${configuredApiUrl.replace(/^\/+/, '').replace(/^api(?:\/api)+/, 'api')}`.replace(/\/$/, '');
export const API_BASE_URL = normalizedApiUrl === '/api' || normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
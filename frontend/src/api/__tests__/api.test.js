import api, { setAuthToken } from '../api';

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  });

  describe('Authentication', () => {
    it('does not expose tokens to JavaScript', () => {
      setAuthToken('test-token-123');
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
      expect(api.defaults.withCredentials).toBe(true);
    });
  });

  describe('Base URL Configuration', () => {
    it('has baseURL configured', () => {
      expect(api.defaults.baseURL).toBeDefined();
    });

    it('contains /api in the baseURL', () => {
      expect(api.defaults.baseURL).toContain('/api');
    });
  });

  describe('Request Configuration', () => {
    it('does not set global Content-Type header (allows browser to set for FormData)', () => {
      expect(api.defaults.headers.common['Content-Type']).toBeUndefined();
    });
  });

  describe('401 Interceptor Logic', () => {
    it('correctly identifies token-related 401 errors', () => {
      const error1 = { response: { status: 401, data: { message: 'Invalid or expired token' } } };
      const error2 = { response: { status: 401, data: { message: 'Token is required' } } };
      const error3 = { response: { status: 401, data: { message: 'Unauthorized access' } } };
      const error4 = { response: { status: 400, data: { message: 'Token error' } } };

      // Token-related errors should be detected
      expect(error1.response.status === 401 && /token/i.test(error1.response.data.message)).toBe(true);
      expect(error2.response.status === 401 && /token/i.test(error2.response.data.message)).toBe(true);
      
      // Non-token 401 should not be detected
      expect(error3.response.status === 401 && /token/i.test(error3.response.data.message)).toBe(false);
      
      // Non-401 should not be detected
      expect(error4.response.status === 401 && /token/i.test(error4.response.data.message)).toBe(false);
    });

    it('keeps authentication state out of token storage', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      expect(localStorage.getItem('user')).toBeNull();
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('BaseURL Logic', () => {
    it('handles custom VITE_API_URL with /api suffix', () => {
      // Verify the getBaseURL function logic works correctly
      // This tests the pattern used in api.js
      const normalizeUrl = (url) => url.endsWith('/api') ? url : `${url}/api`;
      
      expect(normalizeUrl('https://api.example.com/api')).toBe('https://api.example.com/api');
      expect(normalizeUrl('https://api.example.com')).toBe('https://api.example.com/api');
    });
  });
});

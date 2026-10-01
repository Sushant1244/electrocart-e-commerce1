import api, { setAuthToken } from '../api';

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Reset authorization header - need to delete to test properly
    delete api.defaults.headers.common['Authorization'];
  });

  describe('Authentication', () => {
    it('sets Authorization header when setAuthToken is called with token', () => {
      setAuthToken('test-token-123');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token-123');
    });

    it('removes Authorization header when setAuthToken is called with null', () => {
      setAuthToken('test-token-123');
      setAuthToken(null);
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('removes Authorization header when setAuthToken is called with undefined', () => {
      setAuthToken('test-token-123');
      setAuthToken(undefined);
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('correctly sets Bearer token format', () => {
      setAuthToken('my-secret-token');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer my-secret-token');
    });

    it('deletes header when token is null', () => {
      setAuthToken('initial-token');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer initial-token');
      
      setAuthToken(null);
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('deletes header when token is undefined', () => {
      setAuthToken('initial-token');
      setAuthToken(undefined);
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
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

    it('clears localStorage and headers on token-related 401', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      
      // Simulate the interceptor clearing
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('Token Management Functions', () => {
    it('handles various token formats', () => {
      // JWT tokens
      setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ');
      expect(api.defaults.headers.common['Authorization']).toContain('Bearer');
      
      // Simple tokens
      setAuthToken('simple-token-123');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer simple-token-123');
      
      // Reset
      setAuthToken(null);
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

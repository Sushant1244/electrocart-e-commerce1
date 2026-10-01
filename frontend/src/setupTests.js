import '@testing-library/jest-dom';

// optional: any global mocks
window.matchMedia = window.matchMedia || function() {
  return { matches: false, addListener: () => {}, removeListener: () => {} };
};

// Provide a simple localStorage mock for the test environment
if (typeof window.localStorage === 'undefined' || window.localStorage === null) {
  const storage = new Map();
  window.localStorage = {
    getItem(key) { return storage.has(String(key)) ? storage.get(String(key)) : null; },
    setItem(key, value) { storage.set(String(key), String(value)); },
    removeItem(key) { storage.delete(String(key)); },
    clear() { storage.clear(); }
  };
}
// Also expose as global for modules that access localStorage without window prefix
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = window.localStorage;
}

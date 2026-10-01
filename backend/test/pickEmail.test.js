const { pickEmail } = require('../utils/emailHelpers');

describe('pickEmail', () => {
  test('returns first non-empty trimmed email', () => {
    expect(pickEmail('', '  ', null, 'foo@example.com', 'bar')).toBe('foo@example.com');
  });

  test('trims whitespace and returns null for empty candidates', () => {
    expect(pickEmail('   ', '\n\t', null)).toBeNull();
  });

  test('handles non-string inputs', () => {
    expect(pickEmail(0, false, 'a@b.com')).toBe('0');
  });
});

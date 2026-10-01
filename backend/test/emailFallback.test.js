const { pickEmail } = require('../utils/emailHelpers');

describe('email fallback helper', () => {
	test('picks first non-empty email', () => {
		expect(pickEmail('', null, '   ', 'user@example.com', 'other@example.com')).toBe('user@example.com');
	});

	test('returns null when no valid email present', () => {
		expect(pickEmail('', null, '   ')).toBe(null);
	});
});

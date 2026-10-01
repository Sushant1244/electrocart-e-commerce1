const { ALLOWED_MIMES } = require('../routes/orders');

describe('multer fileFilter whitelist', () => {
	test('allows common image and pdf mimetypes', () => {
		expect(ALLOWED_MIMES).toEqual(expect.arrayContaining(['image/jpeg', 'image/png', 'application/pdf']));
	});

	test('rejects an unsafe mimetype', () => {
		expect(ALLOWED_MIMES.includes('application/x-msdownload')).toBe(false);
	});
});

// Small helpers to normalize and pick the first non-empty email value
function normalizeEmail(value) {
  if (!value && value !== 0) return null;
  try {
    const s = String(value).trim();
    return s.length > 0 ? s : null;
  } catch (e) {
    return null;
  }
}

function pickEmail(...candidates) {
  for (const c of candidates) {
    const e = normalizeEmail(c);
    if (e) return e;
  }
  return null;
}

module.exports = { normalizeEmail, pickEmail };

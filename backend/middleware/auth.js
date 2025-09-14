// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const PROD = process.env.NODE_ENV === 'production';

// Lấy token từ Header Authorization: Bearer <token> hoặc cookie
function extractToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();

  // Tự parse cookie (không phụ thuộc cookie-parser)
  const raw = req.headers.cookie || '';
  for (const p of raw.split(';')) {
    const [k, v] = p.trim().split('=');
    if (k === 'access_token' && v) return decodeURIComponent(v);
  }
  return null;
}

function authenticate(req, _res, next) {
  const token = extractToken(req);
  if (!token) { req.user = null; return next(); }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function issueToken(res, payload, opts = {}) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', ...opts });
  // set cookie httpOnly
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: PROD,            // true khi chạy Render/HTTPS
    sameSite: PROD ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return token;
}

function clearToken(res) {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: PROD,
    sameSite: PROD ? 'none' : 'lax',
    path: '/',
  });
}

module.exports = { authenticate, requireAuth, issueToken, clearToken };

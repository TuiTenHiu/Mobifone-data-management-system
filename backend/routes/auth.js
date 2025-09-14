// backend/routes/auth.js
const express = require('express');
const db = require('../db');
const { issueToken, clearToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * body: { email, password }
 * Dùng pgcrypto để verify:
 *   password_hash = crypt($password, password_hash)
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  try {
    const sql = `
      SELECT id, email, role
      FROM users
      WHERE email = $1
        AND password_hash = crypt($2, password_hash)
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [email, password]);
    const user = rows?.[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    issueToken(res, { id: user.id, email: user.email, role: user.role });
    res.json({ user });
  } catch (e) {
    console.error('POST /api/auth/login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (_req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

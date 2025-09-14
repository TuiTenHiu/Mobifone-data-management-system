// backend/index.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('./db'); // db.js (Postgres): export query(sql, params) -> [rows]

const app = express();

// --- CORS (cho cookie cross-site) ---
const isProd = process.env.NODE_ENV === 'production';
const allowlist = [
  'http://localhost:5173',
  process.env.FRONTEND_ORIGIN || '', // ví dụ: https://your-frontend.onrender.com
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Cho phép cả requests không có Origin (curl, health checks)
    if (!origin) return cb(null, true);
    return cb(null, allowlist.includes(origin));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// --- Cookie & JWT helpers ---
const cookieOpts = {
  httpOnly: true,
  secure: isProd,                // cần HTTPS khi prod
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  maxAge: 60 * 60 * 1000,        // 1h
};
const JWT_SECRET = process.env.JWT_SECRET || 'dev_only_secret_change_me';
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies?.access_token || (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!token) return res.status(401).json({ error: 'Unauthenticated' });
    req.user = verifyToken(token); // { uid, email, role, iat, exp }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// -------- Health checks (không cần auth) --------
console.log('[BOOT] CWD =', process.cwd());
console.log('[BOOT] ENV (safe) =', {
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
  DB_POOL_SIZE: process.env.DB_POOL_SIZE || 'default',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '(none)',
  NODE_ENV: process.env.NODE_ENV || '(unset)',
});

app.get('/', (_req, res) => res.send('Backend API is running (Postgres/Neon)'));
app.get('/api/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/readyz', async (_req, res) => {
  try {
    await db.query('select 1');
    res.json({ db: true });
  } catch (e) {
    res.status(503).json({ db: false, error: e.code || e.message });
  }
});

// ===================== AUTH =====================

// Đăng nhập: xác thực bằng pgcrypto (bcrypt) ngay trong SQL
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing email/password' });

    // Chỉ trả id,email,role nếu đúng mật khẩu
    const [rows] = await db.query(
      'SELECT id, email, role FROM users WHERE email = ? AND password_hash = crypt(?, password_hash)',
      [email, password]
    );
    const user = rows?.[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ uid: user.id, email: user.email, role: user.role });
    res.cookie('access_token', token, cookieOpts);
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy thông tin phiên đăng nhập (nếu có)
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.cookies?.access_token || (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!token) return res.json({ user: null });
    const payload = verifyToken(token);
    res.json({ user: { id: payload.uid, email: payload.email, role: payload.role } });
  } catch (_e) {
    res.json({ user: null });
  }
});

// Đăng xuất: xoá cookie
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('access_token', { ...cookieOpts, maxAge: 0 });
  res.json({ ok: true });
});

// ============== API DỮ LIỆU (đã bảo vệ) ==============

// ===== /api/subscribers (filters + pagination) =====
app.get('/api/subscribers', requireAuth, async (req, res) => {
  try {
    // pagination
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 1000);
    const offset = (page - 1) * pageSize;

    // filters
    const {
      type,
      staType,
      subType,
      province,
      district,
      startDate,
      endDate,
      search,
    } = req.query;

    const where = [];
    const params = [];

    if (type)     { where.push('s.type = ?');      params.push(type); }
    if (staType)  { where.push('s.sta_type = ?');  params.push(staType); }
    if (subType)  { where.push('s.sub_type = ?');  params.push(subType); }
    if (province) { where.push('s.province = ?');  params.push(province); }
    if (district) { where.push('s.district = ?');  params.push(district); }

    if (startDate){ where.push('s.sta_date >= ?'); params.push(startDate); }
    if (endDate)  { where.push("s.sta_date < (?::date + INTERVAL '1 day')"); params.push(endDate); }

    if (search) {
      where.push('(s.sub_id ILIKE ? OR s.pck_code ILIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // count
    const countSql = `SELECT COUNT(*)::int AS total FROM subscribers s ${whereSQL}`;
    const [countRows] = await db.query(countSql, params);
    const total = Number(countRows?.[0]?.total || 0);

    // data
    const dataSql = `
      SELECT 
        s.sub_id     AS "SUB_ID",
        s.type       AS "TYPE",
        s.sta_type   AS "STA_TYPE",
        s.sub_type   AS "SUB_TYPE",
        s.sta_date   AS "STA_DATE",
        s.end_date   AS "END_DATE",
        s.province   AS "PROVINCE",
        s.district   AS "DISTRICT",
        s.pck_code   AS "PCK_CODE",
        s.pck_date   AS "PCK_DATE",
        s.pck_charge AS "PCK_CHARGE",
        st.name      AS "sta_type_name",
        su.name      AS "sub_type_name",
        d.full_name  AS "district_name"
      FROM subscribers s
      LEFT JOIN sta_type st ON s.sta_type = st.sta_type
      LEFT JOIN sub_type su ON s.sub_type = su.sub_type
      LEFT JOIN district  d ON s.province = d.province AND s.district = d.district
      ${whereSQL}
      ORDER BY s.sub_id
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataSql, [...params, pageSize, offset]);

    res.json({
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: offset + rows.length < total,
      data: rows,
    });
  } catch (err) {
    console.error('Error in /api/subscribers:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== /api/provinces =====
app.get('/api/provinces', requireAuth, async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT province FROM district ORDER BY province');
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/provinces:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== /api/districts?province=... =====
app.get('/api/districts', requireAuth, async (req, res) => {
  const { province } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT district, full_name FROM district WHERE province = ? ORDER BY district',
      [province]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/districts:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== /api/kpi =====
app.get('/api/kpi', requireAuth, async (_req, res) => {
  try {
    const first = (r, key) => Number((r?.[0]?.[key]) ?? 0);

    const [t]  = await db.query('SELECT COUNT(*)::int AS total FROM subscribers');
    const [a]  = await db.query(`
      SELECT COUNT(*)::int AS active
      FROM subscribers
      WHERE COALESCE(end_date, DATE '9999-12-31') > CURRENT_DATE
    `);
    const [rv] = await db.query(`
      SELECT COALESCE(SUM(pck_charge), 0)::numeric AS revenue
      FROM subscribers
    `);
    const [cm] = await db.query(`
      SELECT COUNT(*)::int AS n
      FROM subscribers
      WHERE date_trunc('month', sta_date) = date_trunc('month', CURRENT_DATE)
    `);
    const [lm] = await db.query(`
      SELECT COUNT(*)::int AS n
      FROM subscribers
      WHERE date_trunc('month', sta_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
    `);

    const totalSubscribers = first(t, 'total');
    const activeSubscribers = first(a, 'active');
    const totalRevenue = Number(rv?.[0]?.revenue ?? 0);
    const currentMonth = first(cm, 'n');
    const lastMonth = first(lm, 'n');
    const denom = Math.max(1, lastMonth);
    const growthRate = Number((((currentMonth - lastMonth) / denom) * 100).toFixed(1));

    res.json({ totalSubscribers, activeSubscribers, totalRevenue, growthRate });
  } catch (err) {
    console.error('Error in /api/kpi:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== /api/summary/by-district =====
app.get('/api/summary/by-district', requireAuth, async (req, res) => {
  try {
    const { province } = req.query;
    const params = [];
    const where = [];

    if (province) {
      where.push('s.province = ?');
      params.push(province);
    }
    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT
        s.province,
        s.district,
        COALESCE(d.full_name, s.district) AS district_name,
        COUNT(*)::int AS total,
        SUM( CASE WHEN COALESCE(s.end_date, DATE '9999-12-31') > CURRENT_DATE THEN 1 ELSE 0 END )::int AS active
      FROM subscribers s
      LEFT JOIN district d ON d.province = s.province AND d.district = s.district
      ${whereSQL}
      GROUP BY 1,2,3
      ORDER BY total DESC, s.district
    `;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('Error in /api/summary/by-district:', e);
    res.status(500).json({ error: e.message });
  }
});

// -------- Start server --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});

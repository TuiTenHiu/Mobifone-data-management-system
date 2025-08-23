// index.js
'use strict';

const express = require('express');
const cors = require('cors');

// ===== Boot logs (an toàn, không in mật khẩu) =====
console.log('[BOOT] CWD =', process.cwd());
console.log('[BOOT] ENV (safe) =', {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
});

/**
 * Tìm & nạp module DB (db.js) ở nhiều vị trí ứng viên.
 * Hỗ trợ cả hai kiểu chạy:
 *  - Root Directory = backend  -> require('./db')
 *  - Start từ repo root       -> require('./backend/db')
 */
function loadDb() {
  const candidates = ['./db', './backend/db', '../backend/db', '../db'];
  for (const p of candidates) {
    try {
      const mod = require(p);
      console.log('[BOOT] DB module path =', require.resolve(p));
      return mod;
    } catch (err) {
      if (err?.code !== 'MODULE_NOT_FOUND') throw err;
    }
  }
  throw new Error(`Không tìm thấy db.js. Đã thử: ${candidates.join(', ')}`);
}

const db = loadDb();

// ===== App =====
const app = express();
app.use(cors());
app.use(express.json());

// (tùy chọn) timeout nhẹ để tránh requests treo lâu
app.use((req, res, next) => {
  req.setTimeout(30_000); // 30s
  res.setTimeout(30_000);
  next();
});

console.log('Đã khởi động file index.js');

// ===== Health & test =====
app.get('/', (_req, res) => {
  res.send('Backend API is running on Render!');
});

// Liveness
app.get('/api/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness (có kiểm tra DB)
app.get('/api/readyz', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (e) {
    res.status(503).json({ status: 'db_down', error: e.code || e.message });
  }
});

// Debug DB (xong có thể xoá)
app.get('/_debug/db', async (_req, res) => {
  try {
    const [r] = await db.query('SELECT 1 AS ok');
    res.json({ ok: r?.[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ err: { code: e.code, errno: e.errno, message: e.message } });
  }
});

// ===== APIs =====

// Danh sách thuê bao (có phân trang nhẹ)
app.get('/api/subscribers', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '100', 10), 1), 1000); // 1..1000
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const [rows] = await db.query(
      `
      SELECT 
        s.sub_id     AS SUB_ID,
        s.type       AS TYPE,
        s.sta_type   AS STA_TYPE,
        s.sub_type   AS SUB_TYPE,
        s.sta_date   AS STA_DATE,
        s.end_date   AS END_DATE,
        s.province   AS PROVINCE,
        s.district   AS DISTRICT,
        s.pck_code   AS PCK_CODE,
        s.pck_date   AS PCK_DATE,
        s.pck_charge AS PCK_CHARGE,
        st.name      AS sta_type_name, 
        su.name      AS sub_type_name, 
        d.full_name  AS district_name
      FROM subscribers s
      LEFT JOIN sta_type  st ON s.sta_type = st.sta_type
      LEFT JOIN sub_type  su ON s.sub_type = su.sub_type
      LEFT JOIN district   d ON s.province = d.province AND s.district = d.district
      ORDER BY s.sub_id
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    res.json({ limit, offset, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error in /api/subscribers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Danh sách tỉnh
app.get('/api/provinces', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT province FROM district ORDER BY province');
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/provinces:', err);
    res.status(500).json({ error: err.message });
  }
});

// Danh sách quận/huyện theo tỉnh
app.get('/api/districts', async (req, res) => {
  const { province } = req.query;
  if (!province) return res.status(400).json({ error: 'Missing query param: province' });
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

// KPI
app.get('/api/kpi', async (_req, res) => {
  try {
    // Tổng TB
    const [totalResult] = await db.query('SELECT COUNT(*) AS total FROM subscribers');
    const totalSubscribers = Number(totalResult?.[0]?.total || 0);

    // TB đang hoạt động
    const [activeResult] = await db.query(`
      SELECT COUNT(*) AS active 
      FROM subscribers s
      LEFT JOIN sta_type st ON s.sta_type = st.sta_type 
      WHERE st.name LIKE '%hoạt động%' 
         OR st.name LIKE '%active%' 
         OR s.sta_type IN ('ACTIVE', '4UFF', 'CFKK')
    `);
    const activeSubscribers = Number(activeResult?.[0]?.active || 0);

    // Doanh thu
    const [revenueResult] = await db.query(`
      SELECT SUM(pck_charge) AS revenue 
      FROM subscribers 
      WHERE pck_charge IS NOT NULL
    `);
    const totalRevenue = Number(revenueResult?.[0]?.revenue || 0);

    // Thuê bao mới tháng này
    const [currentMonthResult] = await db.query(`
      SELECT COUNT(*) AS current_month 
      FROM subscribers 
      WHERE DATE_FORMAT(sta_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);
    const currentMonth = Number(currentMonthResult?.[0]?.current_month || 0);

    // Thuê bao mới tháng trước
    const [lastMonthResult] = await db.query(`
      SELECT COUNT(*) AS last_month 
      FROM subscribers 
      WHERE DATE_FORMAT(sta_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')
    `);
    const lastMonth = Number(lastMonthResult?.[0]?.last_month || 1); // tránh chia 0

    const growthRate = Number((((currentMonth - lastMonth) / lastMonth) * 100).toFixed(1));

    res.json({
      totalSubscribers,
      activeSubscribers,
      totalRevenue,
      growthRate,
    });
  } catch (err) {
    console.error('Error in /api/kpi:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== 404 & Error handler =====
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  console.error('[UNCAUGHT ERROR]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ===== Listen =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
// index.js (entrypoint ở root)
const express = require('express');
const cors = require('cors');

// 👉 nếu bạn để db.js ở chỗ khác, đổi đường dẫn dưới đây cho khớp
console.log('[BOOT] CWD =', process.cwd());
console.log('[BOOT] DB module path =', require.resolve('./backend/db'));
console.log('[BOOT] ENV safe =', {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
});

const db = require('./backend/db');

const app = express();
app.use(cors());
app.use(express.json());

console.log('Đã khởi động file index.js');

// Route test
app.get('/', (_req, res) => {
  res.send('Backend API is running on Render!');
});

// Debug DB (có thể bỏ đi sau khi xong)
app.get('/_debug/db', async (_req, res) => {
  try {
    const [r] = await db.query('SELECT 1 AS ok');
    res.json({ ok: r[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ err: { code: e.code, errno: e.errno, message: e.message } });
  }
});

// Lấy danh sách thuê bao
app.get('/api/subscribers', async (_req, res) => {
  try {
    const [rows] = await db.query(`
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
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/subscribers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách tỉnh
app.get('/api/provinces', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT province FROM district');
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/provinces:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách quận/huyện theo tỉnh
app.get('/api/districts', async (req, res) => {
  const { province } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT district, full_name FROM district WHERE province = ?',
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
    const [totalResult] = await db.query('SELECT COUNT(*) AS total FROM subscribers');
    const totalSubscribers = totalResult[0]?.total || 0;

    const [activeResult] = await db.query(`
      SELECT COUNT(*) AS active 
      FROM subscribers s
      LEFT JOIN sta_type st ON s.sta_type = st.sta_type 
      WHERE st.name LIKE '%hoạt động%' 
         OR st.name LIKE '%active%' 
         OR s.sta_type IN ('ACTIVE', '4UFF', 'CFKK')
    `);
    const activeSubscribers = activeResult[0]?.active || 0;

    const [revenueResult] = await db.query(
      'SELECT SUM(pck_charge) AS revenue FROM subscribers WHERE pck_charge IS NOT NULL'
    );
    const totalRevenue = Number(revenueResult[0]?.revenue || 0);

    const [currentMonthResult] = await db.query(`
      SELECT COUNT(*) AS current_month 
      FROM subscribers 
      WHERE DATE_FORMAT(sta_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);
    const currentMonth = currentMonthResult[0]?.current_month || 0;

    const [lastMonthResult] = await db.query(`
      SELECT COUNT(*) AS last_month 
      FROM subscribers 
      WHERE DATE_FORMAT(sta_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')
    `);
    const lastMonth = lastMonthResult[0]?.last_month || 1; // tránh chia 0

    const growthRate = Number((((currentMonth - lastMonth) / lastMonth) * 100).toFixed(1));

    res.json({
      totalSubscribers: Number(totalSubscribers),
      activeSubscribers: Number(activeSubscribers),
      totalRevenue,
      growthRate
    });
  } catch (err) {
    console.error('Error in /api/kpi:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});

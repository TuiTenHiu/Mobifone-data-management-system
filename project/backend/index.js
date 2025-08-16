const express = require('express');
const cors = require('cors');
const db = require('./db'); // file db.js phải có connection pool dùng mysql2/promise

const app = express();
app.use(cors());
app.use(express.json());

console.log('Đã khởi động file index.js');

// ✅ Route test
app.get('/', (req, res) => {
  res.send('Backend API is running on Render!');
});

// ✅ Lấy danh sách thuê bao
app.get('/api/subscribers', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.sub_id AS SUB_ID,
        s.type AS TYPE,
        s.sta_type AS STA_TYPE,
        s.sub_type AS SUB_TYPE,
        s.sta_date AS STA_DATE,
        s.end_date AS END_DATE,
        s.province AS PROVINCE,
        s.district AS DISTRICT,
        s.pck_code AS PCK_CODE,
        s.pck_date AS PCK_DATE,
        s.pck_charge AS PCK_CHARGE,
        st.name AS sta_type_name, 
        su.name AS sub_type_name, 
        d.full_name AS district_name
      FROM subscribers s
      LEFT JOIN sta_type st ON s.sta_type = st.sta_type
      LEFT JOIN sub_type su ON s.sub_type = su.sub_type
      LEFT JOIN district d ON s.province = d.province AND s.district = d.district
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/subscribers:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Lấy danh sách tỉnh/thành
app.get('/api/provinces', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT province FROM district');
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/provinces:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Lấy danh sách quận/huyện theo tỉnh
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

// ✅ API KPI
app.get('/api/kpi', async (req, res) => {
  try {
    // Tổng số thuê bao
    const [totalResult] = await db.query(
      'SELECT COUNT(*) as total FROM subscribers'
    );
    const totalSubscribers = totalResult[0].total;

    // Thuê bao đang hoạt động
    const [activeResult] = await db.query(`
      SELECT COUNT(*) as active 
      FROM subscribers s
      LEFT JOIN sta_type st ON s.sta_type = st.sta_type 
      WHERE st.name LIKE '%hoạt động%' 
         OR st.name LIKE '%active%' 
         OR s.sta_type IN ('ACTIVE', '4UFF', 'CFKK')
    `);
    const activeSubscribers = activeResult[0].active;

    // Tổng doanh thu
    const [revenueResult] = await db.query(
      'SELECT SUM(pck_charge) as revenue FROM subscribers WHERE pck_charge IS NOT NULL'
    );
    const totalRevenue = revenueResult[0].revenue || 0;

    // Thuê bao mới tháng này
    const [currentMonthResult] = await db.query(`
      SELECT COUNT(*) as current_month 
      FROM subscribers 
      WHERE DATE_FORMAT(sta_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);

    // Thuê bao mới tháng trước
    const [lastMonthResult] = await db.query(`
      SELECT COUNT(*) as last_month 
      FROM subscribers 
      WHERE DATE_FORMAT(sta_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')
    `);

    const currentMonth = currentMonthResult[0].current_month || 0;
    const lastMonth = lastMonthResult[0].last_month || 1; // tránh chia 0
    const growthRate = ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1);

    res.json({
      totalSubscribers: parseInt(totalSubscribers),
      activeSubscribers: parseInt(activeSubscribers),
      totalRevenue: parseFloat(totalRevenue),
      growthRate: parseFloat(growthRate)
    });
  } catch (err) {
    console.error('Error in /api/kpi:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server (Render yêu cầu PORT từ env)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});

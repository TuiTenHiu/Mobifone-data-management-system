const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

console.log('Đã khởi động file index.js');
// Lấy danh sách thuê bao
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
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách tỉnh/thành
app.get('/api/provinces', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT province FROM district');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách quận/huyện theo tỉnh
app.get('/api/districts', async (req, res) => {
  const { province } = req.query;
  try {
    const [rows] = await db.query('SELECT district, full_name FROM district WHERE province = ?', [province]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API lấy KPI thực tế
app.get('/api/kpi', async (req, res) => {
  try {
    // Tổng số thuê bao
    const [totalResult] = await db.query('SELECT COUNT(*) as total FROM subscribers');
    const totalSubscribers = totalResult[0].total;

    // Số thuê bao hoạt động (giả sử có trạng thái ACTIVE hoặc tương tự)
    const [activeResult] = await db.query(`
      SELECT COUNT(*) as active 
      FROM subscribers s
      LEFT JOIN sta_type st ON s.sta_type = st.sta_type 
      WHERE st.name LIKE '%hoạt động%' OR st.name LIKE '%active%' OR s.sta_type IN ('ACTIVE', '4UFF', 'CFKK')
    `);
    const activeSubscribers = activeResult[0].active;

    // Tổng doanh thu
    const [revenueResult] = await db.query('SELECT SUM(pck_charge) as revenue FROM subscribers WHERE pck_charge IS NOT NULL');
    const totalRevenue = revenueResult[0].revenue || 0;

    // Tính tỷ lệ tăng trưởng (so sánh với tháng trước)
    const [currentMonthResult] = await db.query(`
      SELECT COUNT(*) as current_month 
      FROM subscribers 
      WHERE DATE_FORMAT(sta_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);
    const [lastMonthResult] = await db.query(`
      SELECT COUNT(*) as last_month 
      FROM subscribers 
      WHERE DATE_FORMAT(sta_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')
    `);
    
    const currentMonth = currentMonthResult[0].current_month || 0;
    const lastMonth = lastMonthResult[0].last_month || 1; // Tránh chia cho 0
    const growthRate = ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1);

    const kpiData = {
      totalSubscribers: parseInt(totalSubscribers),
      activeSubscribers: parseInt(activeSubscribers),
      totalRevenue: parseFloat(totalRevenue),
      growthRate: parseFloat(growthRate)
    };

    res.json(kpiData);
  } catch (err) {
    console.error('KPI API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ...Thêm các API khác nếu cần...

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
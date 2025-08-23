// backend/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,          // maglev.proxy.rlwy.net
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,          // root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,      // railway
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: { rejectUnauthorized: false }, // Railway public endpoint
  // ❌ lookup: ...  -> bỏ đi
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('Kết nối database thất bại:', err.message);
  } else {
    console.log('Kết nối DB thành công!');
    conn.release();
  }
});

module.exports = pool.promise();

// backend/db.js
const mysql = require('mysql2/promise');

const cfg = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10_000),
};

// BẬT TLS khi DB_SSL=true (Railway external proxy cần TLS)
const wantSSL = String(process.env.DB_SSL || '').toLowerCase();
if (wantSSL === 'true' || wantSSL === 'require') {
  // Bắt đầu với rejectUnauthorized:false để qua bắt tay (nếu cert không nằm trong CA hệ thống).
  // Khi chạy ổn rồi có thể nâng lên true.
  cfg.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: false };
}
console.log('[DB] SSL enabled =', !!cfg.ssl);

const pool = mysql.createPool(cfg);

// Ping sớm để log lỗi chi tiết
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] initial query OK');
  } catch (err) {
    console.error('[DB] initial connect failed:', {
      code: err.code, errno: err.errno, sqlState: err.sqlState, fatal: err.fatal, message: err.message
    });
  }
})();

module.exports = pool;

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

// Bật TLS khi dùng Railway external proxy (maglev/monorail.proxy.rlwy.net)
if (String(process.env.DB_SSL).toLowerCase() === 'true' || String(process.env.DB_SSL).toLowerCase() === 'require') {
  cfg.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  // Nếu vẫn lỗi chứng chỉ, thử tạm thời:
  // cfg.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: false };
}

const pool = mysql.createPool(cfg);

// Ping sớm để thấy lỗi rõ ràng
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

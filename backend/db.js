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
  // bắt tay dễ hơn; sau khi chạy ổn có thể nâng về true
  cfg.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: false };
}
console.log('[DB] SSL enabled =', !!cfg.ssl);

// >>> THÊM LOG NÀY <<<
console.log('[DB] cfg preview =', {
  host: cfg.host,
  port: cfg.port,
  user: cfg.user,
  db: cfg.database,
  ssl: !!cfg.ssl,
  hasPassword: !!cfg.password
});

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

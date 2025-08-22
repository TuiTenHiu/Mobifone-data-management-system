// backend/db.js
const mysql = require('mysql2/promise'); // dùng phiên bản promise

// Ưu tiên đọc DATABASE_URL nếu bạn dùng dạng URL,
// còn không thì dùng các biến rời DB_HOST/PORT/USER/PASSWORD/NAME
function getConfigFromEnv() {
  const { DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (DATABASE_URL) {
    const url = new URL(DATABASE_URL); // ví dụ: mysql://user:pass@host:port/db
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
    };
  }

  return {
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 3306,
    user: DB_USER || 'root',
    password: DB_PASSWORD || '',
    database: DB_NAME || 'dashboard_db',
  };
}

const pool = mysql.createPool({
  ...getConfigFromEnv(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Một số host cần mở khóa public key:
  // enable bằng cách set DB_ALLOW_PUBLIC_KEY=true nếu cần
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
  ...(process.env.DB_ALLOW_PUBLIC_KEY === 'true' ? { insecureAuth: true, authPlugins: { mysql_clear_password: () => () => process.env.DB_PASSWORD } } : {}),
});

// Kiểm tra kết nối khi khởi động
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Kết nối database thành công!');
    conn.release();
  } catch (err) {
    console.error('Kết nối database thất bại:', err.message);
  }
})();

module.exports = pool;

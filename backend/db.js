// backend/db.js
const mysql = require('mysql2');
const dns = require('dns');

// Cảnh báo nếu thiếu ENV
for (const k of ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
  if (!process.env[k]) console.warn('ENV MISSING:', k);
}

const dbConfig = {
  host: process.env.DB_HOST,                 // ví dụ: maglev.proxy.rlwy.net
  port: Number(process.env.DB_PORT || 3306), // ví dụ: 38827
  user: process.env.DB_USER,                 // ví dụ: root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,             // ví dụ: railway
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,

  // Railway public endpoint thường yêu cầu TLS
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },

  // Ép dùng IPv4 để tránh DNS trả IPv6 bị từ chối
  lookup: (hostname, _opts, cb) =>
    dns.lookup(hostname, { family: 4, all: false }, cb),
};

console.log('DB config (safe):', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
});

const pool = mysql.createPool(dbConfig);

// Ping khi khởi động để log lỗi CHI TIẾT
pool.getConnection((err, conn) => {
  if (err) {
    console.error('Kết nối DB thất bại:', {
      code: err.code,
      errno: err.errno,
      address: err.address,
      port: err.port,
      fatal: err.fatal,
      message: err.message,
      stack: err.stack,
    });
  } else {
    console.log('Kết nối DB thành công!');
    conn.release();
  }
});

module.exports = pool.promise();

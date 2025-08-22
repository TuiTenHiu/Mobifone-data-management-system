// db.js
const mysql = require('mysql2');
const dns = require('dns');

// Báo nếu thiếu ENV
for (const k of ['DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME']) {
  if (!process.env[k]) console.warn('ENV MISSING:', k);
}

const dbConfig = {
  host: process.env.DB_HOST,                 // maglev.proxy.rlwy.net
  port: Number(process.env.DB_PORT || 3306), // 38827
  user: process.env.DB_USER,                 // root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,             // railway
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  // BẮT BUỘC với Railway public endpoint
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
  // Ép dùng IPv4 (tránh case DNS trả IPv6)
  lookup: (hostname, _opts, cb) => dns.lookup(hostname, { family: 4, all: false }, cb),
};

console.log('DB config (safe):', {
  host: dbConfig.host, port: dbConfig.port, user: dbConfig.user, database: dbConfig.database
});

const pool = mysql.createPool(dbConfig);

// Ping khi khởi động để có LỖI CHI TIẾT
pool.getConnection((err, conn) => {
  if (err) {
    console.error('Kết nối DB thất bại:', {
      code: err.code, errno: err.errno, address: err.address, port: err.port,
      fatal: err.fatal, message: err.message, stack: err.stack
    });
  } else {
    console.log('Kết nối DB thành công!');
    conn.release();
  }
});

module.exports = pool.promise();

// db.js
const mysql = require('mysql2');
const dns = require('dns');

const must = ['DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME'];
for (const k of must) if (!process.env[k]) console.warn('ENV MISSING:', k);

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
  // BẮT BUỘC với Railway public
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
  // ÉP dùng IPv4 kể cả khi DNS trả về IPv6
  lookup: (hostname, options, cb) => dns.lookup(hostname, { family: 4, all: false }, cb),
};

console.log('DB config (safe):', {
  host: dbConfig.host, port: dbConfig.port,
  user: dbConfig.user, database: dbConfig.database
});

const pool = mysql.createPool(dbConfig);

// Ping kết nối khi khởi động
pool.getConnection((err, conn) => {
  if (err) {
    console.error('Kết nối DB thất bại:', {
      code: err.code, errno: err.errno, address: err.address, port: err.port,
      fatal: err.fatal, message: err.message
    });
  } else {
    console.log('Kết nối DB thành công!');
    conn.release();
  }
});

module.exports = pool.promise();

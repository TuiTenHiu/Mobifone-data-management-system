const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false } // Railway public endpoint thường yêu cầu SSL
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Kết nối database thất bại:', err.message);
  } else {
    console.log('Kết nối database thành công!');
    connection.release();
  }
});

module.exports = pool.promise();

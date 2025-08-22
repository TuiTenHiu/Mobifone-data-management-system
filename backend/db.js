const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,      // mysql.railway.internal
  user: process.env.DB_USER,      // root
  password: process.env.DB_PASSWORD,  // password Railway
  database: process.env.DB_NAME,  // railway
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Kết nối database thất bại:', err.message);
  } else {
    console.log('Kết nối database thành công!');
    connection.release();
  }
});

module.exports = pool.promise();

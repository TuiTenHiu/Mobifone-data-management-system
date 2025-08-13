const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123123123',
  database: 'dashboard_db',
  port: 3307, // Thêm dòng này!
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối khi khởi động
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Kết nối database thất bại:', err.message);
  } else {
    console.log('Kết nối database thành công!');
    connection.release();
  }
});

module.exports = pool.promise();
// backend/db.js (Postgres via DATABASE_URL)
const { Pool } = require('pg');

// Đổi ? -> $1, $2... để tái dùng các query cũ
function toPg(sql){ let i=0; return sql.replace(/\?/g, ()=>`$${++i}`); }

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_SIZE || 10),
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  ssl: { rejectUnauthorized: false } // Neon yêu cầu SSL
});

async function query(sql, params=[]){
  const res = await pool.query(toPg(sql), params);
  return [res.rows];
}

(async () => {
  try { await pool.query('select 1'); console.log('[DB] initial query OK (Postgres)'); }
  catch (e) { console.error('[DB] initial connect failed (Postgres):', { code: e.code, message: e.message }); }
})();
module.exports = { query };

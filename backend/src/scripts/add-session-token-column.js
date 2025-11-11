const pool = require('../config/database');

async function addSessionTokenColumn() {
  try {
    // Kolonun var olup olmadığını kontrol et
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'session_token'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ session_token kolonu zaten mevcut');
      process.exit(0);
    }

    // Kolonu ekle
    await pool.query(`
      ALTER TABLE users ADD COLUMN session_token VARCHAR(255) NULL
    `);

    // Index ekle
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_session_token 
      ON users(session_token) 
      WHERE session_token IS NOT NULL
    `);

    console.log('✅ session_token kolonu başarıyla eklendi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

addSessionTokenColumn();


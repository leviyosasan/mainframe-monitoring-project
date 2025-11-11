const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function updatePasswords() {
  try {
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);

    console.log(`\n🔐 Şifre hash'i oluşturuldu: ${password}`);
    console.log(`📝 Hash: ${hash}\n`);

    // Tüm kullanıcıların şifrelerini güncelle
    const result = await pool.query(
      `UPDATE users SET password = $1 WHERE email IN ('admin@mainview.com', 'user@mainview.com') RETURNING email`,
      [hash]
    );

    console.log(`✅ ${result.rows.length} kullanıcının şifresi güncellendi:\n`);
    result.rows.forEach(user => {
      console.log(`   - ${user.email}`);
    });

    console.log(`\n🎉 Şifre güncelleme tamamlandı!`);
    console.log(`\nTest bilgileri:`);
    console.log(`   Email: user@mainview.com`);
    console.log(`   Şifre: ${password}`);
    console.log(`\n   Email: admin@mainview.com`);
    console.log(`   Şifre: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

updatePasswords();


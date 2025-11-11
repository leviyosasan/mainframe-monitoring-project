const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function testPassword() {
  try {
    const email = 'user@mainview.com';
    const testPassword = '123456';

    const result = await pool.query(
      'SELECT id, email, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Kullanıcı bulunamadı: ${email}`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`\n🔍 Kullanıcı: ${user.email}`);
    console.log(`📝 Hash: ${user.password.substring(0, 30)}...`);

    // Şifre kontrolü
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log(`✅ Şifre doğru! (${testPassword})`);
    } else {
      console.log(`❌ Şifre yanlış! (${testPassword})`);
      console.log(`\n💡 Yeni hash oluşturuluyor...`);
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(`\nYeni hash: ${newHash}`);
      console.log(`\nSQL güncelleme komutu:`);
      console.log(`UPDATE users SET password = '${newHash}' WHERE email = '${email}';`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

testPassword();


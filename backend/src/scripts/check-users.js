const pool = require('../config/database');

async function checkUsers() {
  try {
    // Users tablosunu kontrol et
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users tablosu bulunamadı!');
      console.log('Lütfen create_users_table.sql dosyasını çalıştırın.');
      process.exit(1);
    }

    console.log('✅ Users tablosu mevcut');

    // Kullanıcıları listele
    const users = await pool.query('SELECT id, email, first_name, last_name, role FROM users');
    
    console.log(`\n📊 Toplam ${users.rows.length} kullanıcı bulundu:\n`);
    
    if (users.rows.length === 0) {
      console.log('⚠️  Hiç kullanıcı yok!');
      console.log('Test kullanıcıları eklemek için create_users_table.sql dosyasını çalıştırın.');
    } else {
      users.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.first_name} ${user.last_name}) - Role: ${user.role}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

checkUsers();


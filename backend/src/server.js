require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Server'ı başlat
const server = app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Database pool'u import et
const pool = require('./config/database');

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`${signal} sinyali alındı. Sunucu kapatılıyor...`);
  
  // Yeni bağlantıları kabul etme
  server.close(async () => {
    console.log('HTTP sunucusu kapatıldı.');
    
    try {
      // Database pool'u kapat
      await pool.end();
      console.log('Database pool kapatıldı.');
      process.exit(0);
    } catch (err) {
      console.error('Database pool kapatılırken hata:', err);
      process.exit(1);
    }
  });
  
  // 10 saniye içinde kapanmazsa zorla kapat
  setTimeout(() => {
    console.error('Zorla kapatılıyor...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection - sadece logla, process'i kapatma
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection:', err);
  console.error('Promise:', promise);
  // Process'i kapatmak yerine sadece logla
  // Production'da bir error tracking servisine gönderilebilir
});

// Uncaught exception - kritik hatalar için
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Kritik hatalar için graceful shutdown
  gracefulShutdown('uncaughtException');
});

module.exports = server;


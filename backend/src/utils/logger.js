/**
 * Simple logger utility
 */
class Logger {
  info(message, data = null) {
    console.log(`ℹ️  [INFO] ${new Date().toISOString()} - ${message}`, data || '');
  }

  error(message, error = null) {
    console.error(`❌ [ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  }

  warn(message, data = null) {
    console.warn(`⚠️  [WARN] ${new Date().toISOString()} - ${message}`, data || '');
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 [DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }

  success(message, data = null) {
    console.log(`✅ [SUCCESS] ${new Date().toISOString()} - ${message}`, data || '');
  }
}

module.exports = new Logger();


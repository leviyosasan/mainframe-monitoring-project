const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../config/constants');
const pool = require('../config/database');

/**
 * JWT token doğrulama middleware'i (Session kontrolü ile)
 */
const authenticate = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Yetkilendirme token\'ı gerekli', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    // Kullanıcıyı ve session token'ı kontrol et
    const result = await pool.query(
      'SELECT session_token FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.UNAUTHORIZED);
    }

    const userSessionToken = result.rows[0].session_token;

    // Session token kontrolü - aynı kullanıcı ile birden fazla oturum açılmasını engelle
    // Eğer token'da sessionToken varsa (yeni token), kontrol et
    // Eğer token'da sessionToken yoksa (eski token), session_token NULL olmalı veya eşleşmeli
    if (decoded.sessionToken) {
      // Yeni token formatı - session token eşleşmeli
      if (userSessionToken !== decoded.sessionToken) {
        throw new AppError('Bu hesap başka bir cihazda aktif. Lütfen tekrar giriş yapın.', HTTP_STATUS.UNAUTHORIZED);
      }
    } else {
      // Eski token formatı - eğer kullanıcının session_token'ı varsa, eski token geçersiz
      if (userSessionToken) {
        throw new AppError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.', HTTP_STATUS.UNAUTHORIZED);
      }
    }
    
    // Kullanıcı bilgilerini request'e ekle
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Geçersiz token', HTTP_STATUS.UNAUTHORIZED));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token süresi dolmuş', HTTP_STATUS.UNAUTHORIZED));
    }
    if (error instanceof AppError) {
      return next(error);
    }
    next(error);
  }
};

/**
 * Rol bazlı yetkilendirme middleware'i
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Yetkilendirme gerekli', HTTP_STATUS.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bu işlem için yetkiniz yok', HTTP_STATUS.FORBIDDEN));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};


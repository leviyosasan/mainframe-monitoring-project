const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../config/constants');

/**
 * JWT token doğrulama middleware'i
 */
const authenticate = (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Yetkilendirme token\'ı gerekli', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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


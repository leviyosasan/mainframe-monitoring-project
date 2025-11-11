const { HTTP_STATUS } = require('../config/constants');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Sunucu hatası';
  let errors = err.errors || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validasyon hatası';
    errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Bu değer zaten kullanılıyor';
    const field = Object.keys(err.keyPattern)[0];
    errors = [{ field, message: `${field} zaten mevcut` }];
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Geçersiz ID formatı';
  }

  // PostgreSQL errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    message = 'Veritabanı bağlantısı kurulamadı';
  }

  if (err.code === '23505') { // Unique violation
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Bu kayıt zaten mevcut';
  }

  if (err.code === '23503') { // Foreign key violation
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'İlişkili kayıt bulunamadı';
  }

  if (err.code === '23502') { // Not null violation
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Zorunlu alanlar eksik';
  }

  if (err.code === '42P01') { // Undefined table
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    message = 'Veritabanı tablosu bulunamadı';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Geçersiz token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token süresi dolmuş';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;


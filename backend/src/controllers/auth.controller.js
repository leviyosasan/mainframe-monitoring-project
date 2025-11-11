const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { HTTP_STATUS } = require('../config/constants');

// Session token oluştur
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// JWT token oluştur (session token ile)
const generateTokens = (user, sessionToken) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, sessionToken },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, sessionToken },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Kullanıcı kayıt
exports.register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Validasyon
  if (!email || !password || !firstName || !lastName) {
    throw new AppError('Tüm alanlar gereklidir', HTTP_STATUS.BAD_REQUEST);
  }

  if (password.length < 6) {
    throw new AppError('Şifre en az 6 karakter olmalıdır', HTTP_STATUS.BAD_REQUEST);
  }

  // Email kontrolü
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('Bu email adresi zaten kullanılıyor', HTTP_STATUS.CONFLICT);
  }

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash(password, 10);

  // Kullanıcı oluştur
  const result = await pool.query(
    `INSERT INTO users (email, password, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, first_name, last_name, role, created_at`,
    [email.toLowerCase(), hashedPassword, firstName, lastName, 'user']
  );

  const user = result.rows[0];

  // Session token oluştur ve kaydet
  const sessionToken = generateSessionToken();
  await pool.query(
    'UPDATE users SET session_token = $1 WHERE id = $2',
    [sessionToken, user.id]
  );

  // Token oluştur
  const { accessToken, refreshToken } = generateTokens(user, sessionToken);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});

// Kullanıcı giriş
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validasyon
  if (!email || !password) {
    throw new AppError('Email ve şifre gereklidir', HTTP_STATUS.BAD_REQUEST);
  }

  // Kullanıcıyı bul
  const result = await pool.query(
    'SELECT id, email, password, first_name, last_name, role, session_token FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    console.log(`Login attempt failed: User not found for email: ${email.toLowerCase()}`);
    throw new AppError('Email veya şifre hatalı', HTTP_STATUS.UNAUTHORIZED);
  }

  const user = result.rows[0];

  // Şifre kontrolü
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    console.log(`Login attempt failed: Invalid password for email: ${email.toLowerCase()}`);
    throw new AppError('Email veya şifre hatalı', HTTP_STATUS.UNAUTHORIZED);
  }

  // Eğer kullanıcının aktif bir session'ı varsa, eski session'ı geçersiz kıl
  if (user.session_token) {
    console.log(`Invalidating existing session for user: ${user.email}`);
  }

  // Yeni session token oluştur ve kaydet
  const sessionToken = generateSessionToken();
  await pool.query(
    'UPDATE users SET session_token = $1 WHERE id = $2',
    [sessionToken, user.id]
  );

  // Token oluştur
  const { accessToken, refreshToken } = generateTokens(user, sessionToken);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});

// Token yenileme
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token gereklidir', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'
    );

    // Kullanıcıyı bul
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, session_token FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = result.rows[0];

    // Session token kontrolü
    if (decoded.sessionToken !== user.session_token) {
      throw new AppError('Oturum geçersiz. Lütfen tekrar giriş yapın.', HTTP_STATUS.UNAUTHORIZED);
    }

    // Yeni token'lar oluştur (aynı session token ile)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, user.session_token);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AppError('Geçersiz veya süresi dolmuş token', HTTP_STATUS.UNAUTHORIZED);
    }
    throw error;
  }
});

// Kullanıcı bilgilerini getir
exports.getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(
    'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.NOT_FOUND);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }
    }
  });
});

// Çıkış yap - Session token'ı temizle
exports.logout = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (userId) {
    // Session token'ı temizle
    await pool.query(
      'UPDATE users SET session_token = NULL WHERE id = $1',
      [userId]
    );
  }

  res.json({
    success: true,
    message: 'Çıkış yapıldı'
  });
});


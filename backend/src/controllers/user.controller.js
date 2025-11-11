const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Tüm kullanıcıları getir (Sayfalama ile)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Toplam kullanıcı sayısını al
  const countResult = await pool.query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count);

  // Kullanıcıları getir
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, created_at, 
     CASE WHEN session_token IS NOT NULL THEN true ELSE false END as is_active
     FROM users 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const users = result.rows.map((user) => ({
    _id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: `${user.first_name} ${user.last_name}`,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
  }));

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Kullanıcı detayını getir
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, created_at,
     CASE WHEN session_token IS NOT NULL THEN true ELSE false END as is_active
     FROM users 
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.NOT_FOUND);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        _id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
      },
    },
  });
});

/**
 * Yeni kullanıcı oluştur (Admin only)
 */
exports.createUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role = 'user' } = req.body;

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
    [email.toLowerCase(), hashedPassword, firstName, lastName, role]
  );

  const user = result.rows[0];

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: {
      user: {
        _id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        role: user.role,
        createdAt: user.created_at,
      },
    },
  });
});

/**
 * Kullanıcı güncelle
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, role, password } = req.body;

  // Kullanıcıyı bul
  const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);

  if (userResult.rows.length === 0) {
    throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.NOT_FOUND);
  }

  // Email değiştiriliyorsa kontrol et
  if (email) {
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email.toLowerCase(), id]
    );

    if (emailCheck.rows.length > 0) {
      throw new AppError('Bu email adresi zaten kullanılıyor', HTTP_STATUS.CONFLICT);
    }
  }

  // Şifre değiştiriliyorsa hashle
  if (password) {
    if (password.length < 6) {
      throw new AppError('Şifre en az 6 karakter olmalıdır', HTTP_STATUS.BAD_REQUEST);
    }
  }

  // Güncelleme sorgusu oluştur
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (email) {
    updates.push(`email = $${paramCount++}`);
    values.push(email.toLowerCase());
  }
  if (firstName) {
    updates.push(`first_name = $${paramCount++}`);
    values.push(firstName);
  }
  if (lastName) {
    updates.push(`last_name = $${paramCount++}`);
    values.push(lastName);
  }
  if (role) {
    updates.push(`role = $${paramCount++}`);
    values.push(role);
  }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.push(`password = $${paramCount++}`);
    values.push(hashedPassword);
  }

  if (updates.length === 0) {
    throw new AppError('Güncellenecek alan bulunamadı', HTTP_STATUS.BAD_REQUEST);
  }

  values.push(id);
  const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, role, created_at`;

  const result = await pool.query(updateQuery, values);
  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        _id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        role: user.role,
        createdAt: user.created_at,
      },
    },
  });
});

/**
 * Kullanıcı sil (Admin only)
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Kullanıcıyı bul
  const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);

  if (userResult.rows.length === 0) {
    throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.NOT_FOUND);
  }

  // Kendi hesabını silmeyi engelle
  if (req.user.id === parseInt(id)) {
    throw new AppError('Kendi hesabınızı silemezsiniz', HTTP_STATUS.BAD_REQUEST);
  }

  // Kullanıcıyı sil
  await pool.query('DELETE FROM users WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Kullanıcı başarıyla silindi',
  });
});

/**
 * Şifre değiştir
 */
exports.updatePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  // Validasyon
  if (!oldPassword || !newPassword) {
    throw new AppError('Eski ve yeni şifre gereklidir', HTTP_STATUS.BAD_REQUEST);
  }

  if (newPassword.length < 6) {
    throw new AppError('Yeni şifre en az 6 karakter olmalıdır', HTTP_STATUS.BAD_REQUEST);
  }

  // Kullanıcıyı bul
  const result = await pool.query(
    'SELECT id, password FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.NOT_FOUND);
  }

  const user = result.rows[0];

  // Eski şifre kontrolü (kendi şifresini değiştiriyorsa)
  if (req.user.id === parseInt(id)) {
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Eski şifre hatalı', HTTP_STATUS.UNAUTHORIZED);
    }
  }

  // Yeni şifreyi hashle
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Şifreyi güncelle
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [
    hashedPassword,
    id,
  ]);

  res.json({
    success: true,
    message: 'Şifre başarıyla güncellendi',
  });
});


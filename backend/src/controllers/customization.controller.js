const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const pool = require('../config/database');

// ==================== FOLDER ENDPOINTS ====================

// Kullanıcının tüm klasörlerini getir
exports.getFolders = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT id, name, icon, color, description, created_at, updated_at
     FROM custom_folders
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  res.json({
    success: true,
    folders: result.rows
  });
});

// Yeni klasör oluştur
exports.createFolder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, icon, color, description } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Klasör adı gereklidir', 400);
  }

  const result = await pool.query(
    `INSERT INTO custom_folders (user_id, name, icon, color, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, icon, color, description, created_at, updated_at`,
    [userId, name.trim(), icon || 'folder', color || 'blue', description || null]
  );

  res.status(201).json({
    success: true,
    folder: result.rows[0]
  });
});

// Klasör güncelle
exports.updateFolder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, icon, color, description } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Klasör adı gereklidir', 400);
  }

  // Klasörün kullanıcıya ait olup olmadığını kontrol et
  const checkResult = await pool.query(
    'SELECT id FROM custom_folders WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError('Klasör bulunamadı', 404);
  }

  const result = await pool.query(
    `UPDATE custom_folders
     SET name = $1, icon = $2, color = $3, description = $4
     WHERE id = $5 AND user_id = $6
     RETURNING id, name, icon, color, description, created_at, updated_at`,
    [name.trim(), icon || 'folder', color || 'blue', description || null, id, userId]
  );

  res.json({
    success: true,
    folder: result.rows[0]
  });
});

// Klasör sil
exports.deleteFolder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Klasörün kullanıcıya ait olup olmadığını kontrol et
  const checkResult = await pool.query(
    'SELECT id FROM custom_folders WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError('Klasör bulunamadı', 404);
  }

  // Klasörü sil (CASCADE ile ilişkili dashboard'ların folder_id'si NULL olacak)
  await pool.query(
    'DELETE FROM custom_folders WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  res.json({
    success: true,
    message: 'Klasör silindi'
  });
});

// ==================== DASHBOARD ENDPOINTS ====================

// Kullanıcının tüm dashboard'larını getir
exports.getDashboards = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT id, folder_id, name, table_name, columns, column_aliases, 
            view_type, db_type, connection_id, limit_rows, created_at, updated_at
     FROM custom_dashboards
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  res.json({
    success: true,
    dashboards: result.rows
  });
});

// Tek bir dashboard getir
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await pool.query(
    `SELECT id, folder_id, name, table_name, columns, column_aliases, 
            view_type, db_type, connection_id, limit_rows, created_at, updated_at
     FROM custom_dashboards
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Dashboard bulunamadı', 404);
  }

  res.json({
    success: true,
    dashboard: result.rows[0]
  });
});

// Yeni dashboard oluştur
exports.createDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    tableName,
    columns,
    columnAliases,
    viewType,
    dbType,
    connectionId,
    limit,
    folderId
  } = req.body;

  // Validasyon
  if (!name || !name.trim()) {
    throw new AppError('Dashboard adı gereklidir', 400);
  }
  if (!tableName || !tableName.trim()) {
    throw new AppError('Tablo adı gereklidir', 400);
  }
  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    throw new AppError('En az bir kolon seçilmelidir', 400);
  }

  // Folder kontrolü (eğer folderId varsa)
  if (folderId) {
    const folderCheck = await pool.query(
      'SELECT id FROM custom_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderCheck.rows.length === 0) {
      throw new AppError('Klasör bulunamadı', 404);
    }
  }

  const result = await pool.query(
    `INSERT INTO custom_dashboards 
     (user_id, folder_id, name, table_name, columns, column_aliases, view_type, db_type, connection_id, limit_rows)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, folder_id, name, table_name, columns, column_aliases, 
               view_type, db_type, connection_id, limit_rows, created_at, updated_at`,
    [
      userId,
      folderId || null,
      name.trim(),
      tableName.trim(),
      JSON.stringify(columns),
      JSON.stringify(columnAliases || {}),
      viewType || 'table',
      dbType || 'postgresql',
      connectionId || null,
      limit || 100
    ]
  );

  res.status(201).json({
    success: true,
    dashboard: result.rows[0]
  });
});

// Dashboard güncelle
exports.updateDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const {
    name,
    tableName,
    columns,
    columnAliases,
    viewType,
    dbType,
    connectionId,
    limit,
    folderId
  } = req.body;

  // Dashboard'un kullanıcıya ait olup olmadığını kontrol et
  const checkResult = await pool.query(
    'SELECT id FROM custom_dashboards WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError('Dashboard bulunamadı', 404);
  }

  // Validasyon
  if (!name || !name.trim()) {
    throw new AppError('Dashboard adı gereklidir', 400);
  }
  if (!tableName || !tableName.trim()) {
    throw new AppError('Tablo adı gereklidir', 400);
  }
  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    throw new AppError('En az bir kolon seçilmelidir', 400);
  }

  // Folder kontrolü (eğer folderId varsa)
  if (folderId) {
    const folderCheck = await pool.query(
      'SELECT id FROM custom_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderCheck.rows.length === 0) {
      throw new AppError('Klasör bulunamadı', 404);
    }
  }

  const result = await pool.query(
    `UPDATE custom_dashboards
     SET folder_id = $1, name = $2, table_name = $3, columns = $4, 
         column_aliases = $5, view_type = $6, db_type = $7, 
         connection_id = $8, limit_rows = $9
     WHERE id = $10 AND user_id = $11
     RETURNING id, folder_id, name, table_name, columns, column_aliases, 
               view_type, db_type, connection_id, limit_rows, created_at, updated_at`,
    [
      folderId || null,
      name.trim(),
      tableName.trim(),
      JSON.stringify(columns),
      JSON.stringify(columnAliases || {}),
      viewType || 'table',
      dbType || 'postgresql',
      connectionId || null,
      limit || 100,
      id,
      userId
    ]
  );

  res.json({
    success: true,
    dashboard: result.rows[0]
  });
});

// Dashboard sil
exports.deleteDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Dashboard'un kullanıcıya ait olup olmadığını kontrol et
  const checkResult = await pool.query(
    'SELECT id FROM custom_dashboards WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError('Dashboard bulunamadı', 404);
  }

  await pool.query(
    'DELETE FROM custom_dashboards WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  res.json({
    success: true,
    message: 'Dashboard silindi'
  });
});

// Dashboard'u klasöre taşı
exports.moveDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { folderId } = req.body;

  // Dashboard'un kullanıcıya ait olup olmadığını kontrol et
  const checkResult = await pool.query(
    'SELECT id FROM custom_dashboards WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError('Dashboard bulunamadı', 404);
  }

  // Folder kontrolü (eğer folderId varsa)
  if (folderId) {
    const folderCheck = await pool.query(
      'SELECT id FROM custom_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderCheck.rows.length === 0) {
      throw new AppError('Klasör bulunamadı', 404);
    }
  }

  const result = await pool.query(
    `UPDATE custom_dashboards
     SET folder_id = $1
     WHERE id = $2 AND user_id = $3
     RETURNING id, folder_id, name, table_name, columns, column_aliases, 
               view_type, db_type, connection_id, limit_rows, created_at, updated_at`,
    [folderId || null, id, userId]
  );

  res.json({
    success: true,
    dashboard: result.rows[0]
  });
});


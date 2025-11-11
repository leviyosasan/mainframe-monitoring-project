const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const pool = require('../config/database');
const { HTTP_STATUS } = require('../config/constants');

// Sayfa listesi (frontend route'ları)
const AVAILABLE_PAGES = [
  { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
  { id: 'zos', name: 'z/OS', path: '/zos' },
  { id: 'cics', name: 'CICS', path: '/cics' },
  { id: 'db2', name: 'DB2', path: '/db2' },
  { id: 'ims', name: 'IMS', path: '/ims' },
  { id: 'mq', name: 'MQ', path: '/mq' },
  { id: 'network', name: 'Network', path: '/network' },
  { id: 'storage', name: 'Storage', path: '/storage' },
  { id: 'uss', name: 'USS', path: '/uss' },
  { id: 'rmf', name: 'RMF', path: '/rmf' },
  { id: 'postgresql', name: 'PostgreSQL', path: '/postgresql' },
  { id: 'mssql', name: 'MSSQL', path: '/mssql' },
  { id: 'databases', name: 'Tüm Veritabanları', path: '/databases' },
  { id: 'smtp', name: 'SMTP', path: '/smtp' },
  { id: 'alerts', name: 'Uyarılar', path: '/alerts' },
  { id: 'analiz', name: 'Analiz', path: '/analiz' },
  { id: 'ozellestir', name: 'Özelleştir', path: '/ozellestir' },
];

/**
 * Permission tablosunu oluştur (eğer yoksa)
 */
const ensurePermissionTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      page_id VARCHAR(50) NOT NULL,
      has_access BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, page_id)
    )
  `);
  
  // Mevcut tabloda default değeri false yap (eğer değişmişse)
  await pool.query(`
    ALTER TABLE user_permissions 
    ALTER COLUMN has_access SET DEFAULT false
  `).catch(() => {
    // Hata olursa görmezden gel (tablo zaten doğru yapılandırılmış olabilir)
  });

  // Index oluştur
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)
  `);
};

/**
 * Tüm kullanıcıların izinlerini getir
 */
exports.getAllPermissions = asyncHandler(async (req, res) => {
  await ensurePermissionTable();

  // Tüm kullanıcıları getir
  const usersResult = await pool.query(
    `SELECT id, email, first_name, last_name, role 
     FROM users 
     WHERE role != 'admin'
     ORDER BY created_at DESC`
  );

  const users = usersResult.rows;

  // Her kullanıcı için izinleri getir
  const permissionsResult = await pool.query(
    `SELECT user_id, page_id, has_access 
     FROM user_permissions`
  );

  // İzinleri user_id ve page_id'ye göre map'le
  const permissionsMap = {};
  permissionsResult.rows.forEach((perm) => {
    if (!permissionsMap[perm.user_id]) {
      permissionsMap[perm.user_id] = {};
    }
    permissionsMap[perm.user_id][perm.page_id] = perm.has_access;
  });

  // Kullanıcıları ve izinlerini birleştir
  const result = users.map((user) => {
    const userPermissions = permissionsMap[user.id] || {};
    const permissions = AVAILABLE_PAGES.map((page) => ({
      pageId: page.id,
      pageName: page.name,
      pagePath: page.path,
      hasAccess: userPermissions[page.id] === true, // Sadece açıkça true ise erişim var (default false)
    }));

    return {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      role: user.role,
      permissions,
    };
  });

  res.json({
    success: true,
    data: {
      users: result,
      availablePages: AVAILABLE_PAGES,
    },
  });
});

/**
 * Kullanıcı izinlerini güncelle
 */
exports.updateUserPermissions = asyncHandler(async (req, res) => {
  await ensurePermissionTable();

  const { userId } = req.params;
  const { permissions } = req.body; // [{ pageId, hasAccess }, ...]

  if (!permissions || !Array.isArray(permissions)) {
    throw new AppError('İzinler array formatında olmalıdır', HTTP_STATUS.BAD_REQUEST);
  }

  // Kullanıcıyı kontrol et
  const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.NOT_FOUND);
  }

  // Transaction için client al
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Her izin için güncelleme yap
    for (const perm of permissions) {
      const { pageId, hasAccess } = perm;

      // Sayfa geçerli mi kontrol et
      const isValidPage = AVAILABLE_PAGES.some((page) => page.id === pageId);
      if (!isValidPage) {
        continue; // Geçersiz sayfa, atla
      }

      // İzni güncelle veya ekle
      await client.query(
        `INSERT INTO user_permissions (user_id, page_id, has_access, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, page_id)
         DO UPDATE SET has_access = $3, updated_at = CURRENT_TIMESTAMP`,
        [userId, pageId, hasAccess]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'İzinler başarıyla güncellendi',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Client'i her zaman release et
    client.release();
  }
});

/**
 * Mevcut kullanıcının izinlerini getir
 */
exports.getMyPermissions = asyncHandler(async (req, res) => {
  await ensurePermissionTable();

  const userId = req.user.id;

  // Admin kontrolü
  const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.NOT_FOUND);
  }

  const isAdmin = userResult.rows[0].role === 'admin';

  // Admin her zaman tüm izinlere sahip
  if (isAdmin) {
    const allPermissions = AVAILABLE_PAGES.map((page) => ({
      pageId: page.id,
      pageName: page.name,
      pagePath: page.path,
      hasAccess: true,
    }));

    return res.json({
      success: true,
      data: {
        permissions: allPermissions,
        hasAllAccess: true,
        isAdmin: true,
      },
    });
  }

  // Normal kullanıcı için izinleri getir
  const permissionsResult = await pool.query(
    `SELECT page_id, has_access 
     FROM user_permissions 
     WHERE user_id = $1`,
    [userId]
  );

  // İzinleri map'le
  const permissionsMap = {};
  permissionsResult.rows.forEach((perm) => {
    permissionsMap[perm.page_id] = perm.has_access;
  });

  // Tüm sayfalar için izinleri oluştur (default false - sadece açıkça true olanlar erişebilir)
  const permissions = AVAILABLE_PAGES.map((page) => ({
    pageId: page.id,
    pageName: page.name,
    pagePath: page.path,
    hasAccess: permissionsMap[page.id] === true, // Sadece açıkça true ise erişim var
  }));

  res.json({
    success: true,
    data: {
      permissions,
      hasAllAccess: false,
      isAdmin: false,
    },
  });
});

/**
 * Kullanıcının belirli bir sayfaya erişim izni var mı kontrol et
 */
exports.checkUserPermission = asyncHandler(async (req, res) => {
  await ensurePermissionTable();

  const { userId, pageId } = req.params;

  // Admin her zaman erişebilir
  const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new AppError('Kullanıcı bulunamadı', HTTP_STATUS.NOT_FOUND);
  }

  if (userResult.rows[0].role === 'admin') {
    return res.json({
      success: true,
      data: { hasAccess: true },
    });
  }

  // İzni kontrol et
  const permissionResult = await pool.query(
    `SELECT has_access FROM user_permissions 
     WHERE user_id = $1 AND page_id = $2`,
    [userId, pageId]
  );

  // Eğer kayıt yoksa veya false ise, erişim yok (default false)
  const hasAccess =
    permissionResult.rows.length > 0 ? permissionResult.rows[0].has_access === true : false;

  res.json({
    success: true,
    data: { hasAccess },
  });
});


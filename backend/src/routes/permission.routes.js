const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Tüm kullanıcıların izinlerini getir (Admin only)
router.get('/', authenticate, authorize('admin'), permissionController.getAllPermissions);

// Mevcut kullanıcının izinlerini getir (Herkes kendi izinlerini görebilir)
router.get('/me', authenticate, permissionController.getMyPermissions);

// Kullanıcı izinlerini güncelle (Admin only)
router.put('/:userId', authenticate, authorize('admin'), permissionController.updateUserPermissions);

// Kullanıcının belirli bir sayfaya erişim izni kontrol et
router.get('/:userId/:pageId', authenticate, permissionController.checkUserPermission);

module.exports = router;


const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Tüm route'lar authentication gerektirir
router.use(authenticate);

// Tüm kullanıcıları getir (Admin only)
router.get('/', authorize('admin'), userController.getAllUsers);

// Kullanıcı detayı
router.get('/:id', userController.getUserById);

// Yeni kullanıcı oluştur (Admin only)
router.post('/', authorize('admin'), userController.createUser);

// Kullanıcı güncelle (Kendi hesabını veya admin)
router.put('/:id', userController.updateUser);

// Kullanıcı sil (Admin only)
router.delete('/:id', authorize('admin'), userController.deleteUser);

// Şifre değiştir
router.put('/:id/password', userController.updatePassword);

module.exports = router;


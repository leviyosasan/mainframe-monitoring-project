const express = require('express');
const router = express.Router();

// Route imports
const authRoutes = require('./auth.routes');
const databaseRoutes = require('./database.routes');
const sshRoutes = require('./ssh.routes');
const customizationRoutes = require('./customization.routes');
const userRoutes = require('./user.routes');
const permissionRoutes = require('./permission.routes');

// API version info
router.get('/', (req, res) => {
  res.json({
    message: 'BMC MainView API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      database: '/api/database',
      ssh: '/api/ssh',
      customization: '/api/customization',
      users: '/api/users',
      permissions: '/api/permissions'
    }
  });
});

// Routes
router.use('/auth', authRoutes);
router.use('/database', databaseRoutes);
router.use('/ssh', sshRoutes);
router.use('/customization', customizationRoutes);
router.use('/users', userRoutes);
router.use('/permissions', permissionRoutes);

module.exports = router;


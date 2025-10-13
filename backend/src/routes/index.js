const express = require('express');
const router = express.Router();

// Route imports
const databaseRoutes = require('./database.routes');
const sshRoutes = require('./ssh.routes');

// API version info
router.get('/', (req, res) => {
  res.json({
    message: 'BMC MainView API',
    version: '1.0.0',
    endpoints: {
      database: '/api/database',
      ssh: '/api/ssh'
    }
  });
});

// Routes
router.use('/database', databaseRoutes);
router.use('/ssh', sshRoutes);

module.exports = router;


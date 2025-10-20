const express = require('express');
const { testConnection, getMainviewMvsSysover, checkTableExists } = require('../controllers/database.controller');

const router = express.Router();

// Test database connection
router.post('/test-connection', testConnection);

// Get mainview_mvs_sysover data
router.post('/mainview-mvs-sysover', getMainviewMvsSysover);

// Check table exists and get info
router.post('/check-table', checkTableExists);

module.exports = router;

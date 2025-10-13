const express = require('express');
const { testConnection } = require('../controllers/database.controller');

const router = express.Router();

// Test database connection
router.post('/test-connection', testConnection);

module.exports = router;

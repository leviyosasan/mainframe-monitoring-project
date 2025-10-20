const express = require('express');
const { testConnection, getMainviewMvsSysover, getMainviewMvsJespool,checkTableExists,checkTableExistsJespool, getMainviewMvsJCPU, checkTableExistsJCPU } = require('../controllers/database.controller');

const router = express.Router();

// Test database connection
router.post('/test-connection', testConnection);

// Get mainview_mvs_sysover data
router.post('/mainview-mvs-sysover', getMainviewMvsSysover);

//Get mainview_mvs_jespool data

router.post('/mainview-mvs-jespool', getMainviewMvsJespool);

// Check table exists and get info
router.post('/check-table', checkTableExists);

// Check table exists and get info
router.post('/check-table-jespool', checkTableExistsJespool);

// Get mainview_mvs_jcpu data
router.post('/mainview-mvs-jcpu', getMainviewMvsJCPU)

// Check table exists for jcpu
router.post('/check-table-jcpu', checkTableExistsJCPU)

module.exports = router;

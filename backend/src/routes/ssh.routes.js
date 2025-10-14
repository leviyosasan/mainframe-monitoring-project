const express = require('express');
const { connectSSH, executeCommand, disconnectSSH } = require('../controllers/ssh.controller');

const router = express.Router();

// SSH connection endpoints
router.post('/connect', connectSSH);
router.post('/execute', executeCommand);
router.post('/disconnect', disconnectSSH);

module.exports = router;

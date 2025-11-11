const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const customizationController = require('../controllers/customization.controller');

// All routes require authentication
router.use(auth.authenticate);

// ==================== FOLDER ROUTES ====================
router.get('/folders', customizationController.getFolders);
router.post('/folders', customizationController.createFolder);
router.put('/folders/:id', customizationController.updateFolder);
router.delete('/folders/:id', customizationController.deleteFolder);

// ==================== DASHBOARD ROUTES ====================
router.get('/dashboards', customizationController.getDashboards);
router.get('/dashboards/:id', customizationController.getDashboard);
router.post('/dashboards', customizationController.createDashboard);
router.put('/dashboards/:id', customizationController.updateDashboard);
router.delete('/dashboards/:id', customizationController.deleteDashboard);
router.patch('/dashboards/:id/move', customizationController.moveDashboard);

module.exports = router;


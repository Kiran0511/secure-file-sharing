const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyAdminToken = require('../middleware/supabaseAuth');

// Dashboard endpoints
router.get('/dashboard/stats', verifyAdminToken, adminController.getDashboardStats);
router.get('/dashboard/files', verifyAdminToken, adminController.getDashboardFiles);
router.get('/dashboard/status-counts', verifyAdminToken, adminController.getStatusCounts);
router.get('/dashboard/export-csv', verifyAdminToken, adminController.exportCSV);

// Health check endpoints
router.get('/health', verifyAdminToken, adminController.getHealthCheck);

// Audit endpoints
router.get('/audit-stats', verifyAdminToken, adminController.getAuditStats);
router.get('/audit-logs', verifyAdminToken, adminController.getAuditLogs);

// User management endpoints
router.get('/users', verifyAdminToken, adminController.getUsers);
router.post('/update-user-role', verifyAdminToken, adminController.updateUserRole);

module.exports = router;

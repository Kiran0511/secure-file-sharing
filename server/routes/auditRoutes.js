const express = require('express');
const router = express.Router();
const AuditLogger = require('../utils/auditLogger');
const verifyAdminToken = require('../middleware/supabaseAuth'); // Use your auth middleware

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs with filtering and pagination
 */
router.get('/audit-logs', verifyAdminToken, async (req, res) => {
  try {
    const {
      userEmail,
      actionType,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    const result = await AuditLogger.getAuditLogs({
      userEmail,
      actionType,
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.data.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/audit-stats
 * Get audit statistics for dashboard
 */
router.get('/audit-stats', verifyAdminToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    const result = await AuditLogger.getAuditStats(timeRange);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit statistics',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        total_events: result.total_events,
        successful_events: result.successful_events,
        failed_events: result.failed_events,
        action_breakdown: result.event_types || {}
      },
      timeRange
    });
  } catch (error) {
    console.error('Error retrieving audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/security-alerts
 * Get failed security events that need attention
 */
router.get('/security-alerts', verifyAdminToken, async (req, res) => {
  try {
    const result = await AuditLogger.getAuditLogs({
      status: 'FAILED',
      limit: 100,
      offset: 0
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve security alerts',
        error: result.error
      });
    }

    // Group by IP address to identify potential threats
    const alertsByIP = {};
    const alertsByUser = {};

    result.data.forEach(log => {
      if (log.ip_address) {
        if (!alertsByIP[log.ip_address]) {
          alertsByIP[log.ip_address] = [];
        }
        alertsByIP[log.ip_address].push(log);
      }

      if (log.user_email) {
        if (!alertsByUser[log.user_email]) {
          alertsByUser[log.user_email] = [];
        }
        alertsByUser[log.user_email].push(log);
      }
    });

    // Find suspicious activity (multiple failures from same IP/user)
    const suspiciousIPs = Object.keys(alertsByIP).filter(ip => 
      alertsByIP[ip].length >= 5
    );

    const suspiciousUsers = Object.keys(alertsByUser).filter(user => 
      alertsByUser[user].length >= 3
    );

    res.json({
      success: true,
      data: {
        recent_failures: result.data.slice(0, 20),
        suspicious_ips: suspiciousIPs.map(ip => ({
          ip_address: ip,
          failure_count: alertsByIP[ip].length,
          recent_attempts: alertsByIP[ip].slice(0, 5)
        })),
        suspicious_users: suspiciousUsers.map(user => ({
          user_email: user,
          failure_count: alertsByUser[user].length,
          recent_attempts: alertsByUser[user].slice(0, 5)
        })),
        total_failed_events: result.data.length
      }
    });
  } catch (error) {
    console.error('Error retrieving security alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

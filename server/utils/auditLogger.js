const supabase = require("../supabase/supabaseClient");

/**
 * Audit Logger - Tracks all critical security events
 * 
 * Action Types:
 * - FILE_UPLOAD
 * - TOKEN_GENERATION
 * - FILE_DOWNLOAD
 * - FILE_REVOKE
 * - OTP_GENERATION
 * - OTP_VERIFICATION
 * - AUTH_LOGIN
 * - AUTH_LOGOUT
 * - KEY_ROTATION
 * - ADMIN_ACTION
 */

class AuditLogger {
  /**
   * Log a security event to the audit table
   * @param {Object} params - Audit log parameters
   * @param {string} params.action - Action type (FILE_UPLOAD, TOKEN_GENERATION, etc.)
   * @param {string} params.userEmail - User's email address
   * @param {string} params.status - SUCCESS, FAILED, PENDING
   * @param {Object} params.details - Additional details about the action
   * @param {string} params.ipAddress - User's IP address
   * @param {string} params.userAgent - User's browser/client info
   * @param {string} params.resourceId - File ID, token ID, etc.
   */
  static async log({
    action,
    userEmail,
    status = 'SUCCESS',
    details = {},
    ipAddress = null,
    userAgent = null,
    resourceId = null
  }) {
    try {
      const auditEntry = {
        action_type: action,
        user_email: userEmail,
        status: status,
        details: details,
        ip_address: ipAddress,
        user_agent: userAgent,
        resource_id: resourceId,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('❌ Failed to write audit log:', error.message);
        // Don't throw error - audit logging shouldn't break main functionality
      } else {
        console.log(`✅ Audit Log: ${action} by ${userEmail} - ${status}`);
      }

      return { success: !error, data };
    } catch (err) {
      console.error('❌ Audit logging error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Log file upload events
   */
  static async logFileUpload(userEmail, fileName, fileSize, ipAddress, userAgent, status = 'SUCCESS', errorDetails = null) {
    return this.log({
      action: 'FILE_UPLOAD',
      userEmail,
      status,
      details: {
        file_name: fileName,
        file_size: fileSize,
        error_details: errorDetails
      },
      ipAddress,
      userAgent,
      resourceId: fileName
    });
  }

  /**
   * Log token generation events
   */
  static async logTokenGeneration(userEmail, tokenType, recipientEmail, expiresAt, ipAddress, userAgent, storageToken) {
    return this.log({
      action: 'TOKEN_GENERATION',
      userEmail,
      status: 'SUCCESS',
      details: {
        token_type: tokenType,
        recipient_email: recipientEmail,
        expires_at: expiresAt
      },
      ipAddress,
      userAgent,
      resourceId: storageToken
    });
  }

  /**
   * Log file download events
   */
  static async logFileDownload(recipientEmail, fileName, downloadSuccess, ipAddress, userAgent, storageToken, errorDetails = null) {
    return this.log({
      action: 'FILE_DOWNLOAD',
      userEmail: recipientEmail,
      status: downloadSuccess ? 'SUCCESS' : 'FAILED',
      details: {
        file_name: fileName,
        error_details: errorDetails
      },
      ipAddress,
      userAgent,
      resourceId: storageToken
    });
  }

  /**
   * Log file revocation events
   */
  static async logFileRevocation(userEmail, fileName, recipientEmail, ipAddress, userAgent, storageToken) {
    return this.log({
      action: 'FILE_REVOKE',
      userEmail,
      status: 'SUCCESS',
      details: {
        file_name: fileName,
        recipient_email: recipientEmail
      },
      ipAddress,
      userAgent,
      resourceId: storageToken
    });
  }

  /**
   * Log OTP generation events
   */
  static async logOTPGeneration(recipientEmail, deliveryMethod, ipAddress, userAgent, storageToken) {
    return this.log({
      action: 'OTP_GENERATION',
      userEmail: recipientEmail,
      status: 'SUCCESS',
      details: {
        delivery_method: deliveryMethod, // 'email' or 'sms'
        otp_length: 6
      },
      ipAddress,
      userAgent,
      resourceId: storageToken
    });
  }

  /**
   * Log OTP verification events
   */
  static async logOTPVerification(recipientEmail, success, ipAddress, userAgent, storageToken, errorDetails = null) {
    return this.log({
      action: 'OTP_VERIFICATION',
      userEmail: recipientEmail,
      status: success ? 'SUCCESS' : 'FAILED',
      details: {
        error_details: errorDetails
      },
      ipAddress,
      userAgent,
      resourceId: storageToken
    });
  }

  /**
   * Log authentication events
   */
  static async logAuthentication(userEmail, action, success, ipAddress, userAgent, errorDetails = null) {
    return this.log({
      action: action, // 'AUTH_LOGIN' or 'AUTH_LOGOUT'
      userEmail,
      status: success ? 'SUCCESS' : 'FAILED',
      details: {
        error_details: errorDetails
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log key rotation events
   */
  static async logKeyRotation(adminEmail, oldKeyVersion, newKeyVersion, ipAddress, userAgent) {
    return this.log({
      action: 'KEY_ROTATION',
      userEmail: adminEmail,
      status: 'SUCCESS',
      details: {
        old_key_version: oldKeyVersion,
        new_key_version: newKeyVersion
      },
      ipAddress,
      userAgent,
      resourceId: `key_v${newKeyVersion}`
    });
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(adminEmail, action, targetUser, ipAddress, userAgent, details = {}) {
    return this.log({
      action: 'ADMIN_ACTION',
      userEmail: adminEmail,
      status: 'SUCCESS',
      details: {
        admin_action: action,
        target_user: targetUser,
        ...details
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Get audit statistics for the dashboard
   */
  static async getAuditStats(timeRange = '24h') {
    try {
      let timeFilter = new Date();
      
      // Calculate time range
      switch (timeRange) {
        case '24h':
          timeFilter.setHours(timeFilter.getHours() - 24);
          break;
        case '7d':
          timeFilter.setDate(timeFilter.getDate() - 7);
          break;
        case '30d':
          timeFilter.setDate(timeFilter.getDate() - 30);
          break;
        default:
          timeFilter.setHours(timeFilter.getHours() - 24);
      }

      // Check if audit_logs table exists
      const { data: auditData, error: auditError } = await supabase
        .from("audit_logs")
        .select("action_type, status")
        .gte("timestamp", timeFilter.toISOString());

      // If table doesn't exist or error, return default values
      if (auditError) {
        console.warn("⚠️ Audit logs table not found, returning default stats");
        return {
          success: true,
          total_events: 0,
          successful_events: 0,
          failed_events: 0,
          event_types: {},
          action_types: []
        };
      }

      const totalEvents = auditData?.length || 0;
      const successfulEvents = auditData?.filter(log => log.status === 'SUCCESS').length || 0;
      const failedEvents = auditData?.filter(log => log.status === 'FAILED').length || 0;

      // Count event types
      const eventTypes = {};
      const actionTypes = [];
      
      auditData?.forEach(log => {
        if (log.action_type) {
          eventTypes[log.action_type] = (eventTypes[log.action_type] || 0) + 1;
          if (!actionTypes.includes(log.action_type)) {
            actionTypes.push(log.action_type);
          }
        }
      });

      return {
        success: true,
        total_events: totalEvents,
        successful_events: successfulEvents,
        failed_events: failedEvents,
        event_types: eventTypes,
        action_types: actionTypes
      };
    } catch (err) {
      console.error('❌ Error getting audit stats:', err.message);
      return {
        success: false,
        error: err.message,
        total_events: 0,
        successful_events: 0,
        failed_events: 0,
        event_types: {},
        action_types: []
      };
    }
  }

  /**
   * Get filtered audit logs with pagination
   */
  static async getAuditLogs(options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        userEmail, 
        actionType, 
        status, 
        startDate, 
        endDate 
      } = options;

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      // Apply filters
      if (userEmail) {
        query = query.ilike('user_email', `%${userEmail}%`);
      }
      if (actionType) {
        query = query.eq('action_type', actionType);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('⚠️ Audit logs query failed, returning empty results');
        return { 
          success: true, 
          data: [],
          totalCount: 0
        };
      }

      // Get total count for pagination
      let countQuery = supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Apply same filters for count
      if (userEmail) countQuery = countQuery.ilike('user_email', `%${userEmail}%`);
      if (actionType) countQuery = countQuery.eq('action_type', actionType);
      if (status) countQuery = countQuery.eq('status', status);
      if (startDate) countQuery = countQuery.gte('timestamp', startDate);
      if (endDate) countQuery = countQuery.lte('timestamp', endDate);

      const { count } = await countQuery;

      return { 
        success: true, 
        data: data || [],
        totalCount: count || 0
      };
    } catch (err) {
      console.error('❌ Error in getAuditLogs:', err.message);
      return { 
        success: false, 
        error: err.message,
        data: [],
        totalCount: 0
      };
    }
  }
}

module.exports = AuditLogger;

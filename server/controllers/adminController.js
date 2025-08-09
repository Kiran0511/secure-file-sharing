const path = require("path");
const supabase = require("../supabase/supabaseClient");
const AuditLogger = require("../utils/auditLogger");

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');

    // Get total uploads
    const { count: totalUploads, error: uploadsError } = await supabase
      .from("file_shares")
      .select("*", { count: 'exact', head: true });

    if (uploadsError) {
      console.error("❌ Uploads count error:", uploadsError);
      throw uploadsError;
    }

    // Get total downloads (files that have been downloaded)
    const { count: totalDownloads, error: downloadsError } = await supabase
      .from("file_shares")
      .select("*", { count: 'exact', head: true })
      .not("download_time", "is", null);

    if (downloadsError) {
      console.error("❌ Downloads count error:", downloadsError);
      throw downloadsError;
    }

    // Get expired tokens - using expiry_time instead of expiry_date
    const now = new Date().toISOString();
    const { count: expiredTokens, error: expiredError } = await supabase
      .from("file_shares")
      .select("*", { count: 'exact', head: true })
      .lt("expiry_time", now);

    if (expiredError) {
      console.error("❌ Expired count error:", expiredError);
      throw expiredError;
    }

    // Get revoked tokens - using proper case
    const { count: totalRevoked, error: revokedError } = await supabase
      .from("file_shares")
      .select("*", { count: 'exact', head: true })
      .eq("status", "Revoked");

    if (revokedError) {
      console.error("❌ Revoked count error:", revokedError);
      throw revokedError;
    }

    const stats = {
      totalUploads: totalUploads || 0,
      totalDownloads: totalDownloads || 0,
      expiredTokens: expiredTokens || 0,
      totalRevoked: totalRevoked || 0,
    };

    console.log('✅ Dashboard stats:', stats);

    // Log admin action (with error handling)
    try {
      const adminEmail = req.user?.email || 'admin@system';
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];
      
      if (AuditLogger && typeof AuditLogger.logAdminAction === 'function') {
        await AuditLogger.logAdminAction(
          adminEmail,
          'VIEW_DASHBOARD_STATS',
          null,
          ipAddress,
          userAgent,
          { stats_requested: true }
        );
      }
    } catch (auditError) {
      console.warn('⚠️ Audit logging failed:', auditError.message);
    }

    res.json(stats);
  } catch (err) {
    console.error("❌ Dashboard stats error:", err);
    res.status(500).json({ 
      error: "Error fetching dashboard stats",
      details: err.message 
    });
  }
};

// Dashboard files
exports.getDashboardFiles = async (req, res) => {
  try {
    console.log('🔍 Fetching dashboard files...');
    
    const { data: files, error } = await supabase
      .from("file_shares")
      .select(`
        id,
        file_name,
        sender_email,
        receiver_email,
        status,
        upload_time,
        download_time,
        expiry_time,
        storage_token,
        user_id
      `)
      .order("upload_time", { ascending: false });

    if (error) {
      console.error("❌ Query error:", error);
      throw error;
    }

    console.log(`📁 Raw files data (${files?.length || 0} files):`, files?.slice(0, 2));

    // Transform the data to match frontend expectations
    const transformedFiles = files?.map(file => ({
      id: file.id,
      senderEmail: file.sender_email || 'N/A',
      receiverEmail: file.receiver_email || 'N/A',
      status: file.status || 'Pending',
      uploadTime: file.upload_time,
      downloadTime: file.download_time,
      expiryTime: file.expiry_time, // Use expiry_time instead of expiry_date
      file_name: file.file_name,
      storage_token: file.storage_token,
      user_id: file.user_id
    })) || [];

    console.log(`✅ Transformed ${transformedFiles.length} files`);
    console.log(`📋 Sample transformed file:`, transformedFiles[0]);

    // Log admin action (with error handling)
    try {
      const adminEmail = req.user?.email || 'admin@system';
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];
      
      if (AuditLogger && typeof AuditLogger.logAdminAction === 'function') {
        await AuditLogger.logAdminAction(
          adminEmail,
          'VIEW_FILES_LIST',
          null,
          ipAddress,
          userAgent,
          { files_count: transformedFiles.length }
        );
      }
    } catch (auditError) {
      console.warn('⚠️ Audit logging failed:', auditError.message);
    }

    res.json(transformedFiles);
  } catch (err) {
    console.error("❌ Dashboard files error:", err);
    res.status(500).json({ 
      error: "Error fetching dashboard files",
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Status counts
exports.getStatusCounts = async (req, res) => {
  try {
    console.log('📈 Fetching status counts...');
    const now = new Date().toISOString();
    
    // Get downloaded count (files that have download_time set)
    const { count: downloadedCount, error: downloadedError } = await supabase
      .from("file_shares")
      .select("*", { count: 'exact', head: true })
      .eq("status", "Downloaded");

    if (downloadedError) {
      console.error("❌ Downloaded count error:", downloadedError);
      throw downloadedError;
    }

    // Get expired count (files past expiry_time)
    const { count: expiredCount, error: expiredError } = await supabase
      .from("file_shares")
      .select("*", { count: 'exact', head: true })
      .eq("status", "Expired");

    if (expiredError) {
      console.error("❌ Expired count error:", expiredError);
      throw expiredError;
    }

    // Get revoked count (files with revoked status)
    const { count: revokedCount, error: revokedError } = await supabase
      .from("file_shares")
      .select("*", { count: 'exact', head: true })
      .eq("status", "Revoked");

    if (revokedError) {
      console.error("❌ Revoked count error:", revokedError);
      throw revokedError;
    }

    const statusCounts = {
      Downloaded: downloadedCount || 0,
      Expired: expiredCount || 0,
      Revoked: revokedCount || 0
    };

    console.log('✅ Status counts:', statusCounts);
    res.json(statusCounts);
  } catch (err) {
    console.error("❌ Status counts error:", err);
    res.status(500).json({ 
      error: "Error fetching status counts",
      details: err.message 
    });
  }
};

// Export CSV
exports.exportCSV = async (req, res) => {
  try {
    console.log('📄 Starting CSV export...');
    console.log('🔑 User:', req.user?.email);
    
    const { data: files, error } = await supabase
      .from("file_shares")
      .select(`
        file_name,
        sender_email,
        receiver_email,
        status,
        upload_time,
        download_time,
        expiry_time
      `)
      .order("upload_time", { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`📊 Retrieved ${files?.length || 0} files for export`);

    // Create CSV content
    const csvHeader = "File Name,Sender Email,Receiver Email,Status,Upload Time,Download Time,Expiry Time\n";
    const csvRows = files?.map(file => {
      // Escape quotes in data and handle null values
      const escapeCsv = (field) => {
        if (field === null || field === undefined) return '';
        return `"${String(field).replace(/"/g, '""')}"`;
      };
      
      return [
        escapeCsv(file.file_name),
        escapeCsv(file.sender_email),
        escapeCsv(file.receiver_email),
        escapeCsv(file.status),
        escapeCsv(file.upload_time),
        escapeCsv(file.download_time),
        escapeCsv(file.expiry_time)
      ].join(',');
    }).join('\n') || '';

    const csvContent = csvHeader + csvRows;

    console.log('✅ CSV content generated successfully');

    // Log admin action
    try {
      const adminEmail = req.user?.email || 'admin@system';
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];
      
      if (AuditLogger && typeof AuditLogger.logAdminAction === 'function') {
        await AuditLogger.logAdminAction(
          adminEmail,
          'EXPORT_CSV',
          null,
          ipAddress,
          userAgent,
          { exported_files: files?.length || 0 }
        );
      }
    } catch (auditError) {
      console.warn('⚠️ Audit logging failed:', auditError.message);
    }

    // Set proper headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="file-transfers-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    res.send(csvContent);
    console.log('📁 CSV file sent successfully');
  } catch (err) {
    console.error("❌ CSV export error:", err);
    res.status(500).json({ 
      error: "Error exporting CSV",
      details: err.message 
    });
  }
};

// Health check
exports.getHealthCheck = async (req, res) => {
  try {
    // Get system information
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Test database connection
    let databaseStatus = 'healthy';
    let databaseResponseTime = null;
    let databaseError = undefined;
    
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('file_shares')
        .select('id')
        .limit(1);
      
      databaseResponseTime = Date.now() - dbStart;
      if (error) {
        databaseStatus = 'unhealthy';
        databaseError = error.message;
      }
    } catch (err) {
      databaseStatus = 'unhealthy';
      databaseResponseTime = Date.now() - dbStart;
      databaseError = err.message;
    }

    // Test storage connection (placeholder)
    let storageStatus = 'healthy';
    let storageResponseTime = null;
    let storageError = undefined;
    
    const storageStart = Date.now();
    try {
      // You can add actual storage health check here if needed
      storageResponseTime = Date.now() - storageStart;
    } catch (err) {
      storageStatus = 'unhealthy';
      storageResponseTime = Date.now() - storageStart;
      storageError = err.message;
    }

    // Calculate overall status
    const services = {
      backend: {
        status: 'healthy',
        uptime: Math.floor(uptime),
        responseTime: 0,
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal
        },
        version: process.version
      },
      database: {
        status: databaseStatus,
        responseTime: databaseResponseTime,
        lastChecked: new Date().toISOString(),
        error: databaseError
      },
      storage: {
        status: storageStatus,
        responseTime: storageResponseTime,
        lastChecked: new Date().toISOString(),
        error: storageError
      }
    };

    // Calculate summary
    const serviceStatuses = Object.values(services).map(s => s.status);
    const summary = {
      healthy: serviceStatuses.filter(s => s === 'healthy').length,
      unhealthy: serviceStatuses.filter(s => s === 'unhealthy').length,
      unknown: serviceStatuses.filter(s => s === 'unknown').length
    };

    // Determine overall status
    let overallStatus = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.unknown > 0) {
      overallStatus = 'degraded';
    }

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: services,
      summary: summary
    };

    // Return the response structure that matches what the frontend expects
    res.json({
      success: true,
      data: healthData
    });

  } catch (err) {
    console.error("Health check error:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Health check failed",
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          backend: { 
            status: 'unhealthy', 
            uptime: 0, 
            responseTime: null,
            memory: { used: 0, total: 0 }, 
            version: 'Unknown' 
          },
          database: { 
            status: 'unknown', 
            responseTime: null, 
            lastChecked: null,
            error: 'Health check failed'
          },
          storage: { 
            status: 'unknown', 
            responseTime: null, 
            lastChecked: null,
            error: 'Health check failed'
          }
        },
        summary: { healthy: 0, unhealthy: 1, unknown: 2 }
      }
    });
  }
};

// Audit stats - Updated to use AuditLogger
exports.getAuditStats = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    let timeFilter;
    
    switch (timeRange) {
      case '1h':
        timeFilter = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const timeFilterISO = timeFilter.toISOString();
    console.log('📊 Fetching audit stats for time range:', timeRange);
    console.log('📅 Time filter:', timeFilterISO);

    // First, check if failed_security_events table exists and has data
    const { data: failedEventsCheck, error: failedCheckError } = await supabase
      .from('failed_security_events')
      .select('id')
      .limit(1);

    if (failedCheckError) {
      console.error('❌ failed_security_events table check error:', failedCheckError);
      console.log('⚠️ Continuing without failed events data...');
    } else {
      console.log('✅ failed_security_events table exists and is accessible');
    }

    // Get total events count from audit_logs
    const { count: totalAuditEvents, error: totalError } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', timeFilterISO);

    if (totalError) {
      console.error('❌ Total audit events error:', totalError);
      throw totalError;
    }

    console.log('📊 Total audit events:', totalAuditEvents);

    // Get successful events count from audit_logs
    const { count: successfulEvents, error: successError } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', timeFilterISO)
      .in('status', ['SUCCESS', 'COMPLETED', 'successful', 'success']);

    if (successError) {
      console.error('❌ Successful events error:', successError);
      throw successError;
    }

    console.log('📊 Successful events:', successfulEvents);

    // Get failed events count from failed_security_events table
    let failedEvents = 0;
    let securityAlerts = 0;

    if (!failedCheckError) {
      const { count: failedEventsCount, error: failedError } = await supabase
        .from('failed_security_events')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', timeFilterISO);

      if (failedError) {
        console.error('❌ Failed events count error:', failedError);
      } else {
        failedEvents = failedEventsCount || 0;
        console.log('📊 Failed events:', failedEvents);
      }

      // Get security alerts count (subset of failed events with security-related action types)
      const { count: securityAlertsCount, error: securityError } = await supabase
        .from('failed_security_events')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', timeFilterISO)
        .in('action_type', ['VIRUS_DETECTED', 'MALWARE_SCAN_FAILED', 'SUSPICIOUS_FILE', 'SECURITY_VIOLATION', 'FILE_UPLOAD']);

      if (securityError) {
        console.error('❌ Security alerts error:', securityError);
      } else {
        securityAlerts = securityAlertsCount || 0;
        console.log('📊 Security alerts:', securityAlerts);
      }

      // Debug: Show sample failed events
      const { data: sampleFailedEvents, error: sampleError } = await supabase
        .from('failed_security_events')
        .select('*')
        .gte('timestamp', timeFilterISO)
        .order('timestamp', { ascending: false })
        .limit(3);

      if (!sampleError && sampleFailedEvents) {
        console.log('📋 Sample failed events:', sampleFailedEvents);
      }
    }

    // Get action breakdown from audit_logs
    const { data: actionBreakdown, error: actionError } = await supabase
      .from('audit_logs')
      .select('action_type')
      .gte('timestamp', timeFilterISO);

    if (actionError) {
      console.error('❌ Action breakdown error:', actionError);
      throw actionError;
    }

    // Count action types from audit_logs
    const actionCounts = actionBreakdown?.reduce((acc, log) => {
      acc[log.action_type] = (acc[log.action_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Also get action breakdown from failed_security_events if available
    if (!failedCheckError) {
      const { data: failedActionBreakdown, error: failedActionError } = await supabase
        .from('failed_security_events')
        .select('action_type')
        .gte('timestamp', timeFilterISO);

      if (!failedActionError && failedActionBreakdown) {
        failedActionBreakdown.forEach(log => {
          if (log.action_type) {
            actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
          }
        });
      }
    }

    const stats = {
      total_events: (totalAuditEvents || 0) + failedEvents,
      successful_events: successfulEvents || 0,
      failed_events: failedEvents,
      security_alerts: securityAlerts,
      action_breakdown: actionCounts
    };

    console.log('✅ Final audit stats:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('❌ Audit stats error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching audit stats',
      details: err.message 
    });
  }
};

// Audit logs - Updated to use AuditLogger
exports.getAuditLogs = async (req, res) => {
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

    console.log('📋 Fetching audit logs with filters:', { userEmail, actionType, status, startDate, endDate });

    // Build time filter
    const timeFilter = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endTimeFilter = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

    // Get regular audit logs
    let auditQuery = supabase
      .from('audit_logs')
      .select('*')
      .gte('timestamp', timeFilter)
      .lte('timestamp', endTimeFilter)
      .order('timestamp', { ascending: false });

    if (userEmail) {
      auditQuery = auditQuery.eq('user_email', userEmail);
    }
    if (actionType && actionType !== 'ALL') {
      auditQuery = auditQuery.eq('action_type', actionType);
    }
    if (status && status !== 'ALL') {
      auditQuery = auditQuery.eq('status', status);
    }

    const { data: auditLogs, error: auditError } = await auditQuery;

    if (auditError) {
      console.error('❌ Audit logs error:', auditError);
      throw auditError;
    }

    // Get failed security events
    let failedQuery = supabase
      .from('failed_security_events')
      .select('*')
      .gte('timestamp', timeFilter)
      .lte('timestamp', endTimeFilter)
      .order('timestamp', { ascending: false });

    if (userEmail) {
      failedQuery = failedQuery.eq('user_email', userEmail);
    }
    if (actionType && actionType !== 'ALL') {
      failedQuery = failedQuery.eq('action_type', actionType);
    }
    // Note: failed_security_events doesn't have a status column, so skip status filter for these

    const { data: failedEvents, error: failedError } = await failedQuery;

    if (failedError) {
      console.error('❌ Failed events error:', failedError);
      // Don't throw, just continue without failed events
      console.warn('Continuing without failed security events');
    }

    // Transform failed security events to match audit log format
    const transformedFailedEvents = (failedEvents || []).map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      user_email: event.user_email || 'system',
      action_type: event.action_type || 'SECURITY_EVENT',
      status: 'FAILED', // All failed_security_events are failures
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      details: event.details || {}
    }));

    // Apply status filter to combined results if specified
    let allLogs = [...(auditLogs || []), ...transformedFailedEvents];
    
    if (status && status !== 'ALL') {
      allLogs = allLogs.filter(log => log.status === status);
    }

    // Sort and paginate
    allLogs = allLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    console.log(`✅ Retrieved ${allLogs.length} total logs (${auditLogs?.length || 0} audit + ${transformedFailedEvents.length} failed)`);

    res.json({
      success: true,
      data: allLogs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalCount: (auditLogs?.length || 0) + transformedFailedEvents.length,
        hasMore: allLogs.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error("❌ Audit logs error:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Error fetching audit logs",
      details: err.message 
    });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    console.log('🔍 Fetching all users...');
    
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    console.log(`✅ Retrieved ${users?.length || 0} users`);

    // Log admin action
    const adminEmail = req.user?.email || 'admin@system';
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    
    await AuditLogger.logAdminAction(
      adminEmail,
      'VIEW_USERS_LIST',
      null,
      ipAddress,
      userAgent,
      { users_count: users?.length || 0 }
    );

    res.json(users || []);
  } catch (err) {
    console.error("❌ Get users error:", err.message);
    res.status(500).json({ 
      error: "Error fetching users",
      details: err.message 
    });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    
    console.log(`🔄 Updating user ${userId} role to ${newRole}`);

    if (!userId || !newRole) {
      return res.status(400).json({ 
        error: "User ID and new role are required" 
      });
    }

    if (!['user', 'admin'].includes(newRole)) {
      return res.status(400).json({ 
        error: "Invalid role. Must be 'user' or 'admin'" 
      });
    }

    // Update user role in database
    const { data, error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Error updating user role:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }

    const updatedUser = data[0];
    console.log(`✅ User role updated successfully:`, updatedUser.email);

    // Log admin action
    const adminEmail = req.user?.email || 'admin@system';
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    
    await AuditLogger.logAdminAction(
      adminEmail,
      'UPDATE_USER_ROLE',
      userId.toString(),
      ipAddress,
      userAgent,
      { 
        user_email: updatedUser.email,
        old_role: 'unknown', // You might want to track the old role
        new_role: newRole 
      }
    );

    res.json({
      success: true,
      message: `User role updated to ${newRole} successfully`,
      user: updatedUser
    });
  } catch (err) {
    console.error("❌ Update user role error:", err.message);
    res.status(500).json({ 
      error: "Error updating user role",
      details: err.message 
    });
  }
};

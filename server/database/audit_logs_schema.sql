-- Audit Logs Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    resource_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_email, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_action ON audit_logs(timestamp DESC, action_type);

-- Add constraints
ALTER TABLE audit_logs
ADD CONSTRAINT chk_action_type 
CHECK (action_type IN (
    'FILE_UPLOAD',
    'TOKEN_GENERATION', 
    'FILE_DOWNLOAD',
    'FILE_REVOKE',
    'OTP_GENERATION',
    'OTP_VERIFICATION',
    'AUTH_LOGIN',
    'AUTH_LOGOUT',
    'KEY_ROTATION',
    'ADMIN_ACTION'
));

ALTER TABLE audit_logs
ADD CONSTRAINT chk_status
CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING'));

-- Row Level Security (RLS) - Enable security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only allow read access to admin users
-- You'll need to create an admin role/check in your application
CREATE POLICY audit_logs_read_policy ON audit_logs
    FOR SELECT
    USING (
        -- Add your admin check here
        -- For example: auth.jwt() ->> 'role' = 'admin'
        -- OR check against an admin users table
        true -- Temporarily allow all reads - CHANGE THIS IN PRODUCTION
    );

-- RLS Policy: Only allow system to insert audit logs
CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT
    WITH CHECK (true); -- Allow all inserts from application

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all security-critical actions in the file sharing system';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed (FILE_UPLOAD, TOKEN_GENERATION, etc.)';
COMMENT ON COLUMN audit_logs.user_email IS 'Email of the user who performed the action';
COMMENT ON COLUMN audit_logs.status IS 'Result of the action (SUCCESS, FAILED, PENDING)';
COMMENT ON COLUMN audit_logs.details IS 'JSON object containing additional action-specific details';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user when action was performed';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/client information';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource affected (filename, token, etc.)';
COMMENT ON COLUMN audit_logs.timestamp IS 'When the action occurred';

-- Create a view for easy querying of recent critical events
CREATE OR REPLACE VIEW recent_critical_events AS
SELECT 
    id,
    action_type,
    user_email,
    status,
    details,
    ip_address,
    timestamp
FROM audit_logs
WHERE 
    timestamp >= NOW() - INTERVAL '24 hours'
    AND action_type IN ('FILE_DOWNLOAD', 'FILE_REVOKE', 'KEY_ROTATION', 'ADMIN_ACTION')
ORDER BY timestamp DESC;

-- Create a view for failed events that need attention
CREATE OR REPLACE VIEW failed_security_events AS
SELECT 
    id,
    action_type,
    user_email,
    details,
    ip_address,
    user_agent,
    timestamp
FROM audit_logs
WHERE 
    status = 'FAILED'
    AND timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- Sample queries for monitoring:

-- Get all failed login attempts in the last hour
-- SELECT * FROM audit_logs 
-- WHERE action_type = 'AUTH_LOGIN' 
-- AND status = 'FAILED' 
-- AND timestamp >= NOW() - INTERVAL '1 hour';

-- Get file download activity for a specific user
-- SELECT * FROM audit_logs 
-- WHERE user_email = 'user@example.com' 
-- AND action_type = 'FILE_DOWNLOAD' 
-- ORDER BY timestamp DESC;

-- Get admin actions in the last 24 hours
-- SELECT * FROM audit_logs 
-- WHERE action_type = 'ADMIN_ACTION' 
-- AND timestamp >= NOW() - INTERVAL '24 hours';

-- Monitor for suspicious activity (multiple failed attempts)
-- SELECT user_email, ip_address, COUNT(*) as failed_attempts
-- FROM audit_logs 
-- WHERE status = 'FAILED' 
-- AND timestamp >= NOW() - INTERVAL '1 hour'
-- GROUP BY user_email, ip_address
-- HAVING COUNT(*) > 5;

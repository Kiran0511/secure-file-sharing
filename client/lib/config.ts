// API Configuration
// Change this IP address to match your host machine's IP
const API_BASE_URL = "http://192.168.0.100:3000"

export const API_ENDPOINTS = {
  // Base URL
  BASE: API_BASE_URL,
  
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/changepassword`,
    TEST: `${API_BASE_URL}/api/auth/test`,
  },
  
  // Upload endpoints
  UPLOAD: {
    FILE: `${API_BASE_URL}/api/upload/files`,
  },
  
  // Download endpoints
  DOWNLOAD: {
    VERIFY: `${API_BASE_URL}/api/verify-otp`,
    FILE: `${API_BASE_URL}/api/download`,
  },
  
  // User endpoints
  USER: {
    DASHBOARD: `${API_BASE_URL}/api/users/dashboard`,
    PROFILE: `${API_BASE_URL}/api/users/profile`,
    MY_UPLOADS: `${API_BASE_URL}/api/users/myuploads`,
    REVOKE_UPLOAD: `${API_BASE_URL}/api/users/revoke-upload`,
    REVOKE: `${API_BASE_URL}/api/users/revoke`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/changepassword`,
  },
  
  // Admin endpoints
  ADMIN: {
    DASHBOARD: {
      STATS: `${API_BASE_URL}/api/admin/dashboard/stats`,
      FILES: `${API_BASE_URL}/api/admin/dashboard/files`,
      STATUS_COUNTS: `${API_BASE_URL}/api/admin/dashboard/status-counts`,
      EXPORT_CSV: `${API_BASE_URL}/api/admin/dashboard/export-csv`,
    },
    USERS: `${API_BASE_URL}/api/admin/users`,
    UPDATE_USER_ROLE: `${API_BASE_URL}/api/admin/update-user-role`,
    AUDIT_LOGS: `${API_BASE_URL}/api/admin/audit-logs`,
    AUDIT_STATS: `${API_BASE_URL}/api/admin/audit-stats`,
    HEALTH: `${API_BASE_URL}/api/admin/health`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/changepassword`,
  }
}

// Quick configurations for different environments
export const ENVIRONMENT_CONFIGS = {
  LOCAL: {
    API_BASE_URL: "http://localhost:3000",
    CLIENT_URL: "http://localhost:3001"
  },
  NETWORK: {
    API_BASE_URL: "http://192.168.0.100:3000", // Change this to your IP
    CLIENT_URL: "http://192.168.0.100:3001"
  },
  PRODUCTION: {
    API_BASE_URL: "https://your-domain.com",
    CLIENT_URL: "https://your-domain.com"
  }
}

// Helper function to get the current configuration
export const getCurrentConfig = () => {
  // You can change this to switch environments
  return ENVIRONMENT_CONFIGS.NETWORK // Change to LOCAL for localhost
}

export default API_ENDPOINTS
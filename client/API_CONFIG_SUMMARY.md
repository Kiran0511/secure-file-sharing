# API Configuration Migration Summary

## ✅ **FIXED - Upload Error Resolution**

**Issue:** Upload was failing with 404 error because of incorrect endpoint URLs.

**Root Cause:** API endpoints in config didn't match server route structure.

### **Fixed Endpoints:**
1. **Upload:** `/api/upload` → `/api/upload/files` ✅
2. **User Change Password:** `/api/changepassword` → `/api/auth/changepassword` ✅  
3. **Admin Change Password:** `/api/changepassword` → `/api/auth/changepassword` ✅

## ✅ **Completed Updates**

All hardcoded API URLs have been replaced with centralized configuration from `/lib/config.ts`.

### **Files Updated:**

#### 1. **Core Configuration** (`/lib/config.ts`)
- ✅ Added all API endpoints
- ✅ Fixed endpoint URLs to match server routes
- ✅ Environment configurations (LOCAL, NETWORK, PRODUCTION)
- ✅ Currently set to: `http://192.168.0.100:3000`

#### 2. **Authentication Pages**
- ✅ `/app/users/login/page.tsx` - Uses `API_ENDPOINTS.AUTH.LOGIN`
- ✅ `/app/users/signup/page.tsx` - Uses `API_ENDPOINTS.AUTH.SIGNUP`

#### 3. **Upload/Download Pages**
- ✅ `/app/upload/page.tsx` - Uses `API_ENDPOINTS.UPLOAD.FILE` (Fixed!)
- ✅ `/app/download/page.tsx` - Uses `API_ENDPOINTS.DOWNLOAD.VERIFY`

#### 4. **User Pages**
- ✅ `/app/users/myuploads/page.tsx` - Uses `API_ENDPOINTS.USER.MY_UPLOADS` & `API_ENDPOINTS.USER.REVOKE_UPLOAD`
- ✅ `/app/users/changepassword/page.tsx` - Uses `API_ENDPOINTS.USER.CHANGE_PASSWORD` (Fixed!)

#### 5. **Admin Pages**
- ✅ `/app/admin/dashboard/page.tsx` - Uses multiple `API_ENDPOINTS.ADMIN.*` endpoints
- ✅ `/app/admin/userlist/page.tsx` - Uses `API_ENDPOINTS.ADMIN.USERS`, `API_ENDPOINTS.ADMIN.UPDATE_USER_ROLE`
- ✅ `/app/admin/changepassword/page.tsx` - Uses `API_ENDPOINTS.ADMIN.CHANGE_PASSWORD` (Fixed!)

### **Corrected API Endpoints:**

```typescript
API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login"
    SIGNUP: "/api/auth/signup"
    CHANGE_PASSWORD: "/api/auth/changepassword" // Fixed!
  },
  UPLOAD: {
    FILE: "/api/upload/files" // Fixed!
  },
  DOWNLOAD: {
    VERIFY: "/api/verify-otp"
  },
  USER: {
    MY_UPLOADS: "/api/users/myuploads"
    REVOKE_UPLOAD: "/api/users/revoke-upload"
    REVOKE: "/api/users/revoke"
    CHANGE_PASSWORD: "/api/auth/changepassword" // Fixed!
  },
  ADMIN: {
    DASHBOARD: {
      STATS: "/api/admin/dashboard/stats"
      FILES: "/api/admin/dashboard/files"
      STATUS_COUNTS: "/api/admin/dashboard/status-counts"
      EXPORT_CSV: "/api/admin/dashboard/export-csv"
    },
    USERS: "/api/admin/users"
    UPDATE_USER_ROLE: "/api/admin/update-user-role"
    AUDIT_LOGS: "/api/admin/audit-logs"
    AUDIT_STATS: "/api/admin/audit-stats"
    HEALTH: "/api/admin/health"
    CHANGE_PASSWORD: "/api/auth/changepassword" // Fixed!
  }
}
```

## 🚀 **How to Change IP Address**

### **Single Point of Control:**
To change from your current IP (`192.168.0.100`) to any other IP:

1. **Edit `/lib/config.ts`:**
```typescript
const API_BASE_URL = "http://YOUR_NEW_IP:3000"
```

2. **Or switch environments:**
```typescript
// For localhost development
return ENVIRONMENT_CONFIGS.LOCAL 

// For network access (current)
return ENVIRONMENT_CONFIGS.NETWORK 

// For production
return ENVIRONMENT_CONFIGS.PRODUCTION
```

## ✅ **Verification**
- ✅ Fixed upload endpoint: `/api/upload/files`
- ✅ Fixed change password endpoints: `/api/auth/changepassword`
- ✅ 0 remaining hardcoded `localhost:3000` URLs in client code
- ✅ All API calls now use centralized configuration
- ✅ Ready for VMware Kali Linux access at `http://192.168.0.100:3001`

## 📝 **Upload should work now!**
1. Start both servers (`npm start` & `npm run dev`)
2. Access from Kali Linux: `http://192.168.0.100:3001`
3. Upload files - should now work with correct `/api/upload/files` endpoint
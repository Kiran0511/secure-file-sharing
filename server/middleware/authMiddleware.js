const supabase = require("../supabase/supabaseClient");

// Verify admin token using Supabase auth
exports.verifyAdminToken = async (req, res, next) => {
  try {
    console.log('🔐 Admin auth middleware - checking token...');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ No token provided or invalid format');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(" ")[1];
    console.log('🔍 Token received:', token.substring(0, 20) + '...');
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data?.user) {
      console.log('❌ Token verification failed:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const user = data.user;
    console.log('✅ User verified:', user.email);
    console.log('🔍 User metadata:', { 
      userMetadata: user.user_metadata,
      appMetadata: user.app_metadata 
    });
    
    // Check if user is admin
    const isAdmin = user.user_metadata?.role === 'admin' || 
                   user.app_metadata?.role === 'admin' ||
                   user.email === 'admin@example.com';
    
    if (!isAdmin) {
      console.log('❌ Admin access denied for:', user.email);
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    console.log('✅ Admin access granted for:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Admin auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// General user token verification
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(" ")[1];
    
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
const supabase = require("../supabase/supabaseClient");

module.exports = async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  // Verify token with Supabase
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Check admin role in users table
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  req.user = data.user;
  next();
}
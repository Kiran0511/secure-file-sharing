const supabase = require("../supabase/supabaseClient")
const bcrypt = require("bcrypt")
const SALT_ROUNDS = 12

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body
  // No Turnstile verification

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" })
  }

  // Authenticate with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error || !data?.user) {
    return res.status(401).json({ success: false, message: "Invalid email or password" })
  }

  // Optionally, check if the user exists in your users table and has role 'admin'
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();


  if (!userData || userData.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  return res.json({ success: true, message: "Login successful" })
}

// Signup Controller (for both user and admin, default role is 'user')
exports.signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single()

  if (existingUser) {
    return res.status(409).json({ success: false, message: "Email already registered" })
  }

  // Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError || !authUser?.user?.id) {
    console.error("Supabase Auth error:", authError)
    return res.status(500).json({ success: false, message: "Auth signup failed" })
  }

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert into users table with hashed password
  const { error: insertError } = await supabase
    .from("users")
    .insert([{
      id: authUser.user.id,
      email,
      password: hashedPassword, // store hashed password
      role: "user"
    }])

  if (insertError) {
    console.error("Signup error:", insertError)
    return res.status(500).json({ success: false, message: "Signup failed" })
  }

  return res.json({ success: true, message: "Signup successful" })
}

// User Login Controller
exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  // Authenticate with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data?.user) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  // Get user role from your users table
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("email", email)
    .single();

  if (!userData) {
    return res.status(403).json({ success: false, message: "User not found" });
  }

  // Return access token and role
  return res.json({
    success: true,
    role: userData.role,
    accessToken: data.session.access_token
  });
}

// Change Password Controller
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }
    const token = authHeader.split(" ")[1]

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return res.status(401).json({ success: false, message: "Invalid token" })
    }

    // Get user record from your users table
    const { data: userRow, error: userRowError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (userRowError || !userRow) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Compare current password with hashed password in your users table
    const isMatch = await bcrypt.compare(currentPassword, userRow.password)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" })
    }

    // Update password in Supabase Auth
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })
    if (updateAuthError) {
      return res.status(500).json({ success: false, message: "Failed to update password in Auth" })
    }

    // Hash new password and update in your users table
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", user.id)

    if (updateUserError) {
      return res.status(500).json({ success: false, message: "Failed to update password" })
    }

    return res.json({ success: true, message: "Password changed successfully" })
  } catch (err) {
    console.error("Change password error:", err)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// Add this unified login function
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data?.user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Get user role from your users table
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!userData) {
      return res.status(403).json({ success: false, message: "User not found" });
    }

    // Return access token, role, and redirect info
    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role
      },
      accessToken: data.session.access_token,
      redirectTo: userData.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const supabase = require("../supabase/supabaseClient")
const { sendMail } = require("../utils/mailUtil")
const { DeleteObjectCommand } = require("@aws-sdk/client-s3")
const s3Client = require("../cloud/awsConfig")
const { generateRevokeEmail } = require("../utils/revokeUtils")
const { cleanupUnusedKeys, forceCleanupOldKeys } = require("../utils/keyCleanup")
const AuditLogger = require("../utils/auditLogger")

const SALT_ROUNDS = 12
const JWT_SECRET = process.env.JWT_SECRET

// Test endpoint
exports.testRoute = (req, res) => {
  res.json({ 
    success: true, 
    message: "User routes are working!",
    timestamp: new Date().toISOString()
  });
};

// Signup (same as before)
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, password, and name are required" 
      })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single()

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      })
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          name,
          password: hashedPassword,
          role: "user", // Default role is user
          createdAt: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("Signup error:", error)
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create user" 
      })
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    })
  } catch (err) {
    console.error("Signup error:", err)
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    })
  }
}

// Single login for both admin and user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      })
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    )

    // Return response with role-based routing info
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      // Frontend can use this to determine where to redirect
      redirectTo: user.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    })
  }
}

// Change password (same as before)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.userId

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Current password and new password are required" 
      })
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("password")
      .eq("id", userId)
      .single()

    if (error || !user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: "Current password is incorrect" 
      })
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", userId)

    if (updateUserError) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update password" 
      })
    }

    return res.json({ 
      success: true, 
      message: "Password changed successfully" 
    })
  } catch (err) {
    console.error("Change password error:", err)
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    })
  }
}

// Get uploads for the logged-in user
exports.getMyUploads = async (req, res) => {
  const userId = req.user.id // Supabase Auth user id

  const { data, error } = await supabase
    .from("file_shares")
    .select("*")
    .eq("user_id", userId)

  if (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch uploads" })
  }

  res.json(data)
}

// Revoke an upload (update status to 'Revoked')
exports.revokeUpload = async (req, res) => {
  const { uploadId } = req.body
  const userId = req.user.id
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  // Fetch the upload and check status
  const { data: upload, error: fetchError } = await supabase
    .from("file_shares")
    .select("*")
    .eq("id", uploadId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !upload) {
    return res.status(404).json({ success: false, message: "Upload not found" })
  }

  if (upload.status !== "Pending") {
    return res.status(400).json({ success: false, message: "Only pending uploads can be revoked" })
  }

  // Update status to 'Revoked'
  const { error: updateError } = await supabase
    .from("file_shares")
    .update({ status: "Revoked" })
    .eq("id", uploadId)
    .eq("user_id", userId)

  if (updateError) {
    return res.status(500).json({ success: false, message: "Failed to revoke upload" })
  }

  // Delete file from S3
  try {
    // Use the actual file_name property from your upload object
    const s3Key = `uploads/${upload.file_name}`;
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
    }));
    console.log(`🗑️ Deleted from S3: ${s3Key}`);
  } catch (s3Err) {
    console.error("Failed to delete file from S3:", s3Err)
    // Optionally, you can still proceed or return an error
  }

  // Send email to receiver
  try {
    await sendMail({
      to: upload.receiver_email,
      subject: "File Share Revoked",
      text: `The file shared with you by ${upload.sender_email} has been revoked and is no longer available for download.`,
      html: generateRevokeEmail({ senderEmail: upload.sender_email }),
    })
  } catch (mailErr) {
    console.error("Failed to send revoke email:", mailErr)
  }

  // Audit log for file revocation
  await AuditLogger.logFileRevocation(
    upload.sender_email,
    upload.file_name,
    upload.receiver_email,
    ipAddress,
    userAgent,
    upload.storage_token
  );

  res.json({
    success: true,
    message: `Upload revoked and file deleted successfully. An email notification has been sent to ${upload.receiver_email}.`
  })

  // Clean up unused keys after successful revoke
  setTimeout(() => forceCleanupOldKeys(), 2000)
}
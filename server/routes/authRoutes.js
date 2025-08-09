const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const supabaseAuth = require("../middleware/supabaseAuth")

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Auth routes are working!",
    timestamp: new Date().toISOString()
  });
})

// Public routes (no authentication required)
router.post("/signup", authController.signup)
router.post("/login", authController.login) // Single login for both admin and user

// Protected routes (authentication required)
router.post("/changepassword", supabaseAuth, authController.changePassword)

module.exports = router
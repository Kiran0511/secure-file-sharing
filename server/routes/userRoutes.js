const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const supabaseAuth = require("../middleware/supabaseAuth")

// Get uploads for logged-in user
router.get("/myuploads", supabaseAuth, userController.getMyUploads)

// Revoke an upload (update status to 'Revoked')
router.post("/revoke-upload", supabaseAuth, userController.revokeUpload)

module.exports = router
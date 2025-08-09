const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "temp/" });
const uploadController = require("../controllers/uploadController");
const supabaseAuth = require("../middleware/supabaseAuth");

// POST /api/upload
router.post("/files", supabaseAuth, upload.single("file"), uploadController.handleUpload);

module.exports = router;

const express = require("express");
const router = express.Router();
const downloadController = require("../controllers/downloadController");

// GET /api/download
//router.get("/download", downloadController.serveDownloadPage);

// POST /api/verify-otp
router.post("/verify-otp", downloadController.verifyAndDownload);

module.exports = router;

const express = require("express");
const path = require("path");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require('cors');

const uploadRoutes = require("./routes/uploadRoutes");
const downloadRoutes = require("./routes/downloadRoutes");
const authRoutes = require("./routes/authRoutes"); // This now handles user routes
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const auditRoutes = require("./routes/auditRoutes");
const aws = require("./cloud/awsConfig");
const { testConnection: testSupabaseConnection } = require("./supabase/supabaseClient");
const { ListBucketsCommand } = require("@aws-sdk/client-s3");

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, 
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, 
  message: "Too many admin requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

app.use('/api/admin', adminLimiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : [
        'http://localhost:3001', 
        'http://192.168.0.100:3001', 
        'http://192.168.73.1:3001'   
      ], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, "views")));

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", downloadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", auditRoutes); 

app.get("/", (req, res) => {
  res.send("🔐 Secure File Sharing Server is running!");
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

(async () => {
  try {
    await aws.send(new ListBucketsCommand({}));
    console.log("✅ AWS S3 connection established.");
  } catch (err) {
    console.error("❌ AWS S3 connection failed:", err.message);
  }
})();

(async () => {
  await testSupabaseConnection();
})();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; 
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 External access: http://192.168.0.100:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

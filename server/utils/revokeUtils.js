function generateRevokeEmail({ senderEmail }) {
  const now = new Date().toLocaleString(); // Generate date on server
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>File Share Revoked</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); min-height: 100vh; padding: 20px; color: #e8e8e8; }
    .email-container { max-width: 600px; margin: 0 auto; background: rgba(30, 41, 59, 0.95); border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); border: 1px solid rgba(71, 85, 105, 0.3); backdrop-filter: blur(10px); overflow: hidden; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>'); animation: float 6s ease-in-out infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    .logo { width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; position: relative; z-index: 1; }
    .header h1 { color: white; font-size: 28px; font-weight: 700; margin-bottom: 8px; position: relative; z-index: 1; }
    .header p { color: rgba(255, 255, 255, 0.9); font-size: 16px; position: relative; z-index: 1; }
    .content { padding: 40px 30px; }
    .alert-section { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 25px; margin-bottom: 30px; position: relative; }
    .alert-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #ef4444, #dc2626, #b91c1c); border-radius: 12px 12px 0 0; }
    .alert-icon { width: 50px; height: 50px; background: rgba(239, 68, 68, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .alert-title { font-size: 20px; font-weight: 700; color: #fca5a5; text-align: center; margin-bottom: 15px; }
    .alert-message { font-size: 16px; color: #e2e8f0; text-align: center; line-height: 1.6; }
    .sender-info { background: rgba(15, 23, 42, 0.8); border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid rgba(71, 85, 105, 0.3); position: relative; }
    .sender-info::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #64748b, #475569, #334155); border-radius: 12px 12px 0 0; }
    .sender-label { font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
    .sender-label::before { content: '👤'; font-size: 16px; }
    .sender-email { font-size: 16px; color: #e2e8f0; font-weight: 600; background: rgba(0, 0, 0, 0.3); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(71, 85, 105, 0.3); font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .status-section { background: rgba(15, 23, 42, 0.6); border-radius: 10px; padding: 20px; margin: 30px 0; border-left: 4px solid #ef4444; }
    .status-section h3 { color: #fca5a5; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .status-section h3::before { content: '🚫'; font-size: 18px; }
    .status-section p { color: #e2e8f0; font-size: 14px; line-height: 1.6; }
    .action-section { text-align: center; margin: 35px 0; padding: 25px; background: rgba(15, 23, 42, 0.4); border-radius: 12px; border: 1px solid rgba(71, 85, 105, 0.2); }
    .action-section h3 { color: #e2e8f0; font-size: 18px; font-weight: 600; margin-bottom: 15px; }
    .action-section p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
    .contact-button { display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 6px 18px rgba(59, 130, 246, 0.3); }
    .contact-button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4); background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
    .contact-icon { width: 18px; height: 18px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>') no-repeat center; background-size: contain; }
    .timestamp { text-align: center; color: #64748b; font-size: 13px; margin: 20px 0; font-style: italic; }
    .footer { background: rgba(15, 23, 42, 0.6); padding: 30px; text-align: center; border-top: 1px solid rgba(71, 85, 105, 0.3); }
    .footer p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
    .footer .company { font-weight: 600; color: #e2e8f0; }
    @media (max-width: 640px) { body { padding: 10px; } .content, .header, .footer { padding: 20px; } .header h1 { font-size: 24px; } .contact-button { padding: 12px 20px; font-size: 14px; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">🚫</div>
      <h1>File Share Revoked</h1>
      <p>Access has been removed</p>
    </div>
    <div class="content">
      <div class="alert-section">
        <div class="alert-icon">⚠️</div>
        <div class="alert-title">File Access Revoked</div>
        <div class="alert-message">
          The file that was previously shared with you is no longer available for download.
        </div>
      </div>
      <div class="sender-info">
        <div class="sender-label">File was shared by</div>
        <div class="sender-email">${senderEmail}</div>
      </div>
      <div class="status-section">
        <h3>Current Status</h3>
        <p>
          The file shared with you by <strong>${senderEmail}</strong> has been revoked and is no longer available for download. 
          Any previous download links are now inactive and will not provide access to the file.
        </p>
      </div>
      <div class="action-section">
        <h3>Need Access Again?</h3>
        <p>
          If you still need access to this file, please contact the sender directly. 
          They can choose to share the file with you again if needed.
        </p>
        <a href="mailto:${senderEmail}" class="contact-button">
          <div class="contact-icon"></div>
          Contact Sender
        </a>
      </div>
      <div class="timestamp">
        Revocation processed on: <span id="current-date">${now}</span>
      </div>
    </div>
    <div class="footer">
      <p class="company">Your Company Name</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>© 2025 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { generateRevokeEmail };
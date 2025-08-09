function generateDownloadSuccessEmail({ recipientEmail, fileName, downloadTime }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>File Successfully Downloaded - Notification</title>
  <style>
    /* ... (all your CSS from the template) ... */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); min-height: 100vh; padding: 20px; color: #e8e8e8; }
    .email-container { max-width: 600px; margin: 0 auto; background: rgba(30, 41, 59, 0.95); border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); border: 1px solid rgba(71, 85, 105, 0.3); backdrop-filter: blur(10px); overflow: hidden; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>'); animation: float 6s ease-in-out infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    .logo { width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; position: relative; z-index: 1; }
    .header h1 { color: white; font-size: 28px; font-weight: 700; margin-bottom: 8px; position: relative; z-index: 1; }
    .header p { color: rgba(255, 255, 255, 0.9); font-size: 16px; position: relative; z-index: 1; }
    .content { padding: 40px 30px; }
    .success-section { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 25px; margin-bottom: 30px; position: relative; }
    .success-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #10b981, #059669, #047857); border-radius: 12px 12px 0 0; }
    .success-icon { width: 50px; height: 50px; background: rgba(16, 185, 129, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .success-title { font-size: 20px; font-weight: 700; color: #6ee7b7; text-align: center; margin-bottom: 15px; }
    .success-message { font-size: 16px; color: #e2e8f0; text-align: center; line-height: 1.6; }
    .file-details { background: rgba(15, 23, 42, 0.8); border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid rgba(71, 85, 105, 0.3); position: relative; }
    .file-details::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #3b82f6, #10b981, #f59e0b); border-radius: 12px 12px 0 0; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(71, 85, 105, 0.2); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 14px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
    .detail-value { font-size: 15px; color: #e2e8f0; font-weight: 500; text-align: right; max-width: 60%; word-break: break-word; }
    .sender-email { background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(71, 85, 105, 0.3); font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .file-name { background: rgba(59, 130, 246, 0.1); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.3); color: #93c5fd; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
    .download-stats { background: rgba(15, 23, 42, 0.6); border-radius: 10px; padding: 20px; margin: 30px 0; border-left: 4px solid #10b981; }
    .download-stats h3 { color: #6ee7b7; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .download-stats h3::before { content: '📊'; font-size: 18px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
    .stat-item { text-align: center; background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; }
    .stat-number { font-size: 24px; font-weight: 700; color: #10b981; margin-bottom: 5px; }
    .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .next-steps { text-align: center; margin: 35px 0; padding: 25px; background: rgba(15, 23, 42, 0.4); border-radius: 12px; border: 1px solid rgba(71, 85, 105, 0.2); }
    .next-steps h3 { color: #e2e8f0; font-size: 18px; font-weight: 600; margin-bottom: 15px; }
    .next-steps p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
    .action-buttons { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
    .action-button { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; transition: all 0.3s ease; border: none; cursor: pointer; }
    .primary-button { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; box-shadow: 0 6px 18px rgba(59, 130, 246, 0.3); }
    .primary-button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4); background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
    .secondary-button { background: rgba(71, 85, 105, 0.3); color: #e2e8f0; border: 1px solid rgba(71, 85, 105, 0.5); }
    .secondary-button:hover { background: rgba(71, 85, 105, 0.5); transform: translateY(-1px); }
    .timestamp { text-align: center; color: #64748b; font-size: 13px; margin: 20px 0; font-style: italic; }
    .footer { background: rgba(15, 23, 42, 0.6); padding: 30px; text-align: center; border-top: 1px solid rgba(71, 85, 105, 0.3); }
    .footer p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
    .footer .company { font-weight: 600; color: #e2e8f0; }
    @media (max-width: 640px) { body { padding: 10px; } .content, .header, .footer { padding: 20px; } .header h1 { font-size: 24px; } .detail-row { flex-direction: column; align-items: flex-start; gap: 8px; } .detail-value { max-width: 100%; text-align: left; } .action-buttons { flex-direction: column; align-items: center; } .action-button { width: 100%; max-width: 250px; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">✅</div>
      <h1>File Successfully Downloaded</h1>
      <p>Recipient has received your file</p>
    </div>
    <div class="content">
      <div class="success-section">
        <div class="success-icon">🎉</div>
        <div class="success-title">Download Successful!</div>
        <div class="success-message">
          Your shared file has been successfully downloaded by the recipient.
        </div>
      </div>
      <div class="file-details">
        <div class="detail-row">
          <div class="detail-label">👤 Downloaded by</div>
          <div class="detail-value">
            <span class="sender-email">${recipientEmail}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">📄 File name</div>
          <div class="detail-value">
            <span class="file-name">${fileName}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">⏱️ Downloaded at</div>
          <div class="detail-value">${downloadTime}</div>
        </div>
      </div>
      <div class="download-stats">
        <h3>Download Summary</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">1</div>
            <div class="stat-label">Files Downloaded</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">✓</div>
            <div class="stat-label">Delivery Confirmed</div>
          </div>
        </div>
      </div>
      <div class="next-steps">
        <h3>File Delivery Confirmed</h3>
        <p>
          Great news! Your file has been successfully downloaded by the recipient. 
          The file transfer is now complete and the recipient has access to your shared content.
        </p>
        <div class="action-buttons">
          <a href="mailto:${recipientEmail}" class="action-button primary-button">
            📧 Contact Recipient
          </a>
          <span class="action-button secondary-button" style="pointer-events:none;opacity:0.7;">
            📊 View Share History
          </span>
        </div>
      </div>
      <div class="timestamp">
        Confirmation sent on: <span>${downloadTime}</span>
      </div>
    </div>
    <div class="footer">
      <p class="company">Your Company Name</p>
      <p>This is an automated confirmation. Please do not reply to this email.</p>
      <p>© 2025 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { generateDownloadSuccessEmail };
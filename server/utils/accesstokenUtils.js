function generateAccessTokenEmail({ accessToken, downloadUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Access Token - Secure Delivery</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); min-height: 100vh; padding: 20px; color: #e8e8e8; }
    .email-container { max-width: 600px; margin: 0 auto; background: rgba(30, 41, 59, 0.95); border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); border: 1px solid rgba(71, 85, 105, 0.3); backdrop-filter: blur(10px); overflow: hidden; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>'); animation: float 6s ease-in-out infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    .logo { width: 60px; height: 60px; background: rgba(255, 255, 255, 0.15); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; position: relative; z-index: 1; }
    .header h1 { color: white; font-size: 28px; font-weight: 700; margin-bottom: 8px; position: relative; z-index: 1; }
    .header p { color: rgba(255, 255, 255, 0.9); font-size: 16px; position: relative; z-index: 1; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 25px; color: #f1f5f9; }
    .token-section { background: rgba(15, 23, 42, 0.8); border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid rgba(71, 85, 105, 0.3); position: relative; }
    .token-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #3b82f6, #10b981, #f59e0b); border-radius: 12px 12px 0 0; }
    .token-label { font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
    .token-label::before { content: '🔐'; font-size: 16px; }
    .token-display { width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 8px; padding: 15px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 14px; color: #e2e8f0; resize: none; min-height: 120px; transition: all 0.3s ease; outline: none; }
    .token-display:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); background: rgba(0, 0, 0, 0.6); }
    .copy-button { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 15px; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; }
    .copy-button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }
    .download-section { text-align: center; margin: 35px 0; }
    .download-link { display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
    .download-link:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4); background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
    .download-icon { width: 20px; height: 20px; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24"><path d="M12 15.577l-3.539-3.538.707-.708L11.5 13.664V4h1v9.664l2.332-2.333.707.708L12 15.577z"/><path d="M4 17h16v2H4z"/></svg>') no-repeat center; background-size: contain; }
    .security-info { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 20px; margin: 30px 0; }
    .security-info h3 { color: #fca5a5; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .security-info h3::before { content: '⚠️'; font-size: 18px; }
    .security-info ul { color: #e2e8f0; font-size: 14px; line-height: 1.6; padding-left: 20px; }
    .security-info li { margin-bottom: 8px; }
    .footer { background: rgba(15, 23, 42, 0.6); padding: 30px; text-align: center; border-top: 1px solid rgba(71, 85, 105, 0.3); }
    .footer p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
    .footer .company { font-weight: 600; color: #e2e8f0; }
    @media (max-width: 640px) { body { padding: 10px; } .content, .header, .footer { padding: 20px; } .header h1 { font-size: 24px; } .download-link { padding: 14px 24px; font-size: 15px; } }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">AT</div>
      <h1>Access Token Delivery</h1>
      <p>Secure credential transfer</p>
    </div>
    <div class="content">
      <div class="greeting">
        Hello,<br><br>
        Your requested access token has been generated and shared via email. Please find your secure access credentials below.
        <br><br>
        <strong style="color: #f59e0b;">⏱️ Important: This token is valid for only 5 minutes from the time of generation.</strong>
        <br><br>
        <span style="color:#38bdf8;font-weight:600;">📱 The OTP required for download has been sent to your registered mobile number via SMS.</span>
      </div>
      <div class="token-section">
        <div class="token-label">Your Access Token</div>
        <textarea class="token-display" id="tokenDisplay" readonly>${accessToken}</textarea>
        <button class="copy-button" onclick="copyToken(event)">
          📋 Copy Token
        </button>
      </div>
      <div class="download-section">
        <a href="${downloadUrl}" class="download-link" target="_blank">
          <div class="download-icon"></div>
          Download Token File
        </a>
      </div>
      <div class="security-info">
        <h3>Security Guidelines</h3>
        <ul>
          <li><strong>Time-sensitive:</strong> This token expires in 5 minutes and was shared via email</li>
          <li>Store this token securely and never share it publicly</li>
          <li>Use HTTPS connections when transmitting this token</li>
          <li>Contact support immediately if you suspect compromise</li>
          <li>Request a new token if this one has expired</li>
        </ul>
      </div>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        If you have any questions or need assistance, please don't hesitate to contact our support team. 
        This token provides access to your designated resources and should be treated as confidential information.
        <br><br>
        <strong style="color: #ef4444;">Please note: This access token was shared via email and expires 5 minutes after generation. Use it immediately to avoid expiration.</strong>
      </p>
    </div>
    <div class="footer">
      <p class="company">Your Company Name</p>
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>© 2025 Your Company. All rights reserved.</p>
    </div>
  </div>
  <script>
    function copyToken(event) {
      event.preventDefault();
      var tokenDisplay = document.getElementById('tokenDisplay');
      tokenDisplay.select();
      tokenDisplay.setSelectionRange(0, 99999);
      try {
        document.execCommand('copy');
        var button = document.querySelector('.copy-button');
        var originalText = button.innerHTML;
        button.innerHTML = '✅ Copied!';
        button.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
        setTimeout(function() {
          button.innerHTML = originalText;
          button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    }
  </script>
</body>
</html>
  `;
}

module.exports = { generateAccessTokenEmail };
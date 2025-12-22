// FILE 1: seal.js
// This handles: Seal generation, manuscript tracking, email integration

class SealSystem {
  constructor() {
    this.sealedManuscripts = {};
    this.shares = {};
    this.loadFromStorage();
  }

  /**
   * Generate SHA-256 hash of document content
   */
  async generateHash(content) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Seal a manuscript
   */
  async sealManuscript(projectId, projectTitle, content, author) {
    const hash = await this.generateHash(content);
    const timestamp = new Date().toISOString();
    const sealId = this.generateUniqueId();

    const seal = {
      id: sealId,
      projectId,
      projectTitle,
      author,
      hash,
      timestamp,
      status: 'SEALED',
      shares: []
    };

    this.sealedManuscripts[sealId] = seal;
    this.saveToStorage();

    return seal;
  }

  /**
   * Create a share link
   */
  createShareLink(sealId, recipientEmail, recipientName, message) {
    const shareToken = this.generateShareToken();
    const shareLink = `${window.location.origin}/read.html?token=${shareToken}`;

    const share = {
      id: this.generateUniqueId(),
      sealId,
      token: shareToken,
      shareLink,
      recipientEmail,
      recipientName,
      message,
      status: 'SENT',
      
      sentAt: new Date().toISOString(),
      openedAt: null,
      previewReadAt: null,
      codeRequestedAt: null,
      codeProvidedAt: null,
      fullAccessAt: null,
      
      accessCode: null,
      codeExpires: null,
      
      currentPage: 0,
      lastReadAt: null,
      
      messages: []
    };

    this.sealedManuscripts[sealId].shares.push(share.id);
    this.shares[share.id] = share;
    this.saveToStorage();

    return share;
  }

  /**
   * Log email open
   */
  logEmailOpen(shareToken) {
    const share = this.findShareByToken(shareToken);
    if (!share) return false;

    share.openedAt = new Date().toISOString();
    share.status = 'OPENED';
    this.saveToStorage();

    return true;
  }

  /**
   * Log preview read
   */
  logPreviewRead(shareToken) {
    const share = this.findShareByToken(shareToken);
    if (!share) return false;

    share.previewReadAt = new Date().toISOString();
    this.saveToStorage();

    return true;
  }

  /**
   * Request access code
   */
  requestAccessCode(shareToken) {
    const share = this.findShareByToken(shareToken);
    if (!share) return false;

    share.codeRequestedAt = new Date().toISOString();
    share.status = 'CODE_REQUESTED';
    this.saveToStorage();

    return share.id;
  }

  /**
   * Generate access code
   */
  generateAccessCode(shareId) {
    const share = this.shares[shareId];
    if (!share) return null;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    share.accessCode = code;
    share.codeExpires = expiresAt;
    share.codeProvidedAt = new Date().toISOString();
    share.status = 'CODE_PROVIDED';
    this.saveToStorage();

    return code;
  }

  /**
   * Verify access code
   */
  verifyAccessCode(shareToken, providedCode) {
    const share = this.findShareByToken(shareToken);
    if (!share) return false;

    if (!share.accessCode || share.accessCode !== providedCode) {
      return false;
    }

    if (new Date(share.codeExpires) < new Date()) {
      return false;
    }

    share.fullAccessAt = new Date().toISOString();
    share.status = 'FULL_ACCESS';
    this.saveToStorage();

    return true;
  }

  /**
   * Track reading progress
   */
  trackReadingProgress(shareToken, currentPage) {
    const share = this.findShareByToken(shareToken);
    if (!share) return false;

    share.currentPage = currentPage;
    share.lastReadAt = new Date().toISOString();
    share.status = 'READING';
    this.saveToStorage();

    return true;
  }

  /**
   * Add message
   */
  addMessage(shareId, senderName, senderEmail, content) {
    const share = this.shares[shareId];
    if (!share) return false;

    share.messages.push({
      id: this.generateUniqueId(),
      sender: senderName,
      senderEmail,
      content,
      timestamp: new Date().toISOString()
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Get share by token
   */
  getShareByToken(shareToken) {
    return this.findShareByToken(shareToken);
  }

  /**
   * Get manuscript
   */
  getManuscript(sealId) {
    return this.sealedManuscripts[sealId];
  }

  /**
   * Get all manuscripts
   */
  getAllManuscripts() {
    return Object.values(this.sealedManuscripts);
  }

  /**
   * Revoke access
   */
  revokeAccess(shareId) {
    const share = this.shares[shareId];
    if (!share) return false;

    share.status = 'REVOKED';
    share.accessCode = null;
    this.saveToStorage();

    return true;
  }

  /**
   * Helper: Find share by token
   */
  findShareByToken(token) {
    return Object.values(this.shares).find(s => s.token === token);
  }

  /**
   * Helper: Generate ID
   */
  generateUniqueId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now();
  }

  /**
   * Helper: Generate token
   */
  generateShareToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Save to storage
   */
  saveToStorage() {
    localStorage.setItem('sealedManuscripts', JSON.stringify(this.sealedManuscripts));
    localStorage.setItem('shares', JSON.stringify(this.shares));
  }

  /**
   * Load from storage
   */
  loadFromStorage() {
    const manuscripts = localStorage.getItem('sealedManuscripts');
    const shares = localStorage.getItem('shares');

    if (manuscripts) this.sealedManuscripts = JSON.parse(manuscripts);
    if (shares) this.shares = JSON.parse(shares);
  }

  /**
   * Generate certificate PDF
   */
  generateCertificatePDF(sealId) {
    const seal = this.sealedManuscripts[sealId];
    if (!seal) return null;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Georgia, serif; text-align: center; padding: 40px; }
          .certificate { border: 3px solid gold; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; font-size: 32px; }
          .seal-symbol { font-size: 60px; margin: 20px 0; }
          .detail { text-align: left; margin: 20px 0; padding: 10px; background: #f5f5f5; }
          .detail strong { display: inline-block; width: 150px; }
          .fingerprint { 
            background: #222; 
            color: #0f0; 
            padding: 10px; 
            font-family: monospace; 
            font-size: 12px; 
            word-break: break-all;
            margin: 20px 0;
          }
          .footer { margin-top: 40px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="seal-symbol">🔒</div>
          <h1>PROOF OF SOUL</h1>
          <h2>Certificate of Creation</h2>
          
          <div class="detail">
            <strong>Title:</strong> ${seal.projectTitle}
          </div>
          
          <div class="detail">
            <strong>Author:</strong> ${seal.author}
          </div>
          
          <div class="detail">
            <strong>Date Created:</strong> ${new Date(seal.timestamp).toLocaleDateString()}
          </div>
          
          <div class="detail">
            <strong>Time Created:</strong> ${new Date(seal.timestamp).toLocaleTimeString()}
          </div>
          
          <p>Document Fingerprint:</p>
          <div class="fingerprint">${seal.hash}</div>
          
          <p>This certificate proves that the above work was created by the stated author on the stated date and time.</p>
          
          <div class="footer">
            <p>Certified by The Writers Block</p>
            <p>${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Download certificate
   */
  downloadCertificate(sealId, filename) {
    const html = this.generateCertificatePDF(sealId);
    if (!html) return false;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
    element.setAttribute('download', filename || 'proof-of-soul.html');
    element.style.display = 'none';

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    return true;
  }
}

// Create global instance
const sealSystem = new SealSystem();
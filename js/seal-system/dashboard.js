// FILE 3: dashboard.js
// Dashboard for tracking manuscripts

class Dashboard {
  /**
   * Render dashboard
   */
  static renderDashboard() {
    const manuscripts = sealSystem.getAllManuscripts();

    if (manuscripts.length === 0) {
      return `
        <div style="text-align: center; padding: 60px 20px;">
          <h2>📚 No Manuscripts Yet</h2>
          <p style="color: #666;">Go to the editor and seal a manuscript to start tracking!</p>
        </div>
      `;
    }

    let html = `
      <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
        <h1>📨 Manuscript Tracking Dashboard</h1>
        
        <div style="display: grid; gap: 20px; margin-top: 20px;">
    `;

    manuscripts.forEach(manuscript => {
      html += Dashboard.renderManuscriptCard(manuscript);
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Render manuscript card
   */
  static renderManuscriptCard(manuscript) {
    const shares = manuscript.shares.map(shareId => sealSystem.shares[shareId]);
    const totalShares = shares.length;

    return `
      <div style="border: 1px solid #ddd; border-radius: 10px; padding: 20px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; border-bottom: 2px solid #f5f5f5; padding-bottom: 15px;">
          <div>
            <h2 style="margin: 0 0 5px 0;">${manuscript.projectTitle}</h2>
            <p style="margin: 0; color: #666; font-size: 14px;">By ${manuscript.author}</p>
            <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
              Sealed: ${new Date(manuscript.timestamp).toLocaleDateString()}
            </p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 24px;">🔒</p>
            <p style="margin: 5px 0 0 0; color: #22c55e; font-weight: bold; font-size: 12px;">SEALED</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px;">
          <div style="background: #f5f5f5; padding: 12px; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #6366f1;">${totalShares}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Shares</p>
          </div>
          <div style="background: #f5f5f5; padding: 12px; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #3b82f6;">${shares.filter(s => s.openedAt).length}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Opened</p>
          </div>
          <div style="background: #f5f5f5; padding: 12px; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #22c55e;">${shares.filter(s => s.fullAccessAt).length}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Full Access</p>
          </div>
        </div>

        <div>
          ${shares.map(share => Dashboard.renderShareRow(share)).join('')}
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px; padding-top: 20px; border-top: 2px solid #f5f5f5;">
          <button onclick="dashboard.downloadCertificate('${manuscript.id}')" style="padding: 10px 15px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">
            📄 Download Certificate
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render share row
   */
  static renderShareRow(share) {
    const statusText = share.status === 'SENT' ? '📧 Sent' : 
                       share.status === 'OPENED' ? '👁️ Opened' :
                       share.status === 'CODE_REQUESTED' ? '⏳ Wants Access' :
                       share.status === 'FULL_ACCESS' ? '🔓 Reading' :
                       share.status === 'READING' ? '📖 Reading' : '🚫 Revoked';

    return `
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div>
            <p style="margin: 0; font-weight: bold;">${share.recipientName}</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">${share.recipientEmail}</p>
          </div>
          <span style="background: #6366f1; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
            ${statusText}
          </span>
        </div>

        <div style="border-left: 3px solid #ddd; padding-left: 15px; margin: 15px 0; font-size: 12px;">
          ${share.sentAt ? `<p>✓ Sent: ${new Date(share.sentAt).toLocaleString()}</p>` : ''}
          ${share.openedAt ? `<p>✓ Opened: ${new Date(share.openedAt).toLocaleString()}</p>` : ''}
          ${share.previewReadAt ? `<p>✓ Preview read: ${new Date(share.previewReadAt).toLocaleString()}</p>` : ''}
          ${share.codeRequestedAt ? `<p>✓ Requested code: ${new Date(share.codeRequestedAt).toLocaleString()}</p>` : ''}
          ${share.fullAccessAt ? `<p>✓ Full access: ${new Date(share.fullAccessAt).toLocaleString()}</p>` : ''}
        </div>

        ${share.status === 'CODE_REQUESTED' ? `
          <button onclick="dashboard.approveAccess('${share.id}')" style="padding: 8px 12px; background: #22c55e; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
            ✅ Send Code
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Approve access
   */
  static approveAccess(shareId) {
    const code = sealSystem.generateAccessCode(shareId);
    alert(`✅ Access code: ${code}`);
    location.reload();
  }

  /**
   * Download certificate
   */
  static downloadCertificate(sealId) {
    sealSystem.downloadCertificate(sealId, `proof-of-soul-${sealId}.html`);
    alert('📄 Certificate downloaded!');
  }
}

// Create global instance
const dashboard = new Dashboard();
// FILE 2: messenger.js (FIXED)
// Messenger UI for sending manuscripts

class Messenger {
  constructor() {
    this.currentShare = null;
  }

  /**
   * Open messenger dialog
   */
  openMessengerDialog(projectId, projectTitle, authorName) {
    const html = `
      <div id="messengerModal" style="display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 10px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">📨 Send Manuscript</h2>
            <button onclick="document.getElementById('messengerModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">✕</button>
          </div>

          <form id="messengerForm" style="display: flex; flex-direction: column; gap: 15px;">
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>Manuscript:</strong> ${projectTitle}</p>
              <p style="margin: 5px 0;"><strong>Author:</strong> ${authorName}</p>
            </div>

            <div>
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Agent Email Address</label>
              <input type="email" id="agentEmail" placeholder="agent@literaryagency.com" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;" required>
            </div>

            <div>
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Agent Name</label>
              <input type="text" id="agentName" placeholder="Smith Johnson" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;" required>
            </div>

            <div>
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Agency (Optional)</label>
              <input type="text" id="agencyName" placeholder="Literary Agency Inc." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
            </div>

            <div>
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Your Message</label>
              <textarea id="authorMessage" placeholder="Hi Agent Smith, I think my book would be perfect for you..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; min-height: 120px; font-family: Arial, sans-serif;" required></textarea>
            </div>

            <div style="background: #eff6ff; padding: 12px; border-left: 4px solid #3b82f6; border-radius: 5px; font-size: 13px;">
              <p style="margin: 0;"><strong>ℹ️ What will happen:</strong></p>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Agent receives your manuscript email</li>
                <li>They can preview first 2 chapters</li>
                <li>If interested, they request full access</li>
                <li>You approve and provide a code</li>
                <li>You see their reading progress in real-time</li>
              </ul>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" onclick="document.getElementById('messengerModal').remove()" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Cancel</button>
              <button type="submit" style="padding: 10px 30px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                📨 Send Manuscript
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('messengerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendManuscript(
        projectId,
        projectTitle,
        authorName,
        document.getElementById('agentEmail').value,
        document.getElementById('agentName').value,
        document.getElementById('agencyName').value || 'Unknown Agency',
        document.getElementById('authorMessage').value
      );
    });
  }

  /**
   * Send manuscript to agent
   */
  async sendManuscript(projectId, projectTitle, authorName, agentEmail, agentName, agencyName, message) {
    const manuscripts = sealSystem.getAllManuscripts();
    const manuscript = manuscripts.find(m => m.projectId === projectId);

    if (!manuscript) {
      alert('❌ Error: Manuscript must be sealed first!');
      return;
    }

    const share = sealSystem.createShareLink(
      manuscript.id,
      agentEmail,
      agentName,
      message
    );

    const readLink = `${window.location.origin}/read.html?token=${share.token}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>📖 Manuscript Shared</h2>
        <p>Hi ${agentName},</p>
        <p><strong>${authorName}</strong> has shared a manuscript with you via <strong>The Writers Block</strong>.</p>
        <div style="background: #f5f5f5; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${projectTitle}</h3>
          <p style="margin: 5px 0;"><strong>Author:</strong> ${authorName}</p>
          <p style="margin: 5px 0;"><strong>Agency:</strong> ${agencyName}</p>
        </div>
        <h3>Author's Message:</h3>
        <blockquote style="background: #f9f9f9; padding: 15px; border-left: 3px solid #ccc; margin: 15px 0;">
          ${message.replace(/\n/g, '<br>')}
        </blockquote>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${readLink}" style="display: inline-block; padding: 12px 30px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            📖 VIEW MANUSCRIPT
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          This is a secure manuscript share. Only you can view it with this link.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 11px;">
          The Writers Block | Empowering Authors with Security and Control
        </p>
      </div>
    `;

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: agentEmail,
          subject: `${authorName} sent you a manuscript - ${projectTitle}`,
          html: emailHtml,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      document.getElementById('messengerModal').remove();
      alert(`✅ Email sent to ${agentEmail}!\n\nManuscript is being tracked!`);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error) {
      alert(`❌ Error: ${error.message}\n\nBut manuscript is sealed!`);
      console.error('Send error:', error);
      document.getElementById('messengerModal').remove();
    }
  }
}

// Create global instance
const messenger = new Messenger();
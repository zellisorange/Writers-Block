// FILE 2: messenger.js
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

    // Close dialog
    document.getElementById('messengerModal').remove();

    // Show success
    alert(`✅ Manuscript sent to ${agentEmail}! Check your dashboard for tracking updates.`);

    // Log event
    console.log('Manuscript sent:', {
      to: agentEmail,
      manuscript: projectTitle,
      link: readLink
    });
  }
}

// Create global instance
const messenger = new Messenger();
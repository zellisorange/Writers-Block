/* =====================================================
   THE BLOCK - Creative Writing PWA
   Core Application Logic - 2025 Edition
   Part of BIG LOVE Holdings
   ===================================================== */

// ============ APP STATE ============
const AppState = {
    currentProject: {
        id: null,
        title: '',
        content: '',
        createdAt: null,
        updatedAt: null,
        wordCount: 0,
        realm: 1
    },
    projects: [],
    compost: [],
    autoSaveTimer: null,
    isDirty: false,
    user: null,
    tier: 'free', // 'free' or 'pro'
    aiUsage: {
        lastReset: null,
        daysUsed: 0,
        onCooldown: false
    }
};

// ============ TIER LIMITS ============
const LIMITS = {
    free: {
        maxProjects: 3,
        aiDays: 3,
        aiCooldownHours: 72
    },
    pro: {
        maxProjects: Infinity,
        aiDays: Infinity,
        aiCooldownHours: 0
    }
};

// ============ DOM ELEMENTS ============
const DOM = {
    app: document.getElementById('app'),
    editor: document.getElementById('editor'),
    projectTitle: document.getElementById('project-title'),
    wordCount: document.getElementById('word-count'),
    saveStatus: document.getElementById('save-status'),
    realmIndicator: document.getElementById('realm-indicator'),
    btnNew: document.getElementById('btn-new'),
    btnProjects: document.getElementById('btn-projects'),
    btnCompost: document.getElementById('btn-compost'),
    btnMenu: document.getElementById('btn-menu'),
    btnLogout: document.getElementById('btn-logout'),
    sidebar: document.querySelector('.sidebar'),
    userName: document.getElementById('user-name'),
    userTier: document.getElementById('user-tier')
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('✦ THE BLOCK initializing...');
    init();
});
function init() {
    // Check if user is logged in
    if (!checkAuth()) {
        return; // Redirect to login
    }
    
    loadUserData();
    loadProjects();
    initEditor();
    bindEvents();
    updateWordCount();
    updateUserDisplay();
    checkAICooldown();
    console.log('✦ THE BLOCK ready');
}

// ============ AUTH CHECK ============
async function checkAuth() {
    try {
        const user = await SupabaseAuth.getUser();
        if (!user) {
            console.log('✦ No user found, redirecting to login...');
            window.location.href = 'auth.html';
            return false;
        }
        AppState.user = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            tier: user.user_metadata?.tier || 'free'
        };
        AppState.tier = AppState.user.tier;
        console.log('✦ User authenticated:', AppState.user.email);
        return true;
    } catch (error) {
        console.log('✦ Auth error, redirecting to login...');
        window.location.href = 'auth.html';
        return false;
    }
}

// ============ USER DISPLAY ============
function updateUserDisplay() {
    if (DOM.userName && AppState.user) {
        DOM.userName.textContent = AppState.user.name || 'Writer';
    }
    if (DOM.userTier) {
        DOM.userTier.textContent = AppState.tier.toUpperCase();
        DOM.userTier.className = 'tier-badge ' + AppState.tier;
    }
}

// ============ LOGOUT ============
async function handleLogout() {
    if (confirm('Sign out of THE BLOCK?')) {
        try {
            await SupabaseAuth.signOut();
            console.log('✦ Logged out');
            window.location.href = 'auth.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect anyway
            window.location.href = 'auth.html';
        }
    }
}


// ============ EDITOR FUNCTIONS ============
function initEditor() {
    if (!DOM.editor) return;
    
    DOM.editor.focus();
    
    const lastProjectId = localStorage.getItem('theblock_lastProject');
    if (lastProjectId) {
        loadProject(lastProjectId);
    } else if (AppState.projects.length > 0) {
        loadProject(AppState.projects[0].id);
    } else {
        createNewProject();
    }
}

function bindEvents() {
    // Editor input
    if (DOM.editor) {
        DOM.editor.addEventListener('input', handleEditorInput);
    }
    
    // Title input
    if (DOM.projectTitle) {
        DOM.projectTitle.addEventListener('input', handleTitleInput);
    }
    
    // Navigation buttons
    if (DOM.btnNew) {
        DOM.btnNew.addEventListener('click', handleNewProject);
    }
    if (DOM.btnProjects) {
        DOM.btnProjects.addEventListener('click', showProjectsModal);
    }
    if (DOM.btnCompost) {
        DOM.btnCompost.addEventListener('click', showCompostModal);
    }
    
// Mobile menu
    if (DOM.btnMenu) {
        DOM.btnMenu.addEventListener('click', toggleSidebar);
    }
    
    // Logout button
    if (DOM.btnLogout) {
        DOM.btnLogout.addEventListener('click', handleLogout);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Save before leaving
    window.addEventListener('beforeunload', saveCurrentProject);
}

function handleEditorInput() {
    AppState.isDirty = true;
    AppState.currentProject.content = DOM.editor.innerHTML;
    updateWordCount();
    updateSaveStatus('saving');
    
    // Auto-save after 1.5 seconds of inactivity
    clearTimeout(AppState.autoSaveTimer);
    AppState.autoSaveTimer = setTimeout(() => {
        saveCurrentProject();
    }, 1500);
    
    updateRealm();
}

function handleTitleInput() {
    AppState.isDirty = true;
    AppState.currentProject.title = DOM.projectTitle.value || 'Untitled';
    
    clearTimeout(AppState.autoSaveTimer);
    AppState.autoSaveTimer = setTimeout(() => {
        saveCurrentProject();
    }, 1500);
}

function handleKeyboardShortcuts(e) {
    // Cmd/Ctrl + S = Save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentProject();
    }
    
    // Cmd/Ctrl + N = New Project
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewProject();
    }
    
    // Escape = Close sidebar on mobile
    if (e.key === 'Escape' && DOM.sidebar) {
        DOM.sidebar.classList.remove('open');
    }
}

// ============ MOBILE SIDEBAR ============
function toggleSidebar() {
    if (DOM.sidebar) {
        DOM.sidebar.classList.toggle('open');
    }
}

// ============ WORD COUNT & REALM ============
function updateWordCount() {
    if (!DOM.editor || !DOM.wordCount) return;
    
    const text = DOM.editor.innerText || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const count = text.trim() === '' ? 0 : words.length;
    
    AppState.currentProject.wordCount = count;
    DOM.wordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;
}

function updateRealm() {
    if (!DOM.realmIndicator) return;
    
    const words = AppState.currentProject.wordCount;
    let realm = 1;
    
    if (words >= 5000) realm = 9;      // Crown - Mastery
    else if (words >= 3000) realm = 8; // Third Eye - Vision
    else if (words >= 2000) realm = 7; // Throat - Expression
    else if (words >= 1000) realm = 6; // Heart - Connection
    else if (words >= 500) realm = 5;  // Solar Plexus - Power
    else if (words >= 250) realm = 4;  // Sacral - Creation
    else if (words >= 100) realm = 3;  // Root - Foundation
    else if (words >= 50) realm = 2;   // Awakening
    else realm = 1;                     // Genesis
    
    AppState.currentProject.realm = realm;
    DOM.realmIndicator.textContent = realm;
}

// ============ SAVE STATUS ============
function updateSaveStatus(status) {
    if (!DOM.saveStatus) return;
    
    const states = {
        saving: { text: '○ Saving...', class: 'saving' },
        saved: { text: '✓ Saved', class: 'saved' },
        error: { text: '✕ Error', class: 'error' }
    };
    
    const state = states[status] || states.saved;
    DOM.saveStatus.textContent = state.text;
    DOM.saveStatus.className = 'save-status ' + state.class;
}

// ============ PROJECT MANAGEMENT ============
function handleNewProject() {
    // Check project limit for free tier
    if (AppState.tier === 'free' && AppState.projects.length >= LIMITS.free.maxProjects) {
        showUpgradeModal('projects');
        return;
    }
    
    createNewProject();
}

function createNewProject() {
    // Save current first
    if (AppState.isDirty) {
        saveCurrentProject();
    }
    
    const newProject = {
        id: generateId(),
        title: '',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: 0,
        realm: 1
    };
    
    AppState.currentProject = newProject;
    AppState.projects.push(newProject);
    AppState.isDirty = false;
    
    // Update UI
    if (DOM.editor) DOM.editor.innerHTML = '';
    if (DOM.projectTitle) DOM.projectTitle.value = '';
    if (DOM.wordCount) DOM.wordCount.textContent = '0 words';
    if (DOM.realmIndicator) DOM.realmIndicator.textContent = '1';
    
    saveProjects();
    localStorage.setItem('theblock_lastProject', newProject.id);
    
    if (DOM.editor) DOM.editor.focus();
    updateSaveStatus('saved');
    
    // Close sidebar on mobile
    if (DOM.sidebar) DOM.sidebar.classList.remove('open');
    
    console.log('✦ New project created:', newProject.id);
}

function saveCurrentProject() {
    if (!AppState.currentProject.id) return;
    
    AppState.currentProject.content = DOM.editor ? DOM.editor.innerHTML : '';
    AppState.currentProject.title = DOM.projectTitle ? DOM.projectTitle.value : 'Untitled';
    AppState.currentProject.updatedAt = new Date().toISOString();
    
    // Update in projects array
    const index = AppState.projects.findIndex(p => p.id === AppState.currentProject.id);
    if (index !== -1) {
        AppState.projects[index] = { ...AppState.currentProject };
    }
    
    saveProjects();
    localStorage.setItem('theblock_lastProject', AppState.currentProject.id);
    
    AppState.isDirty = false;
    updateSaveStatus('saved');
    
    console.log('✦ Saved:', AppState.currentProject.title || 'Untitled');
}

function loadProject(projectId) {
    const project = AppState.projects.find(p => p.id === projectId);
    
    if (project) {
        AppState.currentProject = { ...project };
        if (DOM.editor) DOM.editor.innerHTML = project.content;
        if (DOM.projectTitle) DOM.projectTitle.value = project.title;
        updateWordCount();
        updateRealm();
        localStorage.setItem('theblock_lastProject', projectId);
        updateSaveStatus('saved');
        
        console.log('✦ Loaded:', project.title || 'Untitled');
    }
}

function deleteProject(projectId) {
    const project = AppState.projects.find(p => p.id === projectId);
    
    if (project) {
        compostProject(project);
        AppState.projects = AppState.projects.filter(p => p.id !== projectId);
        saveProjects();
        
        if (AppState.currentProject.id === projectId) {
            if (AppState.projects.length > 0) {
                loadProject(AppState.projects[0].id);
            } else {
                createNewProject();
            }
        }
        
        console.log('✦ Composted:', project.title || 'Untitled');
    }
}

// ============ THE COMPOST BIN ============
function compostProject(project) {
    const compostItem = {
        ...project,
        compostedAt: new Date().toISOString(),
        nutrients: extractNutrients(project.content)
    };
    
    AppState.compost.push(compostItem);
    saveCompost();
    
    console.log('🌱 Nutrients extracted:', compostItem.nutrients);
}

function extractNutrients(content) {
    const text = content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 4);
    
    const frequency = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}

// ============ STORAGE ============
function saveProjects() {
    localStorage.setItem('theblock_projects', JSON.stringify(AppState.projects));
}

function loadProjects() {
    const saved = localStorage.getItem('theblock_projects');
    if (saved) {
        AppState.projects = JSON.parse(saved);
    }
    
    const savedCompost = localStorage.getItem('theblock_compost');
    if (savedCompost) {
        AppState.compost = JSON.parse(savedCompost);
    }
}

function saveCompost() {
    localStorage.setItem('theblock_compost', JSON.stringify(AppState.compost));
}

function loadUserData() {
    const userData = localStorage.getItem('theblock_user');
    if (userData) {
        AppState.user = JSON.parse(userData);
    }
    
    const tierData = localStorage.getItem('theblock_tier');
    if (tierData) {
        AppState.tier = tierData;
    }
    
    const aiUsage = localStorage.getItem('theblock_aiUsage');
    if (aiUsage) {
        AppState.aiUsage = JSON.parse(aiUsage);
    }
}

// ============ AI COOLDOWN (Free Tier) ============
function checkAICooldown() {
    if (AppState.tier === 'pro') {
        AppState.aiUsage.onCooldown = false;
        return;
    }
    
    const now = new Date();
    const lastReset = AppState.aiUsage.lastReset ? new Date(AppState.aiUsage.lastReset) : null;
    
    if (!lastReset) {
        // First time user
        AppState.aiUsage.lastReset = now.toISOString();
        AppState.aiUsage.daysUsed = 0;
        AppState.aiUsage.onCooldown = false;
        saveAIUsage();
        return;
    }
    
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
    
    if (AppState.aiUsage.onCooldown) {
        if (hoursSinceReset >= LIMITS.free.aiCooldownHours) {
            // Cooldown over, reset
            AppState.aiUsage.lastReset = now.toISOString();
            AppState.aiUsage.daysUsed = 0;
            AppState.aiUsage.onCooldown = false;
            saveAIUsage();
        }
    }
}

function useAI() {
    if (AppState.tier === 'pro') return true;
    
    if (AppState.aiUsage.onCooldown) {
        showUpgradeModal('ai');
        return false;
    }
    
    AppState.aiUsage.daysUsed++;
    
    if (AppState.aiUsage.daysUsed >= LIMITS.free.aiDays) {
        AppState.aiUsage.onCooldown = true;
        AppState.aiUsage.lastReset = new Date().toISOString();
    }
    
    saveAIUsage();
    return true;
}

function saveAIUsage() {
    localStorage.setItem('theblock_aiUsage', JSON.stringify(AppState.aiUsage));
}

// ============ MODALS ============
function showProjectsModal() {
    // Close sidebar on mobile
    if (DOM.sidebar) DOM.sidebar.classList.remove('open');
    
    // Remove existing modal if any
    const existingModal = document.getElementById('projects-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'projects-modal';
    modal.className = 'modal-overlay';
    
    const projectItems = AppState.projects.map(p => `
        <div class="project-item ${p.id === AppState.currentProject.id ? 'active' : ''}" data-id="${p.id}">
            <div class="project-info">
                <span class="project-name">${p.title || 'Untitled'}</span>
                <span class="project-meta">${p.wordCount} words · Realm ${p.realm || 1}</span>
            </div>
            <button class="project-delete" data-id="${p.id}" title="Compost this project">🌱</button>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Your Projects</h2>
                <span class="project-count">${AppState.projects.length}/${AppState.tier === 'free' ? '3' : '∞'}</span>
                <button class="modal-close" id="close-projects">✕</button>
            </div>
            <div class="modal-body">
                ${projectItems || '<p class="no-projects">No projects yet. Click "+ New Draft" to start!</p>'}
            </div>
            <div class="modal-footer">
                <button class="btn-primary" id="modal-new-project">+ New Draft</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind modal events
    document.getElementById('close-projects').addEventListener('click', closeProjectsModal);
    document.getElementById('modal-new-project').addEventListener('click', () => {
        closeProjectsModal();
        handleNewProject();
    });
    
    // Click on project to load
    modal.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('project-delete')) {
                loadProject(item.dataset.id);
                closeProjectsModal();
            }
        });
    });
    
    // Delete project
    modal.querySelectorAll('.project-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (confirm('Compost this project? (It will be saved in the Compost Bin)')) {
                deleteProject(id);
                showProjectsModal(); // Refresh modal
            }
        });
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProjectsModal();
    });
}

function closeProjectsModal() {
    const modal = document.getElementById('projects-modal');
    if (modal) modal.remove();
}

function showCompostModal() {
    const compostList = AppState.compost.map(c => 
        `🌱 ${c.title || 'Untitled'}\n   Nutrients: ${c.nutrients.slice(0, 5).join(', ')}`
    ).join('\n\n');
    
    alert(`🌱 Compost Bin\n\n"The nutrients will feed the next chapter."\n\n${compostList || 'Nothing composted yet!'}`);
    
    // Close sidebar on mobile
    if (DOM.sidebar) DOM.sidebar.classList.remove('open');
}

function showUpgradeModal(reason) {
    const messages = {
        projects: `You've reached the free limit of 3 projects!\n\nUpgrade to PRO for just $4.20/month:\n✦ Unlimited projects\n✦ Unlimited AI Muse\n✦ All premium features`,
        ai: `Your AI access is on cooldown (72 hours).\n\nUpgrade to PRO for just $4.20/month:\n✦ Unlimited AI Muse 24/7\n✦ No cooldowns ever\n✦ AI remembers your style`
    };
    
    alert(`✦ UPGRADE TO PRO\n\n${messages[reason]}`);
}

// ============ UTILITIES ============
function generateId() {
    return 'blk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============ THE MUSE (AI Placeholder) ============
const TheMuse = {
    async assist(prompt) {
        if (!useAI()) return null;
        
        console.log('✦ The Muse received:', prompt);
        // TODO: Integrate Claude/Gemini API
        return "The Muse is awakening...";
    },
    
    encourage() {
        const messages = [
            "Every word is a seed. Keep planting.",
            "You're ascending. Realm by realm.",
            "Trust the process. Trust yourself.",
            "Writer's Block is Writer's Gift.",
            "The Lux flows through your fingertips.",
            "Let it flow. Don't judge. Just write."
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }
};

// ============ GLOBAL EXPORT ============
window.TheBlock = {
    AppState,
    DOM,
    TheMuse,
    createNewProject,
    saveCurrentProject,
    loadProject,
    deleteProject,
    useAI
};

console.log('✦ Type TheBlock in console to explore');